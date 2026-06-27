/*
  Warnings:

  - Added the required column `acceptedAt` to the `workspaceInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workspaceInvite" ADD COLUMN     "acceptedAt" TIMESTAMP(3) NOT NULL;
