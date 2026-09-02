import { sql } from "drizzle-orm";
import { taskTable } from "../database/schema";

/**
 * Value to write to `task.completed_at` when a task lands on a status.
 *
 * Tasks in a final column keep the timestamp of the first time they got there,
 * so re-saving a completed task doesn't restart the auto-archive clock. Tasks
 * moving anywhere else lose the timestamp, so coming back to a final column
 * starts the clock fresh.
 */
export function completedAtForStatus(isFinalColumn: boolean | undefined) {
  return isFinalColumn ? sql`COALESCE(${taskTable.completedAt}, now())` : null;
}

export function completedAtForNewTask(isFinalColumn: boolean | undefined) {
  return isFinalColumn ? new Date() : null;
}
