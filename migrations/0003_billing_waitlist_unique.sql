DELETE FROM "billing_waitlist_leads"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      row_number() OVER (
        PARTITION BY lower("email"), "plan"
        ORDER BY "created_at" ASC, "id" ASC
      ) AS "row_number"
    FROM "billing_waitlist_leads"
  ) AS "ranked_leads"
  WHERE "row_number" > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "billing_waitlist_leads_email_plan_unique" ON "billing_waitlist_leads" (lower("email"), "plan");
