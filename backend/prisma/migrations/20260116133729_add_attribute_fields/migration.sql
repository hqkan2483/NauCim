-- AlterTable
ALTER TABLE "AttributeModel" ADD COLUMN "dataTypeName" TEXT;
ALTER TABLE "AttributeModel" ADD COLUMN "initialValue" TEXT;
ALTER TABLE "AttributeModel" ADD COLUMN "stereotype" TEXT;

-- AlterTable
ALTER TABLE "AttributeProfile" ADD COLUMN "dataTypeName" TEXT;
ALTER TABLE "AttributeProfile" ADD COLUMN "initialValue" TEXT;
ALTER TABLE "AttributeProfile" ADD COLUMN "stereotype" TEXT;
