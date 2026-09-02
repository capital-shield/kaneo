import { and, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import db from "../database";
import { columnTable, projectTable, taskTable } from "../database/schema";
import { publishEvent } from "../events";

const DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVED_STATUS = "archived";

async function archiveDoneTasksForProject(
  projectId: string,
  afterDays: number,
) {
  const finalColumns = await db
    .select({ slug: columnTable.slug })
    .from(columnTable)
    .where(
      and(eq(columnTable.projectId, projectId), eq(columnTable.isFinal, true)),
    );

  if (finalColumns.length === 0) {
    return 0;
  }

  const cutoff = new Date(Date.now() - afterDays * DAY_MS);

  // completedAt is cleared so a task dragged back out of the archive starts a
  // fresh clock instead of being archived again on the next run.
  const archivedTasks = await db
    .update(taskTable)
    .set({ status: ARCHIVED_STATUS, columnId: null, completedAt: null })
    .where(
      and(
        eq(taskTable.projectId, projectId),
        inArray(
          taskTable.status,
          finalColumns.map((column) => column.slug),
        ),
        isNotNull(taskTable.completedAt),
        lt(taskTable.completedAt, cutoff),
      ),
    )
    .returning({ id: taskTable.id });

  return archivedTasks.length;
}

export async function archiveDoneTasks(): Promise<{ degraded: boolean }> {
  const projects = await db
    .select({
      id: projectTable.id,
      autoArchiveDoneAfterDays: projectTable.autoArchiveDoneAfterDays,
    })
    .from(projectTable)
    .where(
      and(
        isNotNull(projectTable.autoArchiveDoneAfterDays),
        isNull(projectTable.archivedAt),
      ),
    );

  let degraded = false;

  for (const project of projects) {
    const afterDays = project.autoArchiveDoneAfterDays;

    if (!afterDays || afterDays <= 0) {
      continue;
    }

    // One unhappy project must not stop the rest of the batch; the run is
    // reported as degraded instead.
    try {
      const archivedCount = await archiveDoneTasksForProject(
        project.id,
        afterDays,
      );

      if (archivedCount > 0) {
        console.log(
          `📦 Auto-archived ${archivedCount} completed task(s) in project ${project.id}`,
        );
        await publishEvent("task-relation.refresh", { projectId: project.id });
      }
    } catch (error) {
      degraded = true;
      console.error(
        `Failed to auto-archive completed tasks in project ${project.id}:`,
        error,
      );
    }
  }

  return { degraded };
}
