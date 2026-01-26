/*
  Warnings:

  - You are about to drop the column `parentPackage` on the `PackageModel` table. All the data in the column will be lost.
  - You are about to drop the column `parentPackage` on the `PackageProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PackageModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "modelId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    CONSTRAINT "PackageModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageModel_parentId_modelId_fkey" FOREIGN KEY ("parentId", "modelId") REFERENCES "PackageModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PackageModel" ("details", "documentation", "documentationRu", "id", "modelId", "name", "parentId", "srcId", "type") SELECT "details", "documentation", "documentationRu", "id", "modelId", "name", "parentId", "srcId", "type" FROM "PackageModel";
DROP TABLE "PackageModel";
ALTER TABLE "new_PackageModel" RENAME TO "PackageModel";
CREATE INDEX "PackageModel_modelId_idx" ON "PackageModel"("modelId");
CREATE INDEX "PackageModel_parentId_modelId_idx" ON "PackageModel"("parentId", "modelId");
CREATE INDEX "PackageModel_name_idx" ON "PackageModel"("name");
CREATE UNIQUE INDEX "PackageModel_id_modelId_key" ON "PackageModel"("id", "modelId");
CREATE TABLE "new_PackageProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "profileId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    CONSTRAINT "PackageProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageProfile_parentId_profileId_fkey" FOREIGN KEY ("parentId", "profileId") REFERENCES "PackageProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PackageProfile" ("details", "documentation", "documentationRu", "id", "name", "parentId", "profileId", "srcId", "type") SELECT "details", "documentation", "documentationRu", "id", "name", "parentId", "profileId", "srcId", "type" FROM "PackageProfile";
DROP TABLE "PackageProfile";
ALTER TABLE "new_PackageProfile" RENAME TO "PackageProfile";
CREATE INDEX "PackageProfile_profileId_idx" ON "PackageProfile"("profileId");
CREATE INDEX "PackageProfile_parentId_profileId_idx" ON "PackageProfile"("parentId", "profileId");
CREATE INDEX "PackageProfile_name_idx" ON "PackageProfile"("name");
CREATE UNIQUE INDEX "PackageProfile_id_profileId_key" ON "PackageProfile"("id", "profileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
