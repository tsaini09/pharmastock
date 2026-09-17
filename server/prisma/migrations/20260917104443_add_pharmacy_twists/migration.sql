-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicineId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "OutboxEvent_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "medicineId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "quarantined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Batch" ("batchNumber", "createdAt", "expiryDate", "id", "medicineId", "quantity") SELECT "batchNumber", "createdAt", "expiryDate", "id", "medicineId", "quantity" FROM "Batch";
DROP TABLE "Batch";
ALTER TABLE "new_Batch" RENAME TO "Batch";
CREATE INDEX "Batch_medicineId_expiryDate_idx" ON "Batch"("medicineId", "expiryDate");
CREATE TABLE "new_Medicine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "manufacturer" TEXT,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Medicine" ("createdAt", "genericName", "id", "manufacturer", "name") SELECT "createdAt", "genericName", "id", "manufacturer", "name" FROM "Medicine";
DROP TABLE "Medicine";
ALTER TABLE "new_Medicine" RENAME TO "Medicine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
