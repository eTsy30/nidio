ALTER TABLE "RefreshToken" ADD COLUMN "jti" TEXT;

UPDATE "RefreshToken" SET "jti" = "id" WHERE "jti" IS NULL;

ALTER TABLE "RefreshToken" ALTER COLUMN "jti" SET NOT NULL;
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");
