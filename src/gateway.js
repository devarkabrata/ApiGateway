import { createProxyMiddleware } from 'http-proxy-middleware';
import { getConfig } from './configLoader.js';

// A single proxy instance shared across all requests.
// The router and pathRewrite functions run per-request, so config hot-reload
// is reflected automatically without recreating the proxy.
const proxy = createProxyMiddleware({
  changeOrigin: true,

  router(req) {
    const serverKey = req.params?.serverKey ?? req.path.split('/')[1];
    return getConfig().servers[serverKey]?.target;
  },

  pathRewrite(path, req) {
    const serverKey = req.params?.serverKey ?? path.split('/')[1];
    return path.replace(`/${serverKey}`, '') || '/';
  },

  on: {
    error(err, req, res) {
      console.error(`[Gateway] Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({ 
          status: false,
          error: 'Bad Gateway: Unable to reach the target server.',
          source: 'ApiGateway',
          details: err.message
        });
      }
    },
    proxyReq(proxyReq, req, res) {
      console.log(`[Gateway] Proxying request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
    },
    proxyRes(proxyRes, req, res) {
      console.log(`[Gateway] Received response with status code: ${proxyRes.statusCode}`);
    },
  },
});

export function gatewayMiddleware(req, res, next) {
  const { serverKey } = req.params;

  if (!getConfig().servers[serverKey]) {
    return res.status(404).json({
      status: false,
      error: `Unknown server key: "${serverKey}". Please check your configuration.`,
      source: 'ApiGateway',
    });
  }

  proxy(req, res, next);
}
