-- DropColumn: legacy OAuth fields from the intermediate schema, replaced by the OAuthAccount model
ALTER TABLE "user" DROP COLUMN IF EXISTS "emailVerified",
DROP COLUMN IF EXISTS "oauthId",
DROP COLUMN IF EXISTS "oauthProvider";

-- CreateEnum
CREATE TYPE "ProviderName" AS ENUM ('Google', 'Github');

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "provider" "ProviderName" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;