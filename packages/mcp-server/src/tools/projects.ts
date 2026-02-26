import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type KaneoApiClient, toResult } from "../client/kaneo-api.js";

export function registerProjectTools(
  server: McpServer,
  client: KaneoApiClient,
) {
  server.registerTool(
    "list_projects",
    {
      title: "List all projects in a workspace",
      inputSchema: z.object({
        workspaceId: z.string().describe("The workspace ID"),
      }),
    },
    async ({ workspaceId }) => {
      return toResult(
        await client.get(`/api/project?workspaceId=${workspaceId}`),
      );
    },
  );

  server.registerTool(
    "get_project",
    {
      title: "Get a specific project by ID",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
      }),
    },
    async ({ projectId }) => {
      return toResult(await client.get(`/api/project/${projectId}`));
    },
  );

  server.registerTool(
    "create_project",
    {
      title: "Create a new project in a workspace",
      inputSchema: z.object({
        workspaceId: z.string().describe("The workspace ID"),
        name: z.string().describe("Project name"),
        slug: z.string().describe("URL-friendly slug (e.g. my-project)"),
        icon: z.string().optional().describe("Icon name (default: Layout)"),
        description: z.string().optional().describe("Project description"),
      }),
    },
    async ({ workspaceId, name, slug, icon, description }) => {
      return toResult(
        await client.post("/api/project", {
          workspaceId,
          name,
          slug,
          icon,
          description,
        }),
      );
    },
  );

  server.registerTool(
    "update_project",
    {
      title: "Update a project's details",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
        name: z.string().optional().describe("New project name"),
        slug: z.string().optional().describe("New URL slug"),
        icon: z.string().optional().describe("New icon name"),
        description: z.string().optional().describe("New description"),
        isPublic: z
          .boolean()
          .optional()
          .describe("Whether the project is publicly viewable"),
      }),
    },
    async ({ projectId, ...body }) => {
      return toResult(await client.put(`/api/project/${projectId}`, body));
    },
  );

  server.registerTool(
    "delete_project",
    {
      title: "Delete a project by ID",
      inputSchema: z.object({
        projectId: z.string().describe("The project ID"),
      }),
    },
    async ({ projectId }) => {
      return toResult(await client.delete(`/api/project/${projectId}`));
    },
  );
}
