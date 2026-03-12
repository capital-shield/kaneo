import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type KaneoApiClient, toResult } from "../client/kaneo-api.js";

export function registerTaskTools(server: McpServer, client: KaneoApiClient) {
  server.registerTool(
    "list_tasks",
    {
      title: "List all tasks for a project, organized by columns",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
      }),
    },
    async ({ projectId }) => {
      return toResult(await client.get(`/api/task/tasks/${projectId}`));
    },
  );

  server.registerTool(
    "get_task",
    {
      title: "Get a specific task by ID",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
      }),
    },
    async ({ taskId }) => {
      return toResult(await client.get(`/api/task/${taskId}`));
    },
  );

  server.registerTool(
    "create_task",
    {
      title: "Create a new task in a project",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
        title: z.string().describe("Task title"),
        description: z.string().describe("Task description"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .describe("Task priority"),
        status: z.string().describe("Initial status (column name or slug)"),
        dueDate: z.string().optional().describe("Due date as ISO 8601 string"),
        userId: z.string().optional().describe("User ID to assign the task to"),
      }),
    },
    async ({ projectId, ...body }) => {
      return toResult(await client.post(`/api/task/${projectId}`, body));
    },
  );

  server.registerTool(
    "update_task_status",
    {
      title: "Update the status of a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        status: z.string().describe("New status value"),
      }),
    },
    async ({ taskId, status }) => {
      return toResult(
        await client.put(`/api/task/status/${taskId}`, { status }),
      );
    },
  );

  server.registerTool(
    "update_task_priority",
    {
      title: "Update the priority of a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .describe("New priority"),
      }),
    },
    async ({ taskId, priority }) => {
      return toResult(
        await client.put(`/api/task/priority/${taskId}`, { priority }),
      );
    },
  );

  server.registerTool(
    "assign_task",
    {
      title: "Assign a task to a user",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        userId: z.string().describe("The user ID to assign the task to"),
      }),
    },
    async ({ taskId, userId }) => {
      return toResult(
        await client.put(`/api/task/assignee/${taskId}`, { userId }),
      );
    },
  );

  server.registerTool(
    "update_task_title",
    {
      title: "Update the title of a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        title: z.string().describe("New title"),
      }),
    },
    async ({ taskId, title }) => {
      return toResult(await client.put(`/api/task/title/${taskId}`, { title }));
    },
  );

  server.registerTool(
    "update_task_description",
    {
      title: "Update the description of a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        description: z.string().describe("New description"),
      }),
    },
    async ({ taskId, description }) => {
      return toResult(
        await client.put(`/api/task/description/${taskId}`, { description }),
      );
    },
  );

  server.registerTool(
    "update_task_due_date",
    {
      title: "Update or clear the due date of a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        dueDate: z
          .string()
          .optional()
          .describe("New due date as ISO 8601 string, omit to clear"),
      }),
    },
    async ({ taskId, dueDate }) => {
      return toResult(
        await client.put(`/api/task/due-date/${taskId}`, { dueDate }),
      );
    },
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete a task by ID",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
      }),
    },
    async ({ taskId }) => {
      return toResult(await client.delete(`/api/task/${taskId}`));
    },
  );
}
