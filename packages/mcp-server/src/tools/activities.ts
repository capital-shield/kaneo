import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type KaneoApiClient, toResult } from "../client/kaneo-api.js";

export function registerActivityTools(
  server: McpServer,
  client: KaneoApiClient,
) {
  server.registerTool(
    "get_task_activities",
    {
      title: "Get all activities and comments for a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
      }),
    },
    async ({ taskId }) => {
      return toResult(await client.get(`/api/activity/${taskId}`));
    },
  );

  server.registerTool(
    "create_comment",
    {
      title: "Add a comment to a task",
      inputSchema: z.object({
        taskId: z.string().describe("The task ID"),
        comment: z.string().describe("Comment text"),
      }),
    },
    async ({ taskId, comment }) => {
      return toResult(
        await client.post("/api/activity/comment", { taskId, comment }),
      );
    },
  );

  server.registerTool(
    "update_comment",
    {
      title: "Edit an existing comment",
      inputSchema: z.object({
        activityId: z.string().describe("The activity/comment ID"),
        comment: z.string().describe("Updated comment text"),
      }),
    },
    async ({ activityId, comment }) => {
      return toResult(
        await client.put("/api/activity/comment", { activityId, comment }),
      );
    },
  );

  server.registerTool(
    "delete_comment",
    {
      title: "Delete a comment",
      inputSchema: z.object({
        activityId: z.string().describe("The activity/comment ID"),
      }),
    },
    async ({ activityId }) => {
      return toResult(
        await client.delete("/api/activity/comment", { activityId }),
      );
    },
  );
}
