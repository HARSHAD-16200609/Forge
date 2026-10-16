-- DropIndex
DROP INDEX "channelInvite_receiverId_channelId_key";

-- DropIndex
DROP INDEX "workspaceInvite_receiverId_workspaceId_key";

-- AlterTable
ALTER TABLE "channelInvite" ADD COLUMN     "token" TEXT,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workspaceInvite" ADD COLUMN     "token" TEXT,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- Backfill tokens for pre-existing invites
UPDATE "channelInvite" SET "token" = 'chi_' || replace(gen_random_uuid()::text, '-', '') WHERE "token" IS NULL;
UPDATE "workspaceInvite" SET "token" = 'wsi_' || replace(gen_random_uuid()::text, '-', '') WHERE "token" IS NULL;

-- AlterTable
ALTER TABLE "channelInvite" ALTER COLUMN "token" SET NOT NULL;

-- AlterTable
ALTER TABLE "workspaceInvite" ALTER COLUMN "token" SET NOT NULL;

-- AlterTable
ALTER TABLE "upload" ALTER COLUMN "storageProvider" SET DEFAULT 'CLOUDINARY',
ALTER COLUMN "status" SET DEFAULT 'UPLOADED';

-- CreateTable
CREATE TABLE "workspaceInviteLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,

    CONSTRAINT "workspaceInviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaceInviteLink_token_key" ON "workspaceInviteLink"("token");

-- CreateIndex
CREATE INDEX "workspaceInviteLink_workspaceId_idx" ON "workspaceInviteLink"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "channelInvite_token_key" ON "channelInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "channelInvite_receiverEmail_channelId_key" ON "channelInvite"("receiverEmail", "channelId") WHERE (status = 'PENDING'::"Status");

-- CreateIndex
CREATE UNIQUE INDEX "workspaceInvite_token_key" ON "workspaceInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "workspaceInvite_receiverEmail_workspaceId_key" ON "workspaceInvite"("receiverEmail", "workspaceId") WHERE (status = 'PENDING'::"Status");

-- AddForeignKey
ALTER TABLE "workspaceInviteLink" ADD CONSTRAINT "workspaceInviteLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaceInviteLink" ADD CONSTRAINT "workspaceInviteLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
