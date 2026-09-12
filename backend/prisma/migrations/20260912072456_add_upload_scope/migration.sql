-- AlterTable
ALTER TABLE "upload" ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "conversationId" TEXT;

-- CreateIndex
CREATE INDEX "upload_channelId_uploadedAt_idx" ON "upload"("channelId", "uploadedAt");

-- CreateIndex
CREATE INDEX "upload_conversationId_uploadedAt_idx" ON "upload"("conversationId", "uploadedAt");

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing uploads from their attached message's scope.
UPDATE "upload" u
SET "channelId" = m."channelId",
    "conversationId" = m."conversationId"
FROM "message" m
WHERE u."messageId" = m.id;
