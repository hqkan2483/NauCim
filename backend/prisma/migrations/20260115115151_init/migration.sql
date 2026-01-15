/*
  Warnings:

  - You are about to drop the `AssociationLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssociationLinkEnd` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneralizationClassRef` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GeneralizationLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Literal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RootPackage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AssociationLink";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AssociationLinkEnd";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Attribute";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Class";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GeneralizationClassRef";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GeneralizationLink";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Link";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Literal";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Package";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RootPackage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PackageModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "parentPackage" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,

    PRIMARY KEY ("id", "modelId"),
    CONSTRAINT "PackageModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageModel_parentId_modelId_fkey" FOREIGN KEY ("parentId", "modelId") REFERENCES "PackageModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackageProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "parentPackage" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,

    PRIMARY KEY ("id", "profileId"),
    CONSTRAINT "PackageProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackageProfile_parentId_profileId_fkey" FOREIGN KEY ("parentId", "profileId") REFERENCES "PackageProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "stereotype" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "isAbstract" BOOLEAN,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "modelId"),
    CONSTRAINT "ClassModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassModel_packageId_modelId_fkey" FOREIGN KEY ("packageId", "modelId") REFERENCES "PackageModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "stereotype" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "isAbstract" BOOLEAN,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "profileId"),
    CONSTRAINT "ClassProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassProfile_packageId_profileId_fkey" FOREIGN KEY ("packageId", "profileId") REFERENCES "PackageProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttributeModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "modelId"),
    CONSTRAINT "AttributeModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeModel_classId_modelId_fkey" FOREIGN KEY ("classId", "modelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttributeProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "profileId"),
    CONSTRAINT "AttributeProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttributeProfile_classId_profileId_fkey" FOREIGN KEY ("classId", "profileId") REFERENCES "ClassProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "modelId"),
    CONSTRAINT "LinkModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinkModel_classId_modelId_fkey" FOREIGN KEY ("classId", "modelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,

    PRIMARY KEY ("id", "profileId"),
    CONSTRAINT "LinkProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LinkProfile_classId_profileId_fkey" FOREIGN KEY ("classId", "profileId") REFERENCES "ClassProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiteralModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,

    PRIMARY KEY ("id", "modelId"),
    CONSTRAINT "LiteralModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiteralModel_classId_modelId_fkey" FOREIGN KEY ("classId", "modelId") REFERENCES "ClassModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiteralProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,

    PRIMARY KEY ("id", "profileId"),
    CONSTRAINT "LiteralProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiteralProfile_classId_profileId_fkey" FOREIGN KEY ("classId", "profileId") REFERENCES "ClassProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationLinkModel" (
    "linkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("linkId", "modelId"),
    CONSTRAINT "GeneralizationLinkModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationLinkProfile" (
    "linkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("linkId", "profileId"),
    CONSTRAINT "GeneralizationLinkProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationClassRefModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalizationLinkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    CONSTRAINT "GeneralizationClassRefModel_generalizationLinkId_modelId_fkey" FOREIGN KEY ("generalizationLinkId", "modelId") REFERENCES "GeneralizationLinkModel" ("linkId", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationClassRefProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalizationLinkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    CONSTRAINT "GeneralizationClassRefProfile_generalizationLinkId_profileId_fkey" FOREIGN KEY ("generalizationLinkId", "profileId") REFERENCES "GeneralizationLinkProfile" ("linkId", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLinkModel" (
    "linkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("linkId", "modelId"),
    CONSTRAINT "AssociationLinkModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLinkProfile" (
    "linkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',

    PRIMARY KEY ("linkId", "profileId"),
    CONSTRAINT "AssociationLinkProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLinkEndModel" (
    "linkEndId" TEXT NOT NULL PRIMARY KEY,
    "associationLinkId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "linkEndName" TEXT NOT NULL,
    "linkEndClassId" TEXT NOT NULL,
    "linkEndClassName" TEXT NOT NULL,
    "multiplicity" TEXT NOT NULL DEFAULT '',
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLinkEndModel_associationLinkId_modelId_fkey" FOREIGN KEY ("associationLinkId", "modelId") REFERENCES "AssociationLinkModel" ("linkId", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLinkEndProfile" (
    "linkEndId" TEXT NOT NULL PRIMARY KEY,
    "associationLinkId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "linkEndName" TEXT NOT NULL,
    "linkEndClassId" TEXT NOT NULL,
    "linkEndClassName" TEXT NOT NULL,
    "multiplicity" TEXT NOT NULL DEFAULT '',
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLinkEndProfile_associationLinkId_profileId_fkey" FOREIGN KEY ("associationLinkId", "profileId") REFERENCES "AssociationLinkProfile" ("linkId", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PackageModel_modelId_idx" ON "PackageModel"("modelId");

-- CreateIndex
CREATE INDEX "PackageModel_parentId_modelId_idx" ON "PackageModel"("parentId", "modelId");

-- CreateIndex
CREATE INDEX "PackageModel_name_idx" ON "PackageModel"("name");

-- CreateIndex
CREATE INDEX "PackageProfile_profileId_idx" ON "PackageProfile"("profileId");

-- CreateIndex
CREATE INDEX "PackageProfile_parentId_profileId_idx" ON "PackageProfile"("parentId", "profileId");

-- CreateIndex
CREATE INDEX "PackageProfile_name_idx" ON "PackageProfile"("name");

-- CreateIndex
CREATE INDEX "ClassModel_modelId_idx" ON "ClassModel"("modelId");

-- CreateIndex
CREATE INDEX "ClassModel_packageId_modelId_idx" ON "ClassModel"("packageId", "modelId");

-- CreateIndex
CREATE INDEX "ClassModel_name_idx" ON "ClassModel"("name");

-- CreateIndex
CREATE INDEX "ClassProfile_profileId_idx" ON "ClassProfile"("profileId");

-- CreateIndex
CREATE INDEX "ClassProfile_packageId_profileId_idx" ON "ClassProfile"("packageId", "profileId");

-- CreateIndex
CREATE INDEX "ClassProfile_name_idx" ON "ClassProfile"("name");

-- CreateIndex
CREATE INDEX "AttributeModel_modelId_idx" ON "AttributeModel"("modelId");

-- CreateIndex
CREATE INDEX "AttributeModel_classId_modelId_idx" ON "AttributeModel"("classId", "modelId");

-- CreateIndex
CREATE INDEX "AttributeModel_name_idx" ON "AttributeModel"("name");

-- CreateIndex
CREATE INDEX "AttributeProfile_profileId_idx" ON "AttributeProfile"("profileId");

-- CreateIndex
CREATE INDEX "AttributeProfile_classId_profileId_idx" ON "AttributeProfile"("classId", "profileId");

-- CreateIndex
CREATE INDEX "AttributeProfile_name_idx" ON "AttributeProfile"("name");

-- CreateIndex
CREATE INDEX "LinkModel_modelId_idx" ON "LinkModel"("modelId");

-- CreateIndex
CREATE INDEX "LinkModel_classId_modelId_idx" ON "LinkModel"("classId", "modelId");

-- CreateIndex
CREATE INDEX "LinkProfile_profileId_idx" ON "LinkProfile"("profileId");

-- CreateIndex
CREATE INDEX "LinkProfile_classId_profileId_idx" ON "LinkProfile"("classId", "profileId");

-- CreateIndex
CREATE INDEX "LiteralModel_modelId_idx" ON "LiteralModel"("modelId");

-- CreateIndex
CREATE INDEX "LiteralModel_classId_modelId_idx" ON "LiteralModel"("classId", "modelId");

-- CreateIndex
CREATE INDEX "LiteralModel_name_idx" ON "LiteralModel"("name");

-- CreateIndex
CREATE INDEX "LiteralProfile_profileId_idx" ON "LiteralProfile"("profileId");

-- CreateIndex
CREATE INDEX "LiteralProfile_classId_profileId_idx" ON "LiteralProfile"("classId", "profileId");

-- CreateIndex
CREATE INDEX "LiteralProfile_name_idx" ON "LiteralProfile"("name");

-- CreateIndex
CREATE INDEX "GeneralizationLinkModel_modelId_idx" ON "GeneralizationLinkModel"("modelId");

-- CreateIndex
CREATE INDEX "GeneralizationLinkProfile_profileId_idx" ON "GeneralizationLinkProfile"("profileId");

-- CreateIndex
CREATE INDEX "GeneralizationClassRefModel_generalizationLinkId_modelId_idx" ON "GeneralizationClassRefModel"("generalizationLinkId", "modelId");

-- CreateIndex
CREATE INDEX "GeneralizationClassRefModel_classId_idx" ON "GeneralizationClassRefModel"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralizationClassRefModel_generalizationLinkId_modelId_role_key" ON "GeneralizationClassRefModel"("generalizationLinkId", "modelId", "role");

-- CreateIndex
CREATE INDEX "GeneralizationClassRefProfile_generalizationLinkId_profileId_idx" ON "GeneralizationClassRefProfile"("generalizationLinkId", "profileId");

-- CreateIndex
CREATE INDEX "GeneralizationClassRefProfile_classId_idx" ON "GeneralizationClassRefProfile"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralizationClassRefProfile_generalizationLinkId_profileId_role_key" ON "GeneralizationClassRefProfile"("generalizationLinkId", "profileId", "role");

-- CreateIndex
CREATE INDEX "AssociationLinkModel_modelId_idx" ON "AssociationLinkModel"("modelId");

-- CreateIndex
CREATE INDEX "AssociationLinkProfile_profileId_idx" ON "AssociationLinkProfile"("profileId");

-- CreateIndex
CREATE INDEX "AssociationLinkEndModel_associationLinkId_modelId_idx" ON "AssociationLinkEndModel"("associationLinkId", "modelId");

-- CreateIndex
CREATE INDEX "AssociationLinkEndModel_linkEndClassId_idx" ON "AssociationLinkEndModel"("linkEndClassId");

-- CreateIndex
CREATE INDEX "AssociationLinkEndProfile_associationLinkId_profileId_idx" ON "AssociationLinkEndProfile"("associationLinkId", "profileId");

-- CreateIndex
CREATE INDEX "AssociationLinkEndProfile_linkEndClassId_idx" ON "AssociationLinkEndProfile"("linkEndClassId");
