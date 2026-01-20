-- AlterTable
ALTER TABLE "AssociationLinkEndModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "AssociationLinkEndProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "AssociationLinkModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "AssociationLinkProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "AttributeModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "AttributeProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "ClassModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "ClassProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "GeneralizationLinkModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "GeneralizationLinkProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "LinkModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "LinkProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "LiteralModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "LiteralProfile" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "PackageModel" ADD COLUMN "srcId" TEXT;

-- AlterTable
ALTER TABLE "PackageProfile" ADD COLUMN "srcId" TEXT;
