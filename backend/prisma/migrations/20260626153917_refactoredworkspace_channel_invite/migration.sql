/*
  Warnings:

  - Added the required column `expiresAt` to the `channelInvite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverEmail` to the `channelInvite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `workspaceInvite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverEmail` to the `workspaceInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "channelInvite" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "receiverEmail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "workspaceInvite" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "receiverEmail" TEXT NOT NULL;
