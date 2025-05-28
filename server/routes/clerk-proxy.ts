
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

// Configuração específica para o Replit
const clerkApiTarget = 'https://api.clerk.com';

// Proxy para todas as rotas do Clerk
const clerkProxy = createProxyMiddleware({
  target: clerkApiTarget,
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  pathRewrite: {
    '^/api/clerk': '', // Remove /api/clerk do path antes de enviar para clerk
  },
  onError: (err, req, res) => {
    console.error('❌ Erro no proxy Clerk:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Clerk proxy error', details: err.message });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxy Clerk request:', req.method, req.originalUrl, '→', clerkApiTarget + req.url.replace('/api/clerk', ''));
    
    // Headers necessários para funcionamento no Replit
    proxyReq.setHeader('Origin', clerkApiTarget);
    proxyReq.setHeader('Referer', clerkApiTarget);
    proxyReq.setHeader('User-Agent', 'CIP-Shopee-Replit/1.0');
    
    // Remover headers que podem causar problemas
    proxyReq.removeHeader('host');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy Clerk response:', proxyRes.statusCode, req.originalUrl);
    
    // Headers CORS necessários para o Replit
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept,Origin';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    
    // Remover headers que podem causar problemas no Replit
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
  },
  logLevel: 'debug'
});

// Aplicar proxy para todas as sub-rotas
router.use('/', clerkProxy);

// Rota de teste
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Clerk proxy ativo no Replit',
    target: clerkApiTarget,
    timestamp: new Date().toISOString()
  });
});

export default router;
