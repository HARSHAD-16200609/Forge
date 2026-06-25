/*
  Warnings:

  - You are about to drop the column `role` on the `channelMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "channelMember" DROP COLUMN "role",
ADD COLUMN     "isCreator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
