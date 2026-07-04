/*
  Warnings:

  - Made the column `senderId` on table `message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_senderId_fkey";

-- DropIndex
DROP INDEX "message_conversationId_idx";

-- AlterTable
ALTER TABLE "message" ALTER COLUMN "senderId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "message_conversationId_sentAt_idx" ON "message"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "message_parentMsgId_idx" ON "message"("parentMsgId");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
