import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type KaneoApiClient, toResult } from "../client/kaneo-api.js";

export function registerColumnTools(server: McpServer, client: KaneoApiClient) {
  server.registerTool(
    "list_columns",
    {
      title: "Get all columns (statuses) for a project, ordered by position",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
      }),
    },
    async ({ projectId }) => {
      return toResult(await client.get(`/api/column/${projectId}`));
    },
  );

  server.registerTool(
    "create_column",
    {
      title: "Create a new column (status) in a project",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
        name: z.string().describe("Column name (e.g. In Review)"),
        icon: z.string().optional().describe("Icon name"),
        color: z.string().optional().describe("Column color (hex or name)"),
        isFinal: z
          .boolean()
          .optional()
          .describe("Whether this is a final/done column"),
      }),
    },
    async ({ projectId, ...body }) => {
      return toResult(await client.post(`/api/column/${projectId}`, body));
    },
  );

  server.registerTool(
    "update_column",
    {
      title: "Update a column's properties",
      inputSchema: z.object({
        columnId: z.string().describe("The column ID"),
        name: z.string().optional().describe("New column name"),
        icon: z.string().optional().describe("New icon name"),
        color: z.string().optional().describe("New color"),
        isFinal: z
          .boolean()
          .optional()
          .describe("Whether this is a final column"),
      }),
    },
    async ({ columnId, ...body }) => {
      return toResult(await client.put(`/api/column/${columnId}`, body));
    },
  );

  server.registerTool(
    "delete_column",
    {
      title: "Delete a column by ID",
      inputSchema: z.object({
        columnId: z.string().describe("The column ID"),
      }),
    },
    async ({ columnId }) => {
      return toResult(await client.delete(`/api/column/${columnId}`));
    },
  );
}
