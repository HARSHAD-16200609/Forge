/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `upload` will be added. If there are existing duplicate values, this will fail.
  - Made the column `publicId` on table `upload` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "upload" ALTER COLUMN "publicId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "upload_publicId_key" ON "upload"("publicId");
