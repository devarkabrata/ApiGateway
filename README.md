# API Gateway

A lightweight, config-driven Express API Gateway that routes incoming requests to multiple backend services based on a route prefix key. Backend servers are registered in a `config.json` file with hot-reload support — no restarts needed when the config changes.

---

## How It Works

Every request must include an `X-Gateway-Key` header for authentication. The first segment of the URL path identifies the target backend server. The gateway strips that prefix and proxies the full request — method, headers, body, and query string — to the registered target.

```
Incoming:  POST /server1/auth/user/login?new=true
           X-Gateway-Key: <your-key>

Proxied:   POST https://taskflowbackend-50mh.onrender.com/api/auth/user/login?new=true
```

---

## Features

- Route-prefix-based proxying to multiple backend services
- Global API key authentication via `X-Gateway-Key` header
- `config.json` hot-reload — add or update servers without restarting
- Utility endpoints to inspect active server registrations
- Health check endpoint exempt from authentication (for hosting platform monitors)

---

## Project Structure

```
ApiGateway/
├── src/
│   ├── index.js          — Express app bootstrap & server start
│   ├── gateway.js        — Proxy middleware (http-proxy-middleware)
│   ├── configLoader.js   — Loads config.json + hot-reload on file change
│   └── apiKeyAuth.js     — X-Gateway-Key authentication middleware
├── config.json           — Server key → target URL mappings
├── .env                  — Environment variables (PORT, API_KEY)
├── package.json
└── .gitignore
```

---

## Getting Started

**Requirements:** Node.js >= 18.0.0

```bash
# Install dependencies
npm install

# Start the server
npm start

# Start with auto-restart on file changes (development)
npm run dev
```

---

## Configuration

### `.env`

```env
PORT=3000
API_KEY=your-secret-gateway-key
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the gateway listens on | `3000` |
| `API_KEY` | Secret key clients must send in `X-Gateway-Key` header | — |

### `config.json`

```json
{
  "servers": {
    "server1": {
      "target": "https://your-backend.onrender.com/api",
      "description": "Main backend server"
    },
    "server2": {
      "target": "http://another-service.com",
      "description": "Secondary service"
    }
  }
}
```

| Field | Required | Description |
|---|---|---|
| `target` | Yes | Full base URL of the backend server |
| `description` | No | Human-readable label |

**Hot-reload:** Saving `config.json` while the gateway is running automatically picks up the changes. No restart required.

---

## API Reference

### Authentication

All routes except `/health` require the following header:

```
X-Gateway-Key: <your API_KEY value>
```

Missing or incorrect key returns:

```json
HTTP 401
{
  "status": false,
  "error": "Unauthorized: missing or invalid X-Gateway-Key header.",
  "source": "ApiGateway"
}
```

---

### `GET /health`

Health check. No authentication required.

```json
HTTP 200
{ "status": "ok" }
```

---

### `GET /_gateway/servers`

Lists all currently registered backend servers.

**Headers:** `X-Gateway-Key: <key>`

```json
HTTP 200
{
  "servers": [
    {
      "key": "server1",
      "target": "https://taskflowbackend-50mh.onrender.com/api",
      "description": "Taskflow .NET backend"
    }
  ]
}
```

---

### `ANY /:serverKey/*`

Proxies the request to the registered target for the given `serverKey`.

**Headers:** `X-Gateway-Key: <key>`

| Scenario | Response |
|---|---|
| Valid key + known server key | Proxied response from the backend |
| Valid key + unknown server key | `404 { status: false, error: "Unknown server key: ..." }` |
| Target server unreachable | `502 { error: "Bad Gateway", ... }` |

---

## Adding a New Backend Server

1. Open `config.json`
2. Add a new entry under `"servers"`:

```json
"newservice": {
  "target": "https://new-service.example.com",
  "description": "New microservice"
}
```

3. Save the file — the gateway hot-reloads instantly. No restart, no redeploy.

Requests to `/<newservice>/...` will now be proxied to `https://new-service.example.com/...`.

---

## Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Set the following:

| Field | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Port | `10000` |

3. Add environment variables in Render's dashboard:

| Key | Value |
|---|---|
| `API_KEY` | Your secret gateway key |

Render automatically injects `PORT` — no need to set it manually.
