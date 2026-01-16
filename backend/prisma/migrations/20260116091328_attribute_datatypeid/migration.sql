/*
  Warnings:

  - You are about to drop the column `type` on the `AttributeModel` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `AttributeProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttributeModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "modelId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataTypeId" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,
    CONSTRAINT "AttributeModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeModel_classId_modelId_fkey" FOREIGN KEY ("classId", "modelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeModel_dataTypeId_modelId_fkey" FOREIGN KEY ("dataTypeId", "modelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AttributeModel" ("classId", "details", "documentation", "documentationRu", "id", "modelId", "multiplicity", "name", "refModelId", "refModelItemId", "srcId") SELECT "classId", "details", "documentation", "documentationRu", "id", "modelId", "multiplicity", "name", "refModelId", "refModelItemId", "srcId" FROM "AttributeModel";
DROP TABLE "AttributeModel";
ALTER TABLE "new_AttributeModel" RENAME TO "AttributeModel";
CREATE INDEX "AttributeModel_modelId_idx" ON "AttributeModel"("modelId");
CREATE INDEX "AttributeModel_classId_modelId_idx" ON "AttributeModel"("classId", "modelId");
CREATE INDEX "AttributeModel_dataTypeId_modelId_idx" ON "AttributeModel"("dataTypeId", "modelId");
CREATE INDEX "AttributeModel_name_idx" ON "AttributeModel"("name");
CREATE TABLE "new_AttributeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "profileId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataTypeId" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,
    CONSTRAINT "AttributeProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeProfile_classId_profileId_fkey" FOREIGN KEY ("classId", "profileId") REFERENCES "ClassProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeProfile_dataTypeId_profileId_fkey" FOREIGN KEY ("dataTypeId", "profileId") REFERENCES "ClassProfile" ("id", "profileId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AttributeProfile" ("classId", "details", "documentation", "documentationRu", "id", "multiplicity", "name", "profileId", "refModelId", "refModelItemId", "srcId") SELECT "classId", "details", "documentation", "documentationRu", "id", "multiplicity", "name", "profileId", "refModelId", "refModelItemId", "srcId" FROM "AttributeProfile";
DROP TABLE "AttributeProfile";
ALTER TABLE "new_AttributeProfile" RENAME TO "AttributeProfile";
CREATE INDEX "AttributeProfile_profileId_idx" ON "AttributeProfile"("profileId");
CREATE INDEX "AttributeProfile_classId_profileId_idx" ON "AttributeProfile"("classId", "profileId");
CREATE INDEX "AttributeProfile_dataTypeId_profileId_idx" ON "AttributeProfile"("dataTypeId", "profileId");
CREATE INDEX "AttributeProfile_name_idx" ON "AttributeProfile"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
