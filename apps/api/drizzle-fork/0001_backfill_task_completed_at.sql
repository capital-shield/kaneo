-- Hand-written; not regenerated. Seeds tasks that were already sitting in a
-- final column when auto-archiving arrived, so the feature has a clock to work
-- from. Guarded on NULL so a replay cannot overwrite a real completion time.
UPDATE "task" SET "completed_at" = "task"."updated_at"
FROM "column"
WHERE "column"."project_id" = "task"."project_id"
  AND "column"."slug" = "task"."status"
  AND "column"."is_final" = true
  AND "task"."completed_at" IS NULL;
