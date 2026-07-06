/*
  Warnings:

  - Added the required column `mimeType` to the `upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `upload` table without a default value. This is not possible if the table is not empty.
  - Made the column `fileType` on table `upload` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fileSize` to the `upload` table without a default value. This is not possible if the table is not empty.
  - Made the column `messageId` on table `upload` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "upload" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "url" TEXT NOT NULL,
ALTER COLUMN "fileType" SET NOT NULL,
DROP COLUMN "fileSize",
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ALTER COLUMN "messageId" SET NOT NULL;
