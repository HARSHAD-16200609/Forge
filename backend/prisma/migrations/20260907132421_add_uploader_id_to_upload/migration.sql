/*
  Warnings:

  - Added the required column `uploaderId` to the `upload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "upload" ADD COLUMN     "uploaderId" TEXT NOT NULL;
