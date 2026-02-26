import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type KaneoApiClient, toResult } from "../client/kaneo-api.js";

export function registerSearchTools(server: McpServer, client: KaneoApiClient) {
  server.registerTool(
    "search",
    {
      title:
        "Search across tasks, projects, workspaces, comments, and activities",
      inputSchema: z.object({
        q: z.string().describe("Search query"),
        workspaceId: z
          .string()
          .optional()
          .describe("Limit results to a workspace"),
        projectId: z.string().optional().describe("Limit results to a project"),
        type: z
          .enum(["task", "project", "workspace", "comment", "activity"])
          .optional()
          .describe("Limit to a specific entity type"),
        limit: z
          .number()
          .optional()
          .describe("Max number of results (default 10)"),
      }),
    },
    async ({ q, workspaceId, projectId, type, limit }) => {
      const params = new URLSearchParams({ q });
      if (workspaceId) params.set("workspaceId", workspaceId);
      if (projectId) params.set("projectId", projectId);
      if (type) params.set("type", type);
      if (limit !== undefined) params.set("limit", String(limit));
      return toResult(await client.get(`/api/search?${params.toString()}`));
    },
  );
}
