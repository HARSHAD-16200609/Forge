-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('S3', 'CLOUDINARY');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'ATTACHED', 'FAILED');

-- AlterTable
ALTER TABLE "upload"
  ADD COLUMN "storageProvider" "StorageProvider",
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "status" "UploadStatus";

-- Backfill existing rows: legacy rows were always Cloudinary, key = publicId.
UPDATE "upload"
SET
  "storageProvider" = 'CLOUDINARY',
  "storageKey" = "publicId",
  "status" = CASE
    WHEN "messageId" IS NULL THEN 'UPLOADED'::"UploadStatus"
    ELSE 'ATTACHED'::"UploadStatus"
  END;

-- AlterTable
ALTER TABLE "upload"
  ALTER COLUMN "storageProvider" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL;

-- CreateIndex
CREATE INDEX "upload_storageProvider_idx" ON "upload"("storageProvider");

-- CreateIndex
CREATE INDEX "upload_status_idx" ON "upload"("status");