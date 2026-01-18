-- CreateTable
CREATE TABLE "DiagramModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "modelId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "diagramType" TEXT,
    "diagramName" TEXT NOT NULL,
    "documentation" TEXT,
    "details" TEXT,
    "diagramBody" TEXT,
    CONSTRAINT "DiagramModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagramModel_packageId_modelId_fkey" FOREIGN KEY ("packageId", "modelId") REFERENCES "PackageModel" ("id", "modelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagramProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srcId" TEXT,
    "profileId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "diagramType" TEXT,
    "diagramName" TEXT NOT NULL,
    "documentation" TEXT,
    "details" TEXT,
    "diagramBody" TEXT,
    CONSTRAINT "DiagramProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiagramProfile_packageId_profileId_fkey" FOREIGN KEY ("packageId", "profileId") REFERENCES "PackageProfile" ("id", "profileId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DiagramModel_modelId_idx" ON "DiagramModel"("modelId");

-- CreateIndex
CREATE INDEX "DiagramModel_packageId_modelId_idx" ON "DiagramModel"("packageId", "modelId");

-- CreateIndex
CREATE INDEX "DiagramModel_diagramName_idx" ON "DiagramModel"("diagramName");

-- CreateIndex
CREATE INDEX "DiagramProfile_profileId_idx" ON "DiagramProfile"("profileId");

-- CreateIndex
CREATE INDEX "DiagramProfile_packageId_profileId_idx" ON "DiagramProfile"("packageId", "profileId");

-- CreateIndex
CREATE INDEX "DiagramProfile_diagramName_idx" ON "DiagramProfile"("diagramName");
