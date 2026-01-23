/*
  Warnings:

  - Made the column `refModelId` on table `ClassProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `refModelItemId` on table `ClassProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "profileId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "stereotype" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "isAbstract" BOOLEAN,
    "refModelId" TEXT NOT NULL,
    "refModelItemId" TEXT NOT NULL,
    CONSTRAINT "ClassProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassProfile_packageId_profileId_fkey" FOREIGN KEY ("packageId", "profileId") REFERENCES "PackageProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassProfile_refModelItemId_refModelId_fkey" FOREIGN KEY ("refModelItemId", "refModelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClassProfile" ("details", "documentation", "documentationRu", "id", "isAbstract", "name", "packageId", "profileId", "refModelId", "refModelItemId", "srcId", "stereotype", "type") SELECT "details", "documentation", "documentationRu", "id", "isAbstract", "name", "packageId", "profileId", "refModelId", "refModelItemId", "srcId", "stereotype", "type" FROM "ClassProfile";
DROP TABLE "ClassProfile";
ALTER TABLE "new_ClassProfile" RENAME TO "ClassProfile";
CREATE INDEX "ClassProfile_profileId_idx" ON "ClassProfile"("profileId");
CREATE INDEX "ClassProfile_packageId_profileId_idx" ON "ClassProfile"("packageId", "profileId");
CREATE INDEX "ClassProfile_refModelId_refModelItemId_idx" ON "ClassProfile"("refModelId", "refModelItemId");
CREATE INDEX "ClassProfile_name_idx" ON "ClassProfile"("name");
CREATE UNIQUE INDEX "ClassProfile_id_profileId_key" ON "ClassProfile"("id", "profileId");
CREATE UNIQUE INDEX "ClassProfile_profileId_refModelItemId_refModelId_key" ON "ClassProfile"("profileId", "refModelItemId", "refModelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
