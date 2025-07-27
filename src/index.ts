#!/usr/bin/env node
import { config } from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.js";

// Load environment variables from .env file
config();

async function main() {
  const { server, version } = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Plane MCP Server running on stdio: ${version}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
