ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;
--> statement-breakpoint
-- Existing users who already created businesses or reports don't need the tour.
UPDATE "users" SET "onboarding_completed_at" = now()
WHERE "onboarding_completed_at" IS NULL
  AND (
    EXISTS (SELECT 1 FROM "businesses" b WHERE b."user_id" = "users"."id")
    OR EXISTS (SELECT 1 FROM "reports" r WHERE r."user_id" = "users"."id")
  );
