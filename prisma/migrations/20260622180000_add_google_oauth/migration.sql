-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");
