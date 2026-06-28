import 'dotenv/config';

export function apiKeyAuth(req, res, next) {
  const key = req.headers['x-gateway-key'];

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({
      status: false,
      error: 'Unauthorized: missing or invalid X-Gateway-Key header.',
      source: 'ApiGateway',
    });
  }

  next();
}
