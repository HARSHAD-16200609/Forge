-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "avatarSeed" TEXT;

-- No backfill needed: the DiceBear fallback derives its seed from the user id
-- whenever "avatarSeed" is NULL, so existing users get a stable generated
-- avatar immediately.