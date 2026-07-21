/*
  Warnings:

  - Added the required column `workspaceId` to the `conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "workspaceId" TEXT NOT NULL;
