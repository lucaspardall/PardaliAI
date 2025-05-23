/**
 * Rotas de API para o modo de demonstração
 */

import { Router } from 'express';
import { handleDemoLogin, handleDemoLogout, isDemoAuthenticated } from './auth';
import { demoStores, demoProducts, demoOptimizations, demoStoreStats, demoNotifications } from './data';

// Criar router para APIs do modo demo
export const demoRouter = Router();

// Rota de login para demo
demoRouter.post('/login', handleDemoLogin);

// Rota de logout para demo
demoRouter.post('/logout', handleDemoLogout);

// Pegar informações do usuário logado em modo demo
demoRouter.get('/user', isDemoAuthenticated, (req, res) => {
  const demoUser = (req as any).demoUser;
  res.json(demoUser);
});

// API de lojas - modo demo
demoRouter.get('/stores', isDemoAuthenticated, (req, res) => {
  res.json(demoStores);
});

// API de produtos - modo demo
demoRouter.get('/products', isDemoAuthenticated, (req, res) => {
  const { storeId } = req.query;
  
  if (storeId) {
    const filteredProducts = demoProducts.filter(p => p.storeId === parseInt(storeId as string));
    res.json(filteredProducts);
  } else {
    res.json(demoProducts);
  }
});

// API de detalhes do produto - modo demo
demoRouter.get('/products/:id', isDemoAuthenticated, (req, res) => {
  const productId = parseInt(req.params.id);
  const product = demoProducts.find(p => p.id === productId);
  
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Produto não encontrado' });
  }
});

// API de otimizações - modo demo
demoRouter.get('/optimizations', isDemoAuthenticated, (req, res) => {
  const { productId } = req.query;
  
  if (productId) {
    const filteredOptimizations = demoOptimizations.filter(o => o.productId === parseInt(productId as string));
    res.json(filteredOptimizations);
  } else {
    res.json(demoOptimizations);
  }
});

// API de detalhes da otimização - modo demo
demoRouter.get('/optimizations/:id', isDemoAuthenticated, (req, res) => {
  const optimizationId = parseInt(req.params.id);
  const optimization = demoOptimizations.find(o => o.id === optimizationId);
  
  if (optimization) {
    res.json(optimization);
  } else {
    res.status(404).json({ message: 'Otimização não encontrada' });
  }
});

// API de estatísticas da loja - modo demo
demoRouter.get('/store-stats', isDemoAuthenticated, (req, res) => {
  const { storeId, days } = req.query;
  
  if (storeId) {
    let filteredStats = demoStoreStats.filter(s => s.storeId === parseInt(storeId as string));
    
    // Limitar por dias, se especificado
    if (days) {
      const numDays = parseInt(days as string);
      filteredStats = filteredStats.slice(-numDays);
    }
    
    res.json(filteredStats);
  } else {
    res.json(demoStoreStats);
  }
});

// API de notificações - modo demo
demoRouter.get('/notifications', isDemoAuthenticated, (req, res) => {
  res.json(demoNotifications);
});

// API para marcar notificação como lida - modo demo
demoRouter.post('/notifications/:id/read', isDemoAuthenticated, (req, res) => {
  const notificationId = parseInt(req.params.id);
  const notification = demoNotifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.isRead = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Notificação não encontrada' });
  }
});

// API para criar uma nova otimização (simulação) - modo demo
demoRouter.post('/products/:id/optimize', isDemoAuthenticated, (req, res) => {
  const productId = parseInt(req.params.id);
  const product = demoProducts.find(p => p.id === productId);
  
  if (product) {
    // Simular processamento
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Otimização iniciada com sucesso',
        estimatedTime: '2-3 minutos'
      });
    }, 1500);
  } else {
    res.status(404).json({ message: 'Produto não encontrado' });
  }
});