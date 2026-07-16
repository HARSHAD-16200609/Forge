/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "conversation_idempotencyKey_key" ON "conversation"("idempotencyKey");
