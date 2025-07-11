import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./ai";
import { z } from "zod";
import { insertShopeeStoreSchema, insertProductSchema } from "@shared/schema";
import shopeeRoutes from './routes/shopee';
import webhookRoutes from './routes/webhook';
import webhookTestRoutes from './routes/webhookTest';
import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import diagnosisRoutes from './routes/diagnosis';
import shopeeStatusRoutes from './routes/shopee-status'; // Added shopeeStatusRoutes


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);



  // Register Shopee routes
  app.use('/api/shopee', shopeeRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/diagnosis', diagnosisRoutes);
  app.use('/api/shopee-status', shopeeStatusRoutes); // Added shopeeStatusRoutes

  // Rotas de teste (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    app.use('/api/test', webhookTestRoutes);
  }

  // Auth endpoints
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user's stores
  app.get('/api/stores', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      console.log('[API] Buscando stores para usuário:', userId);

      const stores = await storage.getStoresByUserId(userId);
      console.log('[API] Stores encontradas:', stores.length);

      res.json(stores);
    } catch (error) {
      console.error('[API] Erro ao buscar stores do usuário:', error);
      res.status(500).json({
        message: 'Failed to fetch stores',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/stores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.getStoreById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to access this store" });
      }

      res.json(store);
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  app.post('/api/stores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userData = await storage.getUser(userId);

      // Check store limit
      const userStores = await storage.getStoresByUserId(userId);
      if (userStores.length >= (userData?.storeLimit || 1)) {
        return res.status(403).json({ 
          message: "Store limit reached for your plan",
          currentStores: userStores.length,
          limit: userData?.storeLimit || 1
        });
      }

      // Validate store data
      const result = insertShopeeStoreSchema.safeParse({
        ...req.body,
        userId
      });

      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid store data", 
          errors: result.error.errors 
        });
      }

      const newStore = await storage.createStore(result.data);
      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating store:", error);
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.put('/api/stores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.getStoreById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to update this store" });
      }

      const updatedStore = await storage.updateStore(storeId, req.body);
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete('/api/stores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.getStoreById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to delete this store" });
      }

      await storage.deleteStore(storeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Product endpoints
  app.get('/api/stores/:storeId/products', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const store = await storage.getStoreById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to access this store's products" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;

      const products = await storage.getProductsByStoreId(storeId, limit, offset);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user has access to this product's store
      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to access this product" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/stores/:storeId/products', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const store = await storage.getStoreById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to add products to this store" });
      }

      // Validate product data
      const result = insertProductSchema.safeParse({
        ...req.body,
        storeId
      });

      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: result.error.errors 
        });
      }

      const newProduct = await storage.createProduct(result.data);

      // Update store product count
      await storage.updateStore(storeId, {
        totalProducts: (store.totalProducts || 0) + 1
      });

      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user has access to this product's store
      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user has access to this product's store
      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(productId);

      // Update store product count
      await storage.updateStore(product.storeId, {
        totalProducts: Math.max((store.totalProducts || 0) - 1, 0)
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // AI Optimization endpoints
  app.post('/api/products/:id/optimize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = parseInt(req.params.id);
      const priority = req.body.priority || 'normal';

      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user has access to this product's store
      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to optimize this product" });
      }

      // Process AI optimization with queue
      const result = await aiService.optimizeProduct(userId, product, priority);

      res.json({
        message: "Optimization request queued successfully",
        requestId: result.requestId,
        status: "queued"
      });

      res.status(201).json({
        optimization: newOptimization,
        request,
        creditsLeft: user.plan === 'free' ? Math.max(0, user.aiCreditsLeft - 1) : user.aiCreditsLeft
      });
    } catch (error: any) {
    console.error('Error optimizing product:', error);
    res.status(500).json({ 
      message: "Failed to optimize product",
      error: error.message
    });
  }
});

  // Get optimizations for a product
  app.get('/api/products/:id/optimizations', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user has access to this product's store
      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to access this product's optimizations" });
      }

      const optimizations = await storage.getOptimizationsByProductId(productId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching optimizations:", error);
      res.status(500).json({ message: "Failed to fetch optimizations" });
    }
  });

  // Get all optimizations for user
  app.get('/api/optimizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const optimizations = await storage.getAllOptimizationsByUserId(userId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching all optimizations:", error);
      res.status(500).json({ message: "Failed to fetch optimizations" });
    }
  });

  // Get AI credits history
  app.get('/api/ai-credits/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;

      const history = await storage.getAiCreditsHistory(userId, limit, offset);
      res.json(history);
    } catch (error) {
      console.error("Error fetching AI credits history:", error);
      res.status(500).json({ message: "Failed to fetch AI credits history" });
    }
  });

  // Get AI usage analytics
  app.get('/api/ai-credits/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = req.query.days ? parseInt(req.query.days) : 30;

      const analytics = await storage.getAiUsageAnalytics(userId, days);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching AI usage analytics:", error);
      res.status(500).json({ message: "Failed to fetch AI usage analytics" });
    }
  });

  // Get reports data
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const range = req.query.range || '30d';

      // For now, return mock data - in real implementation, this would query actual analytics
      const reportsData = {
        totalSales: 26300,
        averageCtr: 3.7,
        totalConversions: 838,
        totalOptimizations: 80,
        appliedOptimizations: 45,
        range
      };

      res.json(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Export reports
  app.get('/api/reports/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const format = req.query.format || 'csv';
      const range = req.query.range || '30d';

      const exportData = await storage.exportUserReports(userId, range, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cip-shopee-report-${range}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="cip-shopee-report-${range}.json"`);
      }

      res.send(exportData);
    } catch (error) {
      console.error("Error exporting reports:", error);
      res.status(500).json({ message: "Failed to export reports" });
    }
  });

  app.put('/api/optimizations/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const optimizationId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !['applied', 'ignored'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'applied' or 'ignored'" });
      }

      const optimization = await storage.getOptimizationById(optimizationId);
      if (!optimization) {
        return res.status(404).json({ message: "Optimization not found" });
      }

      // Check if user has access to this optimization's product
      const product = await storage.getProductById(optimization.productId);
      if (!product) {
        return res.status(404).json({ message: "Associated product not found" });
      }

      const store = await storage.getStoreById(product.storeId);
      if (!store || store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to update this optimization" });
      }

      // Update optimization status
      const updateData: any = { status };
      if (status === 'applied') {
        updateData.appliedAt = new Date();

        // If applying, update the product with optimized content
        if (optimization.suggestedTitle || optimization.suggestedDesc) {
          const productUpdates: any = {};

          if (optimization.suggestedTitle) {
            productUpdates.name = optimization.suggestedTitle;
          }

          if (optimization.suggestedDesc) {
            productUpdates.description = optimization.suggestedDesc;
          }

          await storage.updateProduct(product.id, productUpdates);


  // Criar anúncio com IA
  app.post('/api/ai/create-ad', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productData, adType, priority } = req.body;

      const result = await aiService.createAd(userId, productData, adType, priority);

      res.json({
        message: "Ad creation request queued successfully",
        requestId: result.requestId,
        status: "queued"
      });
    } catch (error) {
      console.error("Error creating ad:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create ad"
      });
    }
  });

  // Analisar loja com IA
  app.post('/api/stores/:id/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const storeId = parseInt(req.params.id);
      const priority = req.body.priority || 'normal';

      // Verificar se usuário tem acesso à loja
      const store = await storage.getStoreById(storeId);
      if (!store || store.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to analyze this store" });
      }

      const result = await aiService.analyzeStore(userId, storeId, priority);

      res.json({
        message: "Store analysis request queued successfully",
        requestId: result.requestId,
        status: "queued"
      });
    } catch (error) {
      console.error("Error analyzing store:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze store"
      });
    }
  });

  // Analisar campanha com IA
  app.post('/api/ai/analyze-campaign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignData, priority } = req.body;

      const result = await aiService.analyzeCampaign(userId, campaignData, priority);

      res.json({
        message: "Campaign analysis request queued successfully",
        requestId: result.requestId,
        status: "queued"
      });
    } catch (error) {
      console.error("Error analyzing campaign:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze campaign"
      });
    }
  });

  // Status da fila de IA
  app.get('/api/ai/queue-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await aiService.getQueueStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error getting queue status:", error);
      res.status(500).json({ message: "Failed to get queue status" });
    }
  });

  // Status de request específico
  app.get('/api/ai/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);

      const request = await storage.getAiRequestById(requestId);
      if (!request || request.userId !== userId) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error getting request status:", error);
      res.status(500).json({ message: "Failed to get request status" });
    }
  });

        }
      }

      const updatedOptimization = await storage.updateOptimization(optimizationId, updateData);
      res.json(updatedOptimization);
    } catch (error) {
      console.error("Error updating optimization status:", error);
      res.status(500).json({ message: "Failed to update optimization status" });
    }
  });

  // Store metrics endpoints
  app.get('/api/stores/:id/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const days = req.query.days ? parseInt(req.query.days) : 7;

      const store = await storage.getStoreById(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Check if user owns the store
      if (store.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to access this store's metrics" });
      }

      const metrics = await storage.getStoreMetrics(storeId, days);

      // If no metrics are found, generate sample data for the demo
      if (metrics.length === 0) {
        const sampleMetrics = generateSampleMetrics(storeId, days);
        res.json(sampleMetrics);
      } else {
        res.json(metrics);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // User subscription endpoint
  app.put('/api/users/plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan } = req.body;

      if (!plan || !['free', 'starter', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ 
          message: "Invalid plan. Must be one of: free, starter, pro, enterprise" 
        });
      }

      // Set plan expiration (30 days from now, except for free)
      const expiresAt = plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

      // Update user plan
      const updatedUser = await storage.updateUserPlan(userId, plan, expiresAt || undefined);

      // Update store limit and AI credits based on plan
      const planDetails = {
        free: { storeLimit: 1, aiCredits: 10 },
        starter: { storeLimit: 1, aiCredits: 100 },
        pro: { storeLimit: 3, aiCredits: 9999 }, // Unlimited represented as large number
        enterprise: { storeLimit: 10, aiCredits: 9999 }
      };

      if (updatedUser) {
        await storage.updateUserAiCredits(userId, planDetails[plan as keyof typeof planDetails].aiCredits);

        // Update with new plan details
        const finalUser = await storage.getUser(userId);

        // Create plan change notification
        await storage.createNotification({
          userId,
          title: `Plano atualizado para ${plan.toUpperCase()}`,
          message: `Seu plano foi atualizado com sucesso para ${plan.toUpperCase()}. ${plan !== 'free' ? 'Obrigado por apoiar o CIP Shopee!' : ''}`,
          type: 'success',
          isRead: false,
        });

        res.json(finalUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ message: "Failed to update user plan" });
    }
  });

  // Notification endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      const notifications = await storage.getNotificationsByUserId(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const result = await storage.markNotificationAsRead(notificationId);

      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Auth routes
  app.use('/api/auth', authRouter);
  app.use('/api', authRouter); // Para acessar /api/profile

  // Shopee routes (já configurado acima)
  // app.use('/api/shopee', shopeeRoutes);

  // Payment routes
  app.use('/api/payments', paymentsRouter);
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate sample metrics for demo
function generateSampleMetrics(storeId: number, days: number): any[] {
  const metrics = [];
  const now = new Date();

  // Generate a baseline
  const baseViews = Math.floor(Math.random() * 500) + 300;
  const baseSales = Math.floor(Math.random() * 20) + 10;
  const baseRevenue = Math.floor(Math.random() * 1000) + 500;
  const baseCtr = (Math.random() * 3) + 2;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));

    // Add some randomness to the metrics to create realistic looking data
    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    const trendFactor = 1 + (i * 0.02); // Slight upward trend

    const dailyViews = Math.floor(baseViews * randomFactor * trendFactor);
    const dailySales = Math.floor(baseSales * randomFactor * trendFactor);
    const dailyRevenue = Math.floor(baseRevenue * randomFactor * trendFactor);
    const dailyCtr = parseFloat((baseCtr * randomFactor * trendFactor).toFixed(2));

    metrics.push({
      id: i + 1,
      storeId,
      date,
      totalViews: dailyViews,
      totalSales: dailySales,
      totalRevenue: dailyRevenue,
      averageCtr: dailyCtr,
      productCount: 48, // Consistent product count for demo
      createdAt: date
    });
  }

  return metrics;
}