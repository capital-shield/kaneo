import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KaneoApiClient } from "./client/kaneo-api.js";
import { registerActivityTools } from "./tools/activities.js";
import { registerColumnTools } from "./tools/columns.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerSearchTools } from "./tools/search.js";
import { registerTaskTools } from "./tools/tasks.js";

async function main() {
  const apiUrl = process.env.KANEO_API_URL ?? "http://localhost:1337";
  const apiKey = process.env.KANEO_API_KEY;

  if (!apiKey) {
    console.error("Error: KANEO_API_KEY environment variable is required.");
    console.error("Generate an API key in your Kaneo workspace settings.");
    process.exit(1);
  }

  const client = new KaneoApiClient(apiUrl, apiKey);

  const server = new McpServer({
    name: "kaneo",
    version: "1.0.0",
  });

  registerProjectTools(server, client);
  registerTaskTools(server, client);
  registerColumnTools(server, client);
  registerActivityTools(server, client);
  registerSearchTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
