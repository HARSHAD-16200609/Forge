/*
  Warnings:

  - You are about to drop the `invite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_actorId_fkey";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_channelId_fkey";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "invite" DROP CONSTRAINT "invite_workspaceId_fkey";

-- DropTable
DROP TABLE "invite";

-- CreateTable
CREATE TABLE "workspaceInvite" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "workspaceInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channelInvite" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "channelInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaceInvite_receiverId_workspaceId_key" ON "workspaceInvite"("receiverId", "workspaceId") WHERE ("status" = 'PENDING');

-- CreateIndex
CREATE UNIQUE INDEX "channelInvite_receiverId_channelId_key" ON "channelInvite"("receiverId", "channelId") WHERE ("status" = 'PENDING');

-- AddForeignKey
ALTER TABLE "workspaceInvite" ADD CONSTRAINT "workspaceInvite_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaceInvite" ADD CONSTRAINT "workspaceInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaceInvite" ADD CONSTRAINT "workspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelInvite" ADD CONSTRAINT "channelInvite_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelInvite" ADD CONSTRAINT "channelInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelInvite" ADD CONSTRAINT "channelInvite_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
