#!/usr/bin/env node
import { config } from "dotenv";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import express from "express";

import { createServer } from "./server.js";

// Load environment variables from .env file
config();

interface TransportMap {
  [sessionId: string]: SSEServerTransport;
}

async function main() {
  const app = express();
  app.use(express.json());

  // Configure CORS
  app.use(
    cors({
      origin: "*", // Allow all origins - adjust for production
      exposedHeaders: ["Mcp-Session-Id"],
    })
  );

  // Store transports by session ID
  const transports: TransportMap = {};

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", transport: "sse" });
  });

  // SSE endpoint - establishes the Server-Sent Events stream
  app.get("/sse", async (req, res) => {
    console.log("[SSE DEBUG] Received GET request to /sse - establishing SSE connection");
    const customSessionId = req.query.sessionId as string;

    try {
      const transport = new SSEServerTransport("/messages", res);
      const originalSessionId = transport.sessionId;
      
      // Use custom session ID if provided, otherwise use the generated one
      const sessionId = customSessionId || originalSessionId;
      
      console.log(`[SSE DEBUG] Original sessionId: ${originalSessionId}`);
      if (customSessionId) {
        console.log(`[SSE DEBUG] Using custom sessionId: ${sessionId}`);
        // Override the session ID in the transport
        (transport as any)._sessionId = sessionId;
      } else {
        console.log(`[SSE DEBUG] Using generated sessionId: ${sessionId}`);
      }

      // Store the transport
      transports[sessionId] = transport;

      // Set up cleanup when connection closes
      res.on("close", () => {
        console.log(`[SSE DEBUG] SSE connection closed for session ${sessionId}`);
        delete transports[sessionId];
      });

      // Set up error handling
      transport.onerror = (error) => {
        console.error(`[SSE DEBUG] Transport error for session ${sessionId}:`, error);
        delete transports[sessionId];
      };

      // Create and connect the MCP server
      const { server, version } = createServer();
      console.log(`[SSE DEBUG] Created MCP server, connecting to transport...`);
      await server.connect(transport);

      console.log(`[SSE DEBUG] Plane MCP Server (SSE) connected for session ${sessionId}: ${version}`);
    } catch (error) {
      console.error("[SSE DEBUG] Error establishing SSE connection:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to establish SSE connection",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // Messages endpoint - receives POST requests from the client
  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;

    console.log(`[SSE DEBUG] Received POST to /messages with sessionId: ${sessionId}`);
    console.log(`[SSE DEBUG] Request body:`, JSON.stringify(req.body, null, 2));

    if (!sessionId) {
      console.log(`[SSE DEBUG] Missing sessionId in request`);
      return res.status(400).json({
        error: "Missing sessionId query parameter",
      });
    }

    const transport = transports[sessionId];
    if (!transport) {
      console.log(`[SSE DEBUG] No transport found for sessionId: ${sessionId}`);
      console.log(`[SSE DEBUG] Available sessions:`, Object.keys(transports));
      return res.status(404).json({
        error: "Transport not found for sessionId",
        sessionId,
      });
    }

    console.log(`[SSE DEBUG] Found transport for session ${sessionId}, handling message`);
    try {
      await transport.handlePostMessage(req, res, req.body);
      console.log(`[SSE DEBUG] Successfully handled message for session ${sessionId}`);
    } catch (error) {
      console.error(`[SSE DEBUG] Error handling POST message for session ${sessionId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to handle message",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // Start the server
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.listen(PORT, (error?: Error) => {
    if (error) {
      console.error("Failed to start SSE server:", error);
      process.exit(1);
    }

    console.log(`Plane MCP SSE Server listening on port ${PORT}`);
    console.log(`
==============================================
PLANE MCP SERVER - SSE TRANSPORT
==============================================

Endpoints:
- Health check: GET http://localhost:${PORT}/health
- SSE stream:   GET http://localhost:${PORT}/sse  
- Messages:     POST http://localhost:${PORT}/messages?sessionId=<id>

Usage:
1. Establish SSE connection: GET /sse
2. Send MCP requests: POST /messages?sessionId=<session_id>

Environment Variables:
- PLANE_API_KEY: Your Plane API token (required)
- PLANE_WORKSPACE_SLUG: Your workspace slug (required)  
- PLANE_API_HOST_URL: API host (optional, defaults to https://api.plane.so/)
- PORT: Server port (optional, defaults to 3000)
==============================================
`);
  });

  // Handle server shutdown gracefully
  process.on("SIGINT", async () => {
    console.log("Shutting down SSE server...");

    // Close all active transports
    const sessionIds = Object.keys(transports);
    for (const sessionId of sessionIds) {
      try {
        console.log(`Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
    }

    console.log("SSE server shutdown complete");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    process.emit("SIGINT"); // Reuse SIGINT handler
  });
}

main().catch((error) => {
  console.error("Fatal error in SSE server main():", error);
  process.exit(1);
});
