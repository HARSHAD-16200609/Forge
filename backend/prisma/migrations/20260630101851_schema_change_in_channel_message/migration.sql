/*
  Warnings:

  - Added the required column `createdByWorkspaceMemberId` to the `channel` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "message_channelId_idx";

-- AlterTable
ALTER TABLE "channel" ADD COLUMN     "createdByWorkspaceMemberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "message" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "message_channelId_sentAt_idx" ON "message"("channelId", "sentAt");

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_createdByWorkspaceMemberId_fkey" FOREIGN KEY ("createdByWorkspaceMemberId") REFERENCES "workspaceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
