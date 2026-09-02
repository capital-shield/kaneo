import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { archiveDoneTasks } from "../../apps/api/src/scheduler/auto-archive-done-tasks";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

async function getTask(taskId: string) {
  const task = await db.query.taskTable.findFirst({
    where: eq(schema.taskTable.id, taskId),
  });

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  return task;
}

describe("API integration: auto-archiving completed tasks", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("stamps completedAt on entry to a final column and clears it on exit", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    const [task] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Ship the thing",
        status: "to-do",
        columnId: columns.todo.id,
        number: 1,
      })
      .returning();

    expect(task.completedAt).toBeNull();

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const doneResponse = await app.request(`/api/task/status/${task.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });

    expect(doneResponse.status).toBe(200);
    const completedTask = await getTask(task.id);
    expect(completedTask.completedAt).toBeInstanceOf(Date);

    // Re-saving a completed task must not restart the clock.
    const stampedAt = completedTask.completedAt as Date;
    await app.request(`/api/task/status/${task.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    expect((await getTask(task.id)).completedAt).toEqual(stampedAt);

    const reopenResponse = await app.request(`/api/task/status/${task.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in-progress" }),
    });

    expect(reopenResponse.status).toBe(200);
    expect((await getTask(task.id)).completedAt).toBeNull();
  });

  it("archives tasks completed before the project threshold and leaves the rest", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    await db
      .update(schema.projectTable)
      .set({ autoArchiveDoneAfterDays: 7 })
      .where(eq(schema.projectTable.id, project.id));

    const [staleDoneTask] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Done last month",
        status: "done",
        columnId: columns.done.id,
        completedAt: new Date(Date.now() - 30 * DAY_MS),
        number: 1,
      })
      .returning();

    const [recentDoneTask] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Done yesterday",
        status: "done",
        columnId: columns.done.id,
        completedAt: new Date(Date.now() - DAY_MS),
        number: 2,
      })
      .returning();

    const [openTask] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Still going",
        status: "in-progress",
        columnId: columns.inProgress.id,
        number: 3,
      })
      .returning();

    await archiveDoneTasks();

    const archived = await getTask(staleDoneTask.id);
    expect(archived.status).toBe("archived");
    expect(archived.columnId).toBeNull();
    // Cleared so returning the task to a done column starts a fresh clock.
    expect(archived.completedAt).toBeNull();

    expect((await getTask(recentDoneTask.id)).status).toBe("done");
    expect((await getTask(openTask.id)).status).toBe("in-progress");
  });

  it("leaves projects without the setting untouched", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    const [task] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Done long ago",
        status: "done",
        columnId: columns.done.id,
        completedAt: new Date(Date.now() - 365 * DAY_MS),
        number: 1,
      })
      .returning();

    await archiveDoneTasks();

    expect((await getTask(task.id)).status).toBe("done");
  });

  it("ignores completed tasks in columns that are no longer final", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    await db
      .update(schema.projectTable)
      .set({ autoArchiveDoneAfterDays: 7 })
      .where(eq(schema.projectTable.id, project.id));

    await db
      .update(schema.columnTable)
      .set({ isFinal: false })
      .where(eq(schema.columnTable.id, columns.done.id));

    const [task] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        title: "Done long ago",
        status: "done",
        columnId: columns.done.id,
        completedAt: new Date(Date.now() - 30 * DAY_MS),
        number: 1,
      })
      .returning();

    await archiveDoneTasks();

    expect((await getTask(task.id)).status).toBe("done");
  });
});
