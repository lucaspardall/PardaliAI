
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

// Proxy para a API do Clerk para resolver problemas de CORS no Replit
const clerkProxy = createProxyMiddleware({
  target: 'https://api.clerk.com',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api/clerk': '', // Remove /api/clerk do path
  },
  onError: (err, req, res) => {
    console.error('❌ Erro no proxy Clerk:', err.message);
    res.status(500).json({ error: 'Clerk proxy error' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxy Clerk:', req.method, req.url);
    // Adicionar headers necessários
    proxyReq.setHeader('Origin', 'https://api.clerk.com');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Adicionar headers CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization';
  }
});

// Configurar proxy para todas as rotas do Clerk
router.use('/v1/*', clerkProxy);
router.use('/client/*', clerkProxy);

// Rota de teste para verificar conectividade
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Clerk proxy funcionando',
    timestamp: new Date().toISOString()
  });
});

export default router;
