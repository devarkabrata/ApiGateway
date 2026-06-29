import 'dotenv/config';
import express from 'express';
import { getConfig } from './configLoader.js';
import { gatewayMiddleware } from './gateway.js';
import { apiKeyAuth } from './apiKeyAuth.js';
import { rateLimiter } from './rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check is exempt — Render's uptime monitor hits this without any key
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rate limiting is applied globally to all routes, including the health check and utility routes. Adjust the rateLimiter configuration in rateLimiter.js as needed.
app.use(rateLimiter);

// Every route below this requires a valid X-Gateway-Key header
if( process.env.API_KEY) {
  app.use(apiKeyAuth);
}

app.get('/_gateway/servers', (_req, res) => {
  const { servers } = getConfig();
  const list = Object.entries(servers).map(([key, { target, description }]) => ({
    key,
    target,
    description: description || '',
  }));
  res.json({ servers: list });
});

app.use('/:serverKey', gatewayMiddleware);

app.listen(PORT, () => {
  const { servers } = getConfig();
  const keys = Object.keys(servers);
  console.log(`[Gateway] Listening on http://localhost:${PORT}`);
  console.log(`[Gateway] Active server keys: ${keys.length ? keys.join(', ') : '(none)'}`);
  console.log(`[Gateway] Utility routes: GET /health  |  GET /_gateway/servers`);
});
