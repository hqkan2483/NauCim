-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "createDate" TEXT NOT NULL,
    "modifyDate" TEXT NOT NULL,
    "accessRights" TEXT
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "version" TEXT NOT NULL,
    "createDate" TEXT NOT NULL,
    "modifyDate" TEXT NOT NULL,
    "legalState" TEXT,
    "legalAct" TEXT,
    "accessRights" TEXT,
    CONSTRAINT "Model_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "createDate" TEXT NOT NULL,
    "modifyDate" TEXT NOT NULL,
    "legalState" TEXT,
    "legalAct" TEXT,
    "accessRights" TEXT,
    CONSTRAINT "Profile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RootPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT,
    "profileId" TEXT,
    CONSTRAINT "RootPackage_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RootPackage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rootPackageId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "parentPackage" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "modelId" TEXT,
    "profileId" TEXT,
    CONSTRAINT "Package_rootPackageId_fkey" FOREIGN KEY ("rootPackageId") REFERENCES "RootPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Package_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "stereotype" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "isAbstract" BOOLEAN,
    "modelId" TEXT,
    "profileId" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,
    CONSTRAINT "Class_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "modelId" TEXT,
    "profileId" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,
    CONSTRAINT "Attribute_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "multiplicity" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "modelId" TEXT,
    "profileId" TEXT,
    "refModelId" TEXT,
    "refModelItemId" TEXT,
    CONSTRAINT "Link_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Literal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "documentation" TEXT,
    "documentationRu" TEXT,
    CONSTRAINT "Literal_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationLink" (
    "linkId" TEXT NOT NULL PRIMARY KEY,
    "rootPackageId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "GeneralizationLink_rootPackageId_fkey" FOREIGN KEY ("rootPackageId") REFERENCES "RootPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralizationClassRef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalizationLinkId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    CONSTRAINT "GeneralizationClassRef_generalizationLinkId_fkey" FOREIGN KEY ("generalizationLinkId") REFERENCES "GeneralizationLink" ("linkId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLink" (
    "linkId" TEXT NOT NULL PRIMARY KEY,
    "rootPackageId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLink_rootPackageId_fkey" FOREIGN KEY ("rootPackageId") REFERENCES "RootPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssociationLinkEnd" (
    "linkEndId" TEXT NOT NULL PRIMARY KEY,
    "associationLinkId" TEXT NOT NULL,
    "linkEndName" TEXT NOT NULL,
    "linkEndClassId" TEXT NOT NULL,
    "linkEndClassName" TEXT NOT NULL,
    "multiplicity" TEXT NOT NULL DEFAULT '',
    "documentation" TEXT,
    "documentationRu" TEXT,
    "details" TEXT,
    "stereotype" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "AssociationLinkEnd_associationLinkId_fkey" FOREIGN KEY ("associationLinkId") REFERENCES "AssociationLink" ("linkId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ModelProfiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ModelProfiles_A_fkey" FOREIGN KEY ("A") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ModelProfiles_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Model_projectId_idx" ON "Model"("projectId");

-- CreateIndex
CREATE INDEX "Model_name_idx" ON "Model"("name");

-- CreateIndex
CREATE INDEX "Profile_projectId_idx" ON "Profile"("projectId");

-- CreateIndex
CREATE INDEX "Profile_name_idx" ON "Profile"("name");

-- CreateIndex
CREATE INDEX "RootPackage_modelId_idx" ON "RootPackage"("modelId");

-- CreateIndex
CREATE INDEX "RootPackage_profileId_idx" ON "RootPackage"("profileId");

-- CreateIndex
CREATE INDEX "Package_rootPackageId_idx" ON "Package"("rootPackageId");

-- CreateIndex
CREATE INDEX "Package_parentId_idx" ON "Package"("parentId");

-- CreateIndex
CREATE INDEX "Package_name_idx" ON "Package"("name");

-- CreateIndex
CREATE INDEX "Class_packageId_idx" ON "Class"("packageId");

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Attribute_classId_idx" ON "Attribute"("classId");

-- CreateIndex
CREATE INDEX "Attribute_name_idx" ON "Attribute"("name");

-- CreateIndex
CREATE INDEX "Link_classId_idx" ON "Link"("classId");

-- CreateIndex
CREATE INDEX "Literal_classId_idx" ON "Literal"("classId");

-- CreateIndex
CREATE INDEX "Literal_name_idx" ON "Literal"("name");

-- CreateIndex
CREATE INDEX "GeneralizationLink_rootPackageId_idx" ON "GeneralizationLink"("rootPackageId");

-- CreateIndex
CREATE INDEX "GeneralizationClassRef_generalizationLinkId_idx" ON "GeneralizationClassRef"("generalizationLinkId");

-- CreateIndex
CREATE INDEX "GeneralizationClassRef_classId_idx" ON "GeneralizationClassRef"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralizationClassRef_generalizationLinkId_role_key" ON "GeneralizationClassRef"("generalizationLinkId", "role");

-- CreateIndex
CREATE INDEX "AssociationLink_rootPackageId_idx" ON "AssociationLink"("rootPackageId");

-- CreateIndex
CREATE INDEX "AssociationLinkEnd_associationLinkId_idx" ON "AssociationLinkEnd"("associationLinkId");

-- CreateIndex
CREATE INDEX "AssociationLinkEnd_linkEndClassId_idx" ON "AssociationLinkEnd"("linkEndClassId");

-- CreateIndex
CREATE UNIQUE INDEX "_ModelProfiles_AB_unique" ON "_ModelProfiles"("A", "B");

-- CreateIndex
CREATE INDEX "_ModelProfiles_B_index" ON "_ModelProfiles"("B");
