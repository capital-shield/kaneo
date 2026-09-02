ALTER TABLE "apikey" ALTER COLUMN "rate_limit_max" SET DEFAULT 10000;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "auto_archive_done_after_days" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
CREATE INDEX "task_completedAt_idx" ON "task" USING btree ("completed_at");--> statement-breakpoint
UPDATE "task" SET "completed_at" = "task"."updated_at"
FROM "column"
WHERE "column"."project_id" = "task"."project_id"
  AND "column"."slug" = "task"."status"
  AND "column"."is_final" = true;
