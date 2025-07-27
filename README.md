# Plane MCP Server (SSE)





The Plane MCP Server brings the power of Model Context Protocol (MCP) to Plane using Server-Sent Events (SSE) transport, allowing AI agents and developer tools to interact programmatically with your Plane workspace over HTTP.

Whether you're building intelligent assistants, automation scripts, or workflow-driven tools, this server provides a seamless HTTP-based bridge to Plane's API—so you can create projects, manage issues, assign tasks, and keep your work in sync with AI-powered tools.

## What can you do with it?
This server unlocks all sorts of useful capabilities for anyone working with Plane:

- Spin up projects and work items directly from your AI or app interface.
- Update progress, assign team members, set properties, or add comments—all programmatically.
- Move issues through workflows and update their states on the fly.
- Organize work with labels, modules, and cycles.
- Analyze data about your team's work across projects.
- Build smart apps that interact naturally with Plane—whether it's an AI agent logging work, or a bot keeping projects tidy.

## TODO

  * [ ] get_user is not working
  * [ ] list_issue_types works but n8n seems to not pass the project_id


## Quick Start

### Installation

```bash
npm install -g @makeplane/plane-mcp-server
```

### Start the SSE Server

#### Option 1: Using .env file (recommended)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Plane credentials
# PLANE_API_KEY=your-plane-api-key
# PLANE_WORKSPACE_SLUG=your-workspace-slug
# PORT=3000

# Start the server
plane-mcp-sse-server
```

#### Option 2: Using environment variables

```bash
# Set your environment variables
export PLANE_API_KEY="your-plane-api-key"
export PLANE_WORKSPACE_SLUG="your-workspace-slug"
export PORT=3000  # optional, defaults to 3000

# Start the server
plane-mcp-sse-server
```

The server will start and display:
```
==============================================
PLANE MCP SERVER - SSE TRANSPORT
==============================================

Endpoints:
- Health check: GET http://localhost:3000/health
- SSE stream:   GET http://localhost:3000/sse
- Messages:     POST http://localhost:3000/messages?sessionId=<id>
```

## Environment Configuration

- `PLANE_API_KEY` - Your Plane API token. You can generate one from the Workspace Settings > API Tokens page (`/settings/api-tokens/`) in the Plane app.
- `PLANE_WORKSPACE_SLUG` - The workspace slug for your Plane instance. The workspace-slug represents the unique workspace identifier for a workspace in Plane. It can be found in the URL.
- `PLANE_API_HOST_URL` (optional) - The host URL of the Plane API Server. Defaults to https://api.plane.so/
- `PORT` (optional) - Port for the SSE server. Defaults to 3000.

## How to Use

### Basic Client Flow

1. **Establish SSE Connection**: Send a GET request to `/sse` to establish the Server-Sent Events stream
2. **Get Session ID**: The server will provide a session ID in the response headers
3. **Send MCP Requests**: Use POST requests to `/messages?sessionId=<session_id>` with JSON-RPC payloads
4. **Receive Responses**: Listen to the SSE stream for responses and server events

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "transport": "sse"
}
```

### Example MCP Request

Once you have established an SSE connection and obtained a session ID:

```bash
curl -X POST "http://localhost:3000/messages?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_projects",
      "arguments": {}
    }
  }'
```

## Available Tools

### Users
- `get_user` - Get the current user's information

### Projects
- `get_projects` - Get all projects for the current user
- `create_project` - Create a new project

### Issue Types
- `list_issue_types` - Get all issue types for a specific project
- `get_issue_type` - Get details of a specific issue type
- `create_issue_type` - Create a new issue type in a project
- `update_issue_type` - Update an existing issue type
- `delete_issue_type` - Delete an issue type

### States
- `list_states` - Get all states for a specific project
- `get_state` - Get details of a specific state
- `create_state` - Create a new state in a project
- `update_state` - Update an existing state
- `delete_state` - Delete a state

### Labels
- `list_labels` - Get all labels for a specific project
- `get_label` - Get details of a specific label
- `create_label` - Create a new label in a project
- `update_label` - Update an existing label
- `delete_label` - Delete a label

### Issues
- `get_issue_using_readable_identifier` - Get issue details using readable identifier (e.g., PROJ-123)
- `get_issue_comments` - Get all comments for a specific issue
- `add_issue_comment` - Add a comment to an issue
- `create_issue` - Create a new issue
- `update_issue` - Update an existing issue

### Modules
- `list_modules` - Get all modules for a specific project
- `get_module` - Get details of a specific module
- `create_module` - Create a new module in a project
- `update_module` - Update an existing module
- `delete_module` - Delete a module

### Module Issues
- `list_module_issues` - Get all issues for a specific module
- `add_module_issues` - Add issues to a module
- `delete_module_issue` - Remove an issue from a module

### Cycles
- `list_cycles` - Get all cycles for a specific project
- `get_cycle` - Get details of a specific cycle
- `create_cycle` - Create a new cycle in a project
- `update_cycle` - Update an existing cycle
- `delete_cycle` - Delete a cycle

### Cycle Issues
- `list_cycle_issues` - Get all issues for a specific cycle
- `add_cycle_issues` - Add issues to a cycle
- `delete_cycle_issue` - Remove an issue from a cycle

### Work Logs
- `get_issue_worklogs` - Get all worklogs for a specific issue
- `get_total_worklogs` - Get total logged time for a project
- `create_worklog` - Create a new worklog for an issue
- `update_worklog` - Update an existing worklog
- `delete_worklog` - Delete a worklog

## Development

### Building from Source

```bash
git clone https://github.com/makeplane/plane-mcp-server.git
cd plane-mcp-server
npm install
npm run build
```

### Development Commands

- `npm run build` - Build the project
- `npm run start:sse` - Build and start the SSE server
- `npm run dev:sse` - Quick development build and start
- `npm run test-startup-sse` - Test SSE server startup
- `npm run lint` - Run linter
- `npm run format` - Format code

## Transport Options

This server supports both transport methods:

1. **SSE Transport** (`plane-mcp-sse-server`) - HTTP server with Server-Sent Events for streaming and POST for client messages
2. **Stdio Transport** (`plane-mcp-server`) - Traditional MCP server using stdin/stdout for communication

## Integration Examples

### Custom MCP Client

```javascript
// Establish SSE connection
const eventSource = new EventSource('http://localhost:3000/sse');
let sessionId;

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  // Handle MCP responses
  console.log('Received:', data);
});

// Get session ID from headers after connection
fetch('http://localhost:3000/sse', { method: 'HEAD' })
  .then(response => {
    sessionId = response.headers.get('mcp-session-id');
  });

// Send MCP request
async function callTool(name, args) {
  const response = await fetch(`http://localhost:3000/messages?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args }
    })
  });
}
```

### Using with MCP-compatible Frameworks

The SSE server is compatible with any MCP client that supports HTTP+SSE transport. Configure your client to:
- Connect to the SSE endpoint for receiving messages
- Send POST requests to the messages endpoint for outgoing communication

## Production Deployment

### Systemd Service Configuration

For production deployment on Linux servers, you can run the SSE server as a systemd service. This approach uses separate folders for each workspace with their own project files and `.env` configuration.

#### Setup Overview

Each workspace gets its own:
- Project directory (e.g., `/opt/plane-mcp-workspace1/`)
- `.env` file with workspace-specific configuration
- systemd service that runs `npm run start:sse`

#### Single Workspace Setup

1. **Create workspace directory and clone project**:
```bash
# Create directory for workspace 1
sudo mkdir -p /opt/plane-mcp-workspace1
cd /opt/plane-mcp-workspace1

# Clone the project
sudo git clone git@github.com:alfred-nutile-inc/mcp-plane-sse.git .

# Install dependencies
sudo npm install
sudo npm run build
```

2. **Create .env file for the workspace**:
```bash
sudo tee /opt/plane-mcp-workspace1/.env << EOF
PLANE_API_KEY=your-plane-api-key
PLANE_WORKSPACE_SLUG=your-workspace-slug
PLANE_API_HOST_URL=https://api.plane.so/
PORT=3000
EOF
```

3. **Create system user**:
```bash
# Create system user
sudo useradd --system \
  --home /opt/plane-mcp \
  --shell /bin/false \
  --comment "Plane MCP Server" \
  plane-mcp

# Set ownership of workspace directory
sudo chown -R plane-mcp:plane-mcp /opt/plane-mcp-workspace1
```

4. **Create systemd service**:
```bash
sudo tee /etc/systemd/system/plane-mcp-workspace1.service << EOF
[Unit]
Description=Plane MCP Server - Workspace1
After=network.target
Wants=network.target

[Service]
Type=simple
User=plane-mcp
Group=plane-mcp
WorkingDirectory=/opt/plane-mcp-workspace1
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/npm run start:sse
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=plane-mcp-workspace1

[Install]
WantedBy=multi-user.target
EOF
```


5. **Enable and start service**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable plane-mcp-workspace1
sudo systemctl start plane-mcp-workspace1
sudo systemctl status plane-mcp-workspace1
```

#### Multiple Workspace Setup

For multiple workspaces, repeat the process with different directories and ports:

1. **Create directories for each workspace**:
```bash
# Workspace 1 (port 3000)
sudo mkdir -p /opt/plane-mcp-workspace1
cd /opt/plane-mcp-workspace1
sudo git clone https://github.com/makeplane/plane-mcp-server.git .
sudo npm install && sudo npm run build

sudo tee /opt/plane-mcp-workspace1/.env << EOF
PLANE_API_KEY=workspace1-api-key
PLANE_WORKSPACE_SLUG=workspace1-slug
PLANE_API_HOST_URL=https://workspace1.plane.so/
PORT=3000
EOF

# Workspace 2 (port 3001)
sudo mkdir -p /opt/plane-mcp-workspace2
cd /opt/plane-mcp-workspace2
sudo git clone https://github.com/makeplane/plane-mcp-server.git .
sudo npm install && sudo npm run build

sudo tee /opt/plane-mcp-workspace2/.env << EOF
PLANE_API_KEY=workspace2-api-key
PLANE_WORKSPACE_SLUG=workspace2-slug
PLANE_API_HOST_URL=https://workspace2.plane.so/
PORT=3001
EOF
```

2. **Set ownership for all workspaces**:
```bash
sudo chown -R plane-mcp:plane-mcp /opt/plane-mcp-workspace1
sudo chown -R plane-mcp:plane-mcp /opt/plane-mcp-workspace2
```

3. **Create systemd services for each workspace**:
```bash
sudo tee /etc/systemd/system/plane-mcp-workspace1.service << EOF
[Unit]
Description=Plane MCP Server - Workspace1
After=network.target
Wants=network.target

[Service]
Type=simple
User=plane-mcp
Group=plane-mcp
WorkingDirectory=/var/lib/plane-mcp
Environment=PATH=/usr/local/bin:/usr/bin:/bin
EnvironmentFile=/etc/plane-mcp/workspace1.env
ExecStart=/var/lib/plane-mcp/start-server.sh
Restart=always
RestartSec=10
StandardOutput=append:/var/log/plane-mcp-workspace1.log
StandardError=append:/var/log/plane-mcp-workspace1-error.log

NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/plane-mcp
ReadWritePaths=/var/log

[Install]
WantedBy=multi-user.target
EOF
```

# Service for workspace 2
sudo tee /etc/systemd/system/plane-mcp-workspace2.service << EOF
[Unit]
Description=Plane MCP Server - Workspace2
After=network.target
Wants=network.target

[Service]
Type=simple
User=plane-mcp
Group=plane-mcp
WorkingDirectory=/opt/plane-mcp-workspace2
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/npm run start:sse
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=plane-mcp-workspace2

[Install]
WantedBy=multi-user.target
EOF
```

4. **Enable and start all services**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable plane-mcp-workspace1 plane-mcp-workspace2
sudo systemctl start plane-mcp-workspace1 plane-mcp-workspace2
```

#### Service Management Commands

```bash
# Check service status
sudo systemctl status plane-mcp-workspace1
sudo systemctl status plane-mcp-workspace2

# View logs
sudo journalctl -u plane-mcp-workspace1 -f
sudo journalctl -u plane-mcp-workspace2 -f

# Restart services
sudo systemctl restart plane-mcp-workspace1
sudo systemctl restart plane-mcp-workspace2

# Stop services
sudo systemctl stop plane-mcp-workspace1
sudo systemctl stop plane-mcp-workspace2
```

#### Nginx Reverse Proxy (Optional)

For production use, you might want to put the services behind nginx:

```nginx
# /etc/nginx/sites-available/plane-mcp
server {
    listen 80;
    server_name your-domain.com;

    # Workspace 1
    location /workspace1/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Workspace 2
    location /workspace2/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the nginx configuration:
```bash
sudo ln -s /etc/nginx/sites-available/plane-mcp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Firewall Configuration

```bash
# Allow specific ports
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Or if using nginx proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Monitoring and Health Checks

Each service exposes a health endpoint:
```bash
# Check workspace 1
curl http://localhost:3000/health

# Check workspace 2
curl http://localhost:3001/health
```

You can set up monitoring tools like Prometheus or simple cron jobs to monitor these endpoints.

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
