const express = require("express");
const prisma = require("../prisma");
const authenticateToken = require("../middleware/auth");
const { sendReorderAlert } = require("../services/notificationService");

const router = express.Router();

router.use(authenticateToken);

// =====================================================
// HELPERS
// =====================================================

function startOfToday(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

// =====================================================
// CREATE MEDICINE
// POST /api/medicines
// =====================================================

router.post("/medicines", async (req, res) => {
  try {
    const {
      name,
      genericName,
      manufacturer,
      reorderThreshold = 0
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Medicine name is required"
      });
    }

    const parsedThreshold = parseInt(reorderThreshold);

    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      return res.status(400).json({
        message: "Reorder threshold must be zero or greater"
      });
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: String(name).trim(),
        genericName,
        manufacturer,
        reorderThreshold: parsedThreshold
      }
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create medicine"
    });
  }
});

// =====================================================
// GET MEDICINES
// Search + Pagination + Sorting
// GET /api/medicines
// =====================================================

router.get("/medicines", async (req, res) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "10",
      sortBy = "name",
      order = "asc"
    } = req.query;

    const pageNumber = Math.max(parseInt(page) || 1, 1);

    const limitNumber = Math.min(
      Math.max(parseInt(limit) || 10, 1),
      50
    );

    const skip = (pageNumber - 1) * limitNumber;

    const allowedSortFields = [
      "name",
      "genericName",
      "manufacturer",
      "createdAt"
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "name";

    const safeOrder = order === "desc" ? "desc" : "asc";

    const trimmedSearch = String(search).trim();

    const where = trimmedSearch
      ? {
          OR: [
            {
              name: {
                contains: trimmedSearch
              }
            },
            {
              genericName: {
                contains: trimmedSearch
              }
            },
            {
              manufacturer: {
                contains: trimmedSearch
              }
            }
          ]
        }
      : {};

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: {
          [safeSortBy]: safeOrder
        },
        include: {
          batches: true
        }
      }),

      prisma.medicine.count({
        where
      })
    ]);

    const today = startOfToday();

    const data = medicines.map((medicine) => {
      const sellableStock = medicine.batches
        .filter(
          (batch) =>
            !batch.quarantined &&
            batch.quantity > 0 &&
            batch.expiryDate >= today
        )
        .reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );

      const totalStock = medicine.batches
        .filter(
          (batch) =>
            !batch.quarantined &&
            batch.quantity > 0
        )
        .reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );

      return {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        reorderThreshold: medicine.reorderThreshold,
        sellableStock,
        totalStock
      };
    });

    res.json({
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch medicines"
    });
  }
});

// =====================================================
// GET SINGLE MEDICINE
// GET /api/medicines/:id
// =====================================================

router.get("/medicines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid medicine ID"
      });
    }

    const medicine = await prisma.medicine.findUnique({
      where: {
        id
      },
      include: {
        batches: {
          orderBy: {
            expiryDate: "asc"
          }
        }
      }
    });

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    const today = startOfToday();

    const sellableStock = medicine.batches
      .filter(
        (batch) =>
          !batch.quarantined &&
          batch.quantity > 0 &&
          batch.expiryDate >= today
      )
      .reduce(
        (sum, batch) => sum + batch.quantity,
        0
      );

    res.json({
      ...medicine,
      sellableStock
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch medicine"
    });
  }
});

// =====================================================
// UPDATE MEDICINE
// PATCH /api/medicines/:id
// =====================================================

router.patch("/medicines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid medicine ID"
      });
    }

    const {
      name,
      genericName,
      manufacturer,
      reorderThreshold
    } = req.body;

    const medicine = await prisma.medicine.findUnique({
      where: {
        id
      }
    });

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    let parsedThreshold;

    if (reorderThreshold !== undefined) {
      parsedThreshold = parseInt(reorderThreshold);

      if (isNaN(parsedThreshold) || parsedThreshold < 0) {
        return res.status(400).json({
          message: "Reorder threshold must be zero or greater"
        });
      }
    }

    const updated = await prisma.medicine.update({
      where: {
        id
      },
      data: {
        ...(name !== undefined && {
          name: String(name).trim()
        }),

        ...(genericName !== undefined && {
          genericName
        }),

        ...(manufacturer !== undefined && {
          manufacturer
        }),

        ...(parsedThreshold !== undefined && {
          reorderThreshold: parsedThreshold
        })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update medicine"
    });
  }
});

// =====================================================
// ADD BATCH
// POST /api/medicines/:id/batches
// =====================================================

router.post("/medicines/:id/batches", async (req, res) => {
  try {
    const medicineId = parseInt(req.params.id);

    const {
      batchNumber,
      quantity,
      expiryDate
    } = req.body;

    if (
      isNaN(medicineId) ||
      !batchNumber ||
      quantity === undefined ||
      !expiryDate
    ) {
      return res.status(400).json({
        message:
          "Medicine ID, batch number, quantity and expiry date are required"
      });
    }

    const parsedQuantity = parseInt(quantity);

    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }

    const parsedDate = new Date(expiryDate);

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid expiry date"
      });
    }

    const medicine = await prisma.medicine.findUnique({
      where: {
        id: medicineId
      }
    });

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    const batch = await prisma.batch.create({
      data: {
        medicineId,
        batchNumber: String(batchNumber).trim(),
        quantity: parsedQuantity,
        expiryDate: parsedDate
      }
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create batch"
    });
  }
});

// =====================================================
// DISPENSE MEDICINE
// FEFO = First Expiry, First Out
//
// POST /api/dispense
// =====================================================

router.post("/dispense", async (req, res) => {
  try {
    const {
      medicineId,
      quantity
    } = req.body;

    const parsedMedicineId = parseInt(medicineId);
    const requestedQuantity = parseInt(quantity);

    if (
      isNaN(parsedMedicineId) ||
      isNaN(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return res.status(400).json({
        message: "Valid medicineId and quantity are required"
      });
    }

    const today = startOfToday();

    // Everything below happens atomically.
    const result = await prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.findUnique({
        where: {
          id: parsedMedicineId
        }
      });

      if (!medicine) {
        throw new Error("MEDICINE_NOT_FOUND");
      }

      // FEFO:
      // - positive quantity
      // - not quarantined
      // - not expired
      // - earliest expiry first
      const batches = await tx.batch.findMany({
        where: {
          medicineId: parsedMedicineId,
          quantity: {
            gt: 0
          },
          quarantined: false,
          expiryDate: {
            gte: today
          }
        },
        orderBy: {
          expiryDate: "asc"
        }
      });

      const availableStock = batches.reduce(
        (sum, batch) => sum + batch.quantity,
        0
      );

      if (availableStock < requestedQuantity) {
        return {
          insufficient: true,
          availableStock,
          requestedQuantity
        };
      }

      let remaining = requestedQuantity;

      const usedBatches = [];

      for (const batch of batches) {
        if (remaining <= 0) {
          break;
        }

        const amountToDispense = Math.min(
          batch.quantity,
          remaining
        );

        await tx.batch.update({
          where: {
            id: batch.id
          },
          data: {
            quantity: {
              decrement: amountToDispense
            }
          }
        });

        await tx.dispense.create({
          data: {
            medicineId: parsedMedicineId,
            batchId: batch.id,
            quantity: amountToDispense
          }
        });

        usedBatches.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          quantity: amountToDispense,
          expiryDate: batch.expiryDate
        });

        remaining -= amountToDispense;
      }

      // Calculate remaining IN-DATE sellable stock.
      const remainingBatches = await tx.batch.findMany({
        where: {
          medicineId: parsedMedicineId,
          quantity: {
            gt: 0
          },
          quarantined: false,
          expiryDate: {
            gte: today
          }
        }
      });

      const currentSellableStock =
        remainingBatches.reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );

      let reorderAlert = null;

      // Create notification when stock is below threshold.
      if (
        medicine.reorderThreshold > 0 &&
        currentSellableStock < medicine.reorderThreshold
      ) {
        reorderAlert = await sendReorderAlert(
          medicine,
          currentSellableStock,
          tx
        );
      }

      return {
        insufficient: false,
        requestedQuantity,
        usedBatches,
        currentSellableStock,
        reorderAlert
      };
    });

    if (result.insufficient) {
      return res.status(400).json({
        message: "Insufficient in-date stock",
        availableStock: result.availableStock,
        requestedQuantity: result.requestedQuantity
      });
    }

    res.json({
      message: "Medicine dispensed successfully",
      requestedQuantity: result.requestedQuantity,
      usedBatches: result.usedBatches,
      currentSellableStock: result.currentSellableStock,
      reorderAlert: result.reorderAlert
    });
  } catch (error) {
    console.error(error);

    if (error.message === "MEDICINE_NOT_FOUND") {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.status(500).json({
      message: "Failed to dispense medicine"
    });
  }
});

// =====================================================
// EXPIRY ALERTS
//
// GET /api/alerts/expiring
// GET /api/alerts/expiring?days=30
// =====================================================

router.get("/alerts/expiring", async (req, res) => {
  try {
    const parsedDays = parseInt(req.query.days);
    const days =
      !isNaN(parsedDays) && parsedDays >= 0
        ? parsedDays
        : 30;

    const today = startOfToday();

    const alertDate = new Date(today);
    alertDate.setDate(
      alertDate.getDate() + days
    );

    const batches = await prisma.batch.findMany({
      where: {
        quantity: {
          gt: 0
        },
        quarantined: false,
        expiryDate: {
          gte: today,
          lte: endOfDay(alertDate)
        }
      },

      orderBy: {
        expiryDate: "asc"
      },

      include: {
        medicine: true
      }
    });

    res.json({
      days,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch expiry alerts"
    });
  }
});

// =====================================================
// T2 DAILY CLOCK JOB
//
// POST /api/clock
//
// Expired batches:
//     quantity > 0
//     expiryDate < supplied date
//     -> quarantined = true
//
// Expiring soon:
//     today <= expiryDate <= today + 7 days
// =====================================================

router.post("/clock", async (req, res) => {
  try {
    const inputDate =
      req.body.date || req.body.now;

    const now = inputDate
      ? new Date(inputDate)
      : new Date();

    if (isNaN(now.getTime())) {
      return res.status(400).json({
        message: "Invalid date"
      });
    }

    const today = startOfToday(now);

    const sevenDaysLater = new Date(today);

    sevenDaysLater.setDate(
      sevenDaysLater.getDate() + 7
    );

    const quarantineResult =
      await prisma.batch.updateMany({
        where: {
          expiryDate: {
            lt: today
          },
          quantity: {
            gt: 0
          },
          quarantined: false
        },
        data: {
          quarantined: true
        }
      });

    const expiringSoon =
      await prisma.batch.findMany({
        where: {
          quantity: {
            gt: 0
          },
          quarantined: false,
          expiryDate: {
            gte: today,
            lte: endOfDay(sevenDaysLater)
          }
        },

        include: {
          medicine: true
        },

        orderBy: {
          expiryDate: "asc"
        }
      });

    res.json({
      message: "Daily pharmacy job completed",

      date: today,

      expiredQuarantined:
        quarantineResult.count,

      expiringWithin7Days:
        expiringSoon.length,

      expiringBatches:
        expiringSoon.map((batch) => ({
          batchId: batch.id,
          medicineId: batch.medicineId,
          medicineName: batch.medicine.name,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate
        }))
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Clock job failed"
    });
  }
});

// =====================================================
// T4 MESSY BATCH IMPORT
//
// POST /api/medicines/:id/batches/import
//
// Handles:
// - null values
// - "10 units"
// - numeric quantities
// - dd/mm/yyyy
// - ISO dates
// - duplicate rows
//
// Returns:
// {
//   imported,
//   deduped,
//   rejected
// }
// =====================================================

router.post(
  "/medicines/:id/batches/import",
  async (req, res) => {
    try {
      const medicineId =
        parseInt(req.params.id);

      const rows =
        req.body.rows ||
        req.body.batches;

      if (isNaN(medicineId)) {
        return res.status(400).json({
          message: "Invalid medicine ID"
        });
      }

      if (!Array.isArray(rows)) {
        return res.status(400).json({
          message: "rows must be an array"
        });
      }

      const medicine =
        await prisma.medicine.findUnique({
          where: {
            id: medicineId
          }
        });

      if (!medicine) {
        return res.status(404).json({
          message: "Medicine not found"
        });
      }

      let imported = 0;
      let deduped = 0;
      let rejected = 0;

      const rejectedRows = [];
      const seen = new Set();

      for (const row of rows) {
        if (!row) {
          rejected++;

          rejectedRows.push({
            row,
            reason: "Empty row"
          });

          continue;
        }

        const batchNumber =
          row.batchNumber
            ? String(row.batchNumber).trim()
            : "";

        if (!batchNumber) {
          rejected++;

          rejectedRows.push({
            row,
            reason: "Missing batch number"
          });

          continue;
        }

        // Supports:
        // 10
        // "10"
        // "10 units"
        const quantityMatch =
          String(row.quantity || "")
            .match(/^\s*(\d+)/);

        if (!quantityMatch) {
          rejected++;

          rejectedRows.push({
            row,
            reason: "Invalid quantity"
          });

          continue;
        }

        const quantity =
          parseInt(quantityMatch[1]);

        if (
          isNaN(quantity) ||
          quantity <= 0
        ) {
          rejected++;

          rejectedRows.push({
            row,
            reason:
              "Quantity must be greater than zero"
          });

          continue;
        }

        const rawDate =
          String(row.expiryDate || "")
            .trim();

        if (!rawDate) {
          rejected++;

          rejectedRows.push({
            row,
            reason: "Missing expiry date"
          });

          continue;
        }

        let expiryDate;

        // dd/mm/yyyy
        const ddmmyyyy =
          rawDate.match(
            /^(\d{2})\/(\d{2})\/(\d{4})$/
          );

        if (ddmmyyyy) {
          const [, day, month, year] =
            ddmmyyyy;

          expiryDate = new Date(
            `${year}-${month}-${day}T00:00:00`
          );
        } else {
          // ISO date
          expiryDate =
            new Date(rawDate);
        }

        if (
          isNaN(expiryDate.getTime())
        ) {
          rejected++;

          rejectedRows.push({
            row,
            reason: "Invalid expiry date"
          });

          continue;
        }

        // Reject impossible calendar dates
        // such as 31/02/2026.
        if (ddmmyyyy) {
          const [, day, month, year] =
            ddmmyyyy;

          if (
            expiryDate.getFullYear() !==
              parseInt(year) ||
            expiryDate.getMonth() + 1 !==
              parseInt(month) ||
            expiryDate.getDate() !==
              parseInt(day)
          ) {
            rejected++;

            rejectedRows.push({
              row,
              reason:
                "Invalid calendar date"
            });

            continue;
          }
        }

        const dedupeKey =
          `${batchNumber.toLowerCase()}|` +
          `${quantity}|` +
          `${expiryDate
            .toISOString()
            .slice(0, 10)}`;

        // Duplicate within this import.
        if (seen.has(dedupeKey)) {
          deduped++;
          continue;
        }

        seen.add(dedupeKey);

        // Existing batch in database.
        const existing =
          await prisma.batch.findFirst({
            where: {
              medicineId,
              batchNumber
            }
          });

        if (existing) {
          deduped++;
          continue;
        }

        await prisma.batch.create({
          data: {
            medicineId,
            batchNumber,
            quantity,
            expiryDate,
            quarantined: false
          }
        });

        imported++;
      }

      res.status(201).json({
        message:
          "Batch import completed",
        imported,
        deduped,
        rejected,
        rejectedRows
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Batch import failed"
      });
    }
  }
);

// =====================================================
// NOTIFICATION OUTBOX
//
// GET /api/outbox
// =====================================================

router.get("/outbox", async (req, res) => {
  try {
    const events =
      await prisma.outboxEvent.findMany({
        orderBy: {
          createdAt: "desc"
        },

        include: {
          medicine: true
        }
      });

    res.json({
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to fetch notification outbox"
    });
  }
});

// =====================================================

module.exports = router;