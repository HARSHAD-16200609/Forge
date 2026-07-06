/*
  Warnings:

  - The values [DOC,IMG,VID,AUD] on the enum `fType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "fType_new" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'OTHER');
ALTER TABLE "upload" ALTER COLUMN "fileType" TYPE "fType_new" USING ("fileType"::text::"fType_new");
ALTER TYPE "fType" RENAME TO "fType_old";
ALTER TYPE "fType_new" RENAME TO "fType";
DROP TYPE "public"."fType_old";
COMMIT;
