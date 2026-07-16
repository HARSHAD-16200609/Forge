/*
  Warnings:

  - Added the required column `idempotencyKey` to the `conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "conversationMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "conversationMember_userId_idx" ON "conversationMember"("userId");

-- CreateIndex
CREATE INDEX "conversationMember_convoId_idx" ON "conversationMember"("convoId");
