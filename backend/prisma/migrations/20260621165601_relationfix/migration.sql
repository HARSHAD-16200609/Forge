/*
  Warnings:

  - You are about to drop the column `recieverId` on the `invite` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `channel` table without a default value. This is not possible if the table is not empty.
  - Made the column `workspaceId` on table `channel` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `invite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `workspace` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "channel" DROP CONSTRAINT "channel_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "channelMember" DROP CONSTRAINT "channelMember_workspaceMemberId_fkey";

-- DropForeignKey
ALTER TABLE "conversationMember" DROP CONSTRAINT "conversationMember_convoId_fkey";

-- DropForeignKey
ALTER TABLE "conversationMember" DROP CONSTRAINT "conversationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_recieverId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_parentMsgId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_actorId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_receipentId_fkey";

-- DropForeignKey
ALTER TABLE "reaction" DROP CONSTRAINT "reaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "upload" DROP CONSTRAINT "upload_messageId_fkey";

-- AlterTable
ALTER TABLE "channel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "workspaceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "invite" DROP COLUMN "recieverId",
ADD COLUMN     "receiverId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "message" ALTER COLUMN "senderId" DROP NOT NULL,
ALTER COLUMN "parentMsgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notification" ALTER COLUMN "actorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "upload" ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "message_channelId_idx" ON "message"("channelId");

-- CreateIndex
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_parentMsgId_fkey" FOREIGN KEY ("parentMsgId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelMember" ADD CONSTRAINT "channelMember_workspaceMemberId_fkey" FOREIGN KEY ("workspaceMemberId") REFERENCES "workspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationMember" ADD CONSTRAINT "conversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationMember" ADD CONSTRAINT "conversationMember_convoId_fkey" FOREIGN KEY ("convoId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_receipentId_fkey" FOREIGN KEY ("receipentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
