# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `build/` directory and makes both executables
- **Lint**: `npm run lint` - Run ESLint on TypeScript files
- **Lint and fix**: `npm run lint:fix` - Run ESLint with auto-fix
- **Format**: `npm run format` - Format code with Prettier
- **Format check**: `npm run format:check` - Check code formatting without changing files
- **Full test suite**: `npm run test` - Runs lint, format check, build, and startup test
- **Test startup (stdio)**: `npm run test-startup` - Tests that the built stdio server starts correctly
- **Test startup (SSE)**: `npm run test-startup-sse` - Tests that the built SSE server starts correctly
- **Start SSE server**: `npm run start:sse` - Build and start the SSE server
- **Dev SSE server**: `npm run dev:sse` - Quick build and start SSE server for development
- **Single test**: No specific test runner configured - the project uses a startup test approach

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides integration with Plane's API. The architecture follows a modular tool-based pattern and supports both stdio and SSE transports:

### Core Structure
- **Stdio entry point**: `src/index.ts` - CLI executable that starts the MCP server via stdio transport
- **SSE entry point**: `src/sse-server.ts` - HTTP server that provides SSE transport with Express
- **Server creation**: `src/server.ts` - Creates and configures the McpServer instance (shared by both transports)
- **Tool registration**: `src/tools/index.ts` - Central registry that loads all available tools
- **Request handling**: `src/common/request-helper.ts` - Unified HTTP client for Plane API calls
- **Schema definitions**: `src/schemas.ts` - Zod schemas for all Plane API data types

### Transport Options
1. **stdio transport** (`plane-mcp-server`): Traditional MCP server using stdin/stdout for communication
2. **SSE transport** (`plane-mcp-sse-server`): HTTP server with Server-Sent Events for streaming and POST for client messages

### Tool Organization
Each major Plane entity has its own tool module in `src/tools/`:
- `user.ts` - User information tools
- `projects.ts` - Project management (get projects, create project)
- `metadata.ts` - Issue types, states, and labels management
- `issues.ts` - Issue creation, updates, comments
- `modules.ts` - Module management tools
- `module-issues.ts` - Tools for associating issues with modules
- `cycles.ts` - Cycle/sprint management tools  
- `cycle-issues.ts` - Tools for associating issues with cycles
- `work-log.ts` - Time tracking and work logging tools

### Key Patterns
- All tools follow MCP protocol using `@modelcontextprotocol/sdk`
- API requests use a centralized helper that handles authentication via `PLANE_API_KEY`
- Zod schemas provide type safety and validation for all API data structures
- Tools are registered individually but grouped by functional area
- Error handling is centralized in the request helper

### Environment Configuration
Required environment variables:
- `PLANE_API_KEY` - API token from Plane workspace settings
- `PLANE_WORKSPACE_SLUG` - Unique workspace identifier 
- `PLANE_API_HOST_URL` - API host (defaults to https://api.plane.so/)
- `PORT` - Port for SSE server (optional, defaults to 3000)

### Build System
- TypeScript compiled to ES2022 with NodeNext modules
- Output goes to `build/` directory
- Two executables: `build/index.js` (stdio) and `build/sse-server.js` (SSE)
- Uses ESLint with TypeScript support and Prettier for formatting

### SSE Server Usage
The SSE server provides HTTP endpoints for MCP communication:
- **Health check**: `GET /health` - Server status
- **SSE stream**: `GET /sse` - Establish Server-Sent Events connection
- **Messages**: `POST /messages?sessionId=<id>` - Send MCP requests

Basic SSE client flow:
1. Connect to `GET /sse` to establish stream and get session ID
2. Send MCP requests via `POST /messages?sessionId=<session_id>`
3. Receive responses via the SSE stream