const prisma = require("../prisma");

async function sendReorderAlert(medicine, currentStock, db = prisma) {
  const message =
    `${medicine.name} is low on stock. ` +
    `In-date stock: ${currentStock}. ` +
    `Reorder threshold: ${medicine.reorderThreshold}.`;

  const event = await db.outboxEvent.create({
    data: {
      medicineId: medicine.id,
      type: "REORDER_ALERT",
      message,
      payload: JSON.stringify({
        medicineId: medicine.id,
        medicineName: medicine.name,
        currentStock,
        threshold: medicine.reorderThreshold
      })
    }
  });

  return event;
}

module.exports = {
  sendReorderAlert
};