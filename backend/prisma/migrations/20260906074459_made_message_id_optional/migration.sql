/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,idempotencyKey]` on the table `conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "upload" ALTER COLUMN "messageId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "conversation_workspaceId_idempotencyKey_key" ON "conversation"("workspaceId", "idempotencyKey");
