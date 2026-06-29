import 'dotenv/config';
import { rateLimit } from 'express-rate-limit';

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX       = Number(process.env.RATE_LIMIT_MAX)       || 100;

export const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX,
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => req.path === '/health',

  handler: (_req, res) => {
    res.status(429).json({
      status: false,
      error: 'Too Many Requests: rate limit exceeded. Please slow down.',
      source: 'ApiGateway',
    });
  },
});
