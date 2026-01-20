/*
  Warnings:

  - You are about to drop the column `className` on the `GeneralizationClassRefModel` table. All the data in the column will be lost.
  - You are about to drop the column `className` on the `GeneralizationClassRefProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneralizationClassRefModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalizationLinkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    CONSTRAINT "GeneralizationClassRefModel_generalizationLinkId_modelId_fkey" FOREIGN KEY ("generalizationLinkId", "modelId") REFERENCES "GeneralizationLinkModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneralizationClassRefModel" ("classId", "generalizationLinkId", "id", "modelId", "role") SELECT "classId", "generalizationLinkId", "id", "modelId", "role" FROM "GeneralizationClassRefModel";
DROP TABLE "GeneralizationClassRefModel";
ALTER TABLE "new_GeneralizationClassRefModel" RENAME TO "GeneralizationClassRefModel";
CREATE INDEX "GeneralizationClassRefModel_generalizationLinkId_modelId_idx" ON "GeneralizationClassRefModel"("generalizationLinkId", "modelId");
CREATE INDEX "GeneralizationClassRefModel_classId_idx" ON "GeneralizationClassRefModel"("classId");
CREATE UNIQUE INDEX "GeneralizationClassRefModel_generalizationLinkId_modelId_role_key" ON "GeneralizationClassRefModel"("generalizationLinkId", "modelId", "role");
CREATE TABLE "new_GeneralizationClassRefProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalizationLinkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    CONSTRAINT "GeneralizationClassRefProfile_generalizationLinkId_profileId_fkey" FOREIGN KEY ("generalizationLinkId", "profileId") REFERENCES "GeneralizationLinkProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneralizationClassRefProfile" ("classId", "generalizationLinkId", "id", "profileId", "role") SELECT "classId", "generalizationLinkId", "id", "profileId", "role" FROM "GeneralizationClassRefProfile";
DROP TABLE "GeneralizationClassRefProfile";
ALTER TABLE "new_GeneralizationClassRefProfile" RENAME TO "GeneralizationClassRefProfile";
CREATE INDEX "GeneralizationClassRefProfile_generalizationLinkId_profileId_idx" ON "GeneralizationClassRefProfile"("generalizationLinkId", "profileId");
CREATE INDEX "GeneralizationClassRefProfile_classId_idx" ON "GeneralizationClassRefProfile"("classId");
CREATE UNIQUE INDEX "GeneralizationClassRefProfile_generalizationLinkId_profileId_role_key" ON "GeneralizationClassRefProfile"("generalizationLinkId", "profileId", "role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
