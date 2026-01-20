/*
  Warnings:

  - You are about to drop the column `linkEndClassName` on the `AssociationLinkEndModel` table. All the data in the column will be lost.
  - You are about to drop the column `linkEndClassName` on the `AssociationLinkEndProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssociationLinkEndModel" (
    "linkEndId" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "associationLinkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "linkEndName" TEXT NOT NULL,
    "linkEndClassId" TEXT NOT NULL,
    "multiplicity" TEXT NOT NULL DEFAULT '',
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLinkEndModel_associationLinkId_modelId_fkey" FOREIGN KEY ("associationLinkId", "modelId") REFERENCES "AssociationLinkModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssociationLinkEndModel" ("associationLinkId", "details", "documentation", "documentationRu", "linkEndClassId", "linkEndId", "linkEndName", "modelId", "multiplicity", "srcId", "stereotype") SELECT "associationLinkId", "details", "documentation", "documentationRu", "linkEndClassId", "linkEndId", "linkEndName", "modelId", "multiplicity", "srcId", "stereotype" FROM "AssociationLinkEndModel";
DROP TABLE "AssociationLinkEndModel";
ALTER TABLE "new_AssociationLinkEndModel" RENAME TO "AssociationLinkEndModel";
CREATE INDEX "AssociationLinkEndModel_associationLinkId_modelId_idx" ON "AssociationLinkEndModel"("associationLinkId", "modelId");
CREATE INDEX "AssociationLinkEndModel_linkEndClassId_idx" ON "AssociationLinkEndModel"("linkEndClassId");
CREATE TABLE "new_AssociationLinkEndProfile" (
    "linkEndId" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "associationLinkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "linkEndName" TEXT NOT NULL,
    "linkEndClassId" TEXT NOT NULL,
    "multiplicity" TEXT NOT NULL DEFAULT '',
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLinkEndProfile_associationLinkId_profileId_fkey" FOREIGN KEY ("associationLinkId", "profileId") REFERENCES "AssociationLinkProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssociationLinkEndProfile" ("associationLinkId", "details", "documentation", "documentationRu", "linkEndClassId", "linkEndId", "linkEndName", "multiplicity", "profileId", "srcId", "stereotype") SELECT "associationLinkId", "details", "documentation", "documentationRu", "linkEndClassId", "linkEndId", "linkEndName", "multiplicity", "profileId", "srcId", "stereotype" FROM "AssociationLinkEndProfile";
DROP TABLE "AssociationLinkEndProfile";
ALTER TABLE "new_AssociationLinkEndProfile" RENAME TO "AssociationLinkEndProfile";
CREATE INDEX "AssociationLinkEndProfile_associationLinkId_profileId_idx" ON "AssociationLinkEndProfile"("associationLinkId", "profileId");
CREATE INDEX "AssociationLinkEndProfile_linkEndClassId_idx" ON "AssociationLinkEndProfile"("linkEndClassId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
