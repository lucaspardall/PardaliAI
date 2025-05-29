import {
  users,
  upsertUserSchema,
  shopeeStores,
  insertShopeeStoreSchema,
  products,
  insertProductSchema,
  productOptimizations,
  insertProductOptimizationSchema,
  storeMetrics,
  insertStoreMetricSchema,
  aiRequests,
  insertAiRequestSchema,
  notifications,
  insertNotificationSchema,
  systemLogs,
  insertSystemLogSchema,
  apiCache,
  insertApiCacheSchema,
  aiCreditsHistory,
  insertAiCreditsHistorySchema,
  orders,
  insertOrderSchema,
  storeDiagnoses,
  insertStoreDiagnosisSchema,
  type User,
  type UpsertUser,
  type ShopeeStore,
  type InsertShopeeStore,
  type Product,
  type InsertProduct,
  type ProductOptimization,
  type InsertProductOptimization,
  type StoreMetric,
  type InsertStoreMetric,
  type AiRequest,
  type InsertAiRequest,
  type Notification,
  type InsertNotification,
  type SystemLog,
  type InsertSystemLog,
  type ApiCache,
  type InsertApiCache,
  type AiCreditsHistory,
  type InsertAiCreditsHistory,
  type Order,
  type InsertOrder,
  type StoreDiagnosis,
  type InsertStoreDiagnosis
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, lt, gte, lte, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(userId: string, plan: string, expiresAt?: Date): Promise<User | undefined>;
  updateUserAiCredits(userId: string, credits: number): Promise<User | undefined>;

  // Store operations
  getStoresByUserId(userId: string): Promise<ShopeeStore[]>;
  getStoreById(id: number): Promise<ShopeeStore | undefined>;
  getStoreByShopId(shopId: string): Promise<ShopeeStore | undefined>;
  createStore(store: InsertShopeeStore): Promise<ShopeeStore>;
  updateStore(id: number, data: Partial<ShopeeStore>): Promise<ShopeeStore | undefined>;
  deleteStore(id: number): Promise<boolean>;

  // Product operations
  getProductsByStoreId(storeId: number, limit?: number, offset?: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Product Optimization operations
  getOptimizationsByProductId(productId: number): Promise<ProductOptimization[]>;
  getOptimizationById(id: number): Promise<ProductOptimization | undefined>;
  createOptimization(optimization: InsertProductOptimization): Promise<ProductOptimization>;
  updateOptimization(id: number, data: Partial<ProductOptimization>): Promise<ProductOptimization | undefined>;
  // Product Optimization operations
  getAllOptimizationsByUserId(userId: string): Promise<any[]>;

  // Metrics operations
  getStoreMetrics(storeId: number, days?: number): Promise<StoreMetric[]>;
  createStoreMetric(metric: InsertStoreMetric): Promise<StoreMetric>;

  // AI Request operations
  getAiRequestsByUserId(userId: string): Promise<AiRequest[]>;
  getAiRequestById(id: number): Promise<AiRequest | undefined>;
  createAiRequest(request: InsertAiRequest): Promise<AiRequest>;
  updateAiRequest(id: number, data: Partial<AiRequest>): Promise<AiRequest | undefined>;

  // Notification operations
  getNotificationsByUserId(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  createNotification(notification: InsertNotification): Promise<Notification>;

    // Credits history
    getAiCreditsHistory(userId: string, limit?: number, offset?: number): Promise<AiCreditsHistory[]>;
    getAiUsageAnalytics(userId: string, days?: number): Promise<any>;
    exportUserReports(userId: string, range: string, format: string): Promise<string>;
  // Order operations
  createOrder(order: any): Promise<any>;
  updateOrder(orderId: number, updates: any): Promise<any>;
  getOrderByOrderSn(orderSn: string): Promise<any>;
  getOrdersByStoreId(storeId: number, limit: number, offset: number, status?: string): Promise<any[]>;
  getProductByStoreIdAndProductId(storeId: number, productId: string): Promise<any>;

    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByToken(token: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private db: PostgresJsDatabase<typeof schema> | null = null;

  private async getDb() {
    if (!this.db) {
      const { connectWithRetry } = await import('./db');
      this.db = await connectWithRetry();
    }
    return this.db;
  }

    /**
   * Inicializar o storage com verificações robustas
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔌 Inicializando conexão com banco de dados...');

      // Obter instância do banco
      this.db = await this.getDb();

      // Teste 1: Verificação básica de conectividade
      console.log('📡 Teste 1: Conectividade básica...');
      const basicTest = await this.executeWithRetry(async () => {
        return await this.db!.execute(sql`SELECT 1 as test, NOW() as timestamp`);
      });
      console.log('✅ Conectividade básica:', basicTest.rows[0]);

      // Teste 2: Verificação de schema
      console.log('📊 Teste 2: Verificação de schema...');
      const schemaTest = await this.executeWithRetry(async () => {
        return await this.db!.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'shopee_stores', 'products')
          ORDER BY table_name
        `);
      });
      
      const requiredTables = ['users', 'shopee_stores', 'products'];
      const existingTables = schemaTest.rows.map((row: any) => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        console.warn('⚠️ Tabelas faltando:', missingTables);
      } else {
        console.log('✅ Schema verificado - todas as tabelas principais existem');
      }

      // Teste 3: Operação simples
      console.log('🔍 Teste 3: Operação de leitura...');
      await this.executeWithRetry(async () => {
        return await this.db!.select().from(users).limit(1);
      });
      console.log('✅ Operações de leitura funcionando');

      console.log('🎉 Storage inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Falha na inicialização do storage:', error);
      throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`[Storage] ✅ Operação bem-sucedida após ${attempt} tentativas`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;

        // Classificar erro
        const isRetryableError = error.code === 'ECONNREFUSED' || 
                                error.code === 'ENOTFOUND' ||
                                error.message?.includes('connection timed out') ||
                                error.message?.includes('server closed the connection');

        console.error(`[Storage] Erro tentativa ${attempt}/${maxRetries}:`, {
          code: error.code,
          message: error.message?.substring(0, 150),
          retryable: isRetryableError
        });

        // Não fazer retry para erros não relacionados à conexão
        if (!isRetryableError) {
          console.error('[Storage] ❌ Erro não recuperável - parando tentativas');
          throw error;
        }

        if (attempt === maxRetries) {
          console.error('[Storage] ❌ Máximo de tentativas atingido');
          throw error;
        }

        // Backoff progressivo apenas para erros de conexão
        const waitTime = Math.min(1000 * attempt, 5000);
        console.log(`[Storage] ⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      console.log(`Buscando usuário por ID: ${id}`);

      if (!id || typeof id !== 'string') {
        console.error('UserId inválido:', id);
        return undefined;
      }

      const userResults = await this.executeWithRetry(async () => {
        return await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
      });

      const user = userResults[0];
      console.log(`Usuário encontrado para ID ${id}:`, user ? 'Sim' : 'Não');
      return user;
    } catch (error) {
      console.error(`Erro ao buscar usuário por ID ${id}:`, error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPlan(userId: string, plan: string, expiresAt?: Date): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        plan,
        planExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserAiCredits(userId: string, newCredits: number, action = 'used', description = 'Crédito utilizado', relatedEntity?: { type: string, id: number }): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const previousBalance = user.aiCreditsLeft;

    // Atualizar saldo do usuário
    await db
      .update(users)
      .set({ 
        aiCreditsLeft: newCredits,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Registrar histórico apenas se houve mudança no saldo
    if (previousBalance !== newCredits) {
      await db.insert(aiCreditsHistory).values({
        userId,
        action,
        amount: newCredits - previousBalance,
        previousBalance,
        newBalance: newCredits,
        description,
        relatedEntityType: relatedEntity?.type,
        relatedEntityId: relatedEntity?.id,
        createdAt: new Date()
      });
    }
  }

  async getAiCreditsHistory(userId: string, limit = 50, offset = 0): Promise<AiCreditsHistory[]> {
    return await db
      .select()
      .from(aiCreditsHistory)
      .where(eq(aiCreditsHistory.userId, userId))
      .orderBy(desc(aiCreditsHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAiUsageAnalytics(userId: string, days = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await db
      .select()
      .from(aiCreditsHistory)
      .where(
        and(
          eq(aiCreditsHistory.userId, userId),
          gte(aiCreditsHistory.createdAt, startDate)
        )
      )
      .orderBy(desc(aiCreditsHistory.createdAt));

    // Agrupar por dia
    const dailyUsage = new Map();
    const actionStats = new Map();
    let totalUsed = 0;
    let totalGained = 0;

    history.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];

      if (!dailyUsage.has(date)) {
        dailyUsage.set(date, { used: 0, gained: 0 });
      }

      if (record.amount < 0) {
        dailyUsage.get(date).used += Math.abs(record.amount);
        totalUsed += Math.abs(record.amount);
      } else {
        dailyUsage.get(date).gained += record.amount;
        totalGained += record.amount;
      }

      // Estatísticas por ação
      if (!actionStats.has(record.action)) {
        actionStats.set(record.action, { count: 0, total: 0 });
      }
      actionStats.get(record.action).count++;
      actionStats.get(record.action).total += Math.abs(record.amount);
    });

    return {
      totalUsed,
      totalGained,
      netUsage: totalUsed - totalGained,
      dailyUsage: Array.from(dailyUsage.entries()).map(([date, data]) => ({
        date,
        ...data
      })),
      actionBreakdown: Array.from(actionStats.entries()).map(([action, data]) => ({
        action,
        ...data
      })),
      period: days
    };
  }

  async exportUserReports(userId: string, range: string, format: string): Promise<string> {
    // Buscar dados do usuário
    const user = await this.getUser(userId);
    const stores = await this.getStoresByUserId(userId);
    const optimizations = await this.getAllOptimizationsByUserId(userId);

    // Determinar período
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filtrar otimizações por período
    const periodOptimizations = optimizations.filter(opt => 
      opt.createdAt >= startDate
    );

    const reportData = {
      user: {
        email: user?.email,
        plan: user?.plan,
        aiCreditsLeft: user?.aiCreditsLeft
      },
      period: range,
      summary: {
        totalStores: stores.length,
        totalOptimizations: periodOptimizations.length,
        appliedOptimizations: periodOptimizations.filter(opt => opt.status === 'applied').length,
        pendingOptimizations: periodOptimizations.filter(opt => opt.status === 'pending').length
      },
      stores: stores.map(store => ({
        name: store.shopName,
        region: store.shopRegion,
        totalProducts: store.totalProducts,
        isActive: store.isActive
      })),
      optimizations: periodOptimizations.map(opt => ({
        createdAt: opt.createdAt.toISOString(),
        status: opt.status,
        appliedAt: opt.appliedAt?.toISOString(),
        originalTitle: opt.originalTitle,
        suggestedTitle: opt.suggestedTitle
      })),
      generatedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Converter para CSV
      const csvLines = [
        'Data,Tipo,Status,Título Original,Título Sugerido',
        ...periodOptimizations.map(opt => 
          `${opt.createdAt.toISOString()},Otimização,${opt.status},"${opt.originalTitle || ''}","${opt.suggestedTitle || ''}"`
        )
      ];
      return csvLines.join('\n');
    } else {
      return JSON.stringify(reportData, null, 2);
    }
  }

  // Store operations
  async getStoresByUserId(userId: string): Promise<ShopeeStore[]> {
    console.log(`Buscando lojas para o usuário: ${userId}`);

    try {
      // Verificar se userId está válido
      if (!userId || typeof userId !== 'string') {
        console.error('UserId inválido:', userId);
        return [];
      }

      const stores = await this.executeWithRetry(async () => {
        // Usar query builder mais explícito para evitar problemas de prepared statement
        const query = db
          .select()
          .from(shopeeStores)
          .where(eq(shopeeStores.userId, userId));

        console.log('Executando query de busca de lojas...');
        return await query;
      });

      console.log(`Lojas encontradas para usuário ${userId}:`, stores.length);
      return stores;
    } catch (error) {
      console.error(`Erro ao buscar lojas para usuário ${userId}:`, error);
      // Retornar array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  async getStoreById(id: number): Promise<ShopeeStore | undefined> {
    try {
      console.log(`Buscando loja por ID: ${id}`);

      if (!id || typeof id !== 'number') {
        console.error('StoreId inválido:', id);
        return undefined;
      }

      const stores = await this.executeWithRetry(async () => {
        return await db
          .select()
          .from(shopeeStores)
          .where(eq(shopeeStores.id, id))
          .limit(1);
      });

      const store = stores[0];
      console.log(`Loja encontrada para ID ${id}:`, store ? 'Sim' : 'Não');
      return store;
    } catch (error) {
      console.error(`Erro ao buscar loja por ID ${id}:`, error);
      return undefined;
    }
  }

  async getStoreByShopId(shopId: string): Promise<ShopeeStore | undefined> {
    try {
      // Validar entrada
      if (!shopId || typeof shopId !== 'string') {
        console.warn('getStoreByShopId: shopId inválido:', shopId);
        return undefined;
      }

      console.log(`Buscando loja por shopId: ${shopId}`);

      const stores = await this.executeWithRetry(async () => {
        // Usar query mais explícita para evitar prepared statement vazio
        return await db
          .select()
          .from(shopeeStores)
          .where(eq(shopeeStores.shopId, shopId))
          .limit(1);
      });

      const store = stores[0];
      console.log(`Loja encontrada para shopId ${shopId}:`, store ? 'Sim' : 'Não');
      return store;
    } catch (error) {
      console.error('Erro ao buscar loja por shopId ${shopId}:', error);
      return undefined;
    }
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return newNotification;
  }

  async createStore(store: InsertShopeeStore): Promise<ShopeeStore> {
    const [newStore] = await db
      .insert(shopeeStores)
      .values(store)
      .returning();
    return newStore;
  }

  async updateStore(id: number, data: Partial<ShopeeStore>): Promise<ShopeeStore | undefined> {
    const [updatedStore] = await db
      .update(shopeeStores)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(shopeeStores.id, id))
      .returning();
    return updatedStore;
  }

  async deleteStore(id: number): Promise<boolean> {
    const result = await db
      .delete(shopeeStores)
      .where(eq(shopeeStores.id, id));
    return true;
  }

  // Product operations
  async getProductsByStoreId(storeId: number, limit = 100, offset = 0): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(products.updatedAt));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Product Optimization operations
  async getOptimizationsByProductId(productId: number): Promise<ProductOptimization[]> {
    return db
      .select()
      .from(productOptimizations)
      .where(eq(productOptimizations.productId, productId))
      .orderBy(desc(productOptimizations.createdAt));
  }

  async getOptimizationById(id: number): Promise<ProductOptimization | undefined> {
    const [optimization] = await db
      .select()
      .from(productOptimizations)
      .where(eq(productOptimizations.id, id));
    return optimization;
  }

  async createOptimization(optimization: InsertProductOptimization): Promise<ProductOptimization> {
    const [newOptimization] = await db
      .insert(productOptimizations)
      .values(optimization)
      .returning();
    return newOptimization;
  }

  async updateOptimization(id: number, data: Partial<ProductOptimization>): Promise<ProductOptimization | undefined> {
    const [updatedOptimization] = await db
      .update(productOptimizations)
      .set(data)
      .where(eq(productOptimizations.id, id))
      .returning();
    return updatedOptimization;
  }

  async getAllOptimizationsByUserId(userId: string): Promise<any[]> {
    const result = await db
      .select({
        id: productOptimizations.id,
        productId: productOptimizations.productId,
        productName: products.name,
        productImage: sql<string>`CASE WHEN ${products.images} != '' AND ${products.images} IS NOT NULL THEN SUBSTR(${products.images}, 1, INSTR(${products.images}, ',') - 1) ELSE NULL END`,
        status: productOptimizations.status,
        originalTitle: productOptimizations.originalTitle,
        suggestedTitle: productOptimizations.suggestedTitle,
        originalDesc: productOptimizations.originalDesc,
        suggestedDesc: productOptimizations.suggestedDesc,
        originalKeywords: productOptimizations.originalKeywords,
        suggestedKeywords: productOptimizations.suggestedKeywords,
        reasoningNotes: productOptimizations.reasoningNotes,
        createdAt: productOptimizations.createdAt,
        appliedAt: productOptimizations.appliedAt,
      })
      .from(productOptimizations)
      .innerJoin(products, eq(productOptimizations.productId, products.id))
      .innerJoin(shopeeStores, eq(products.storeId, shopeeStores.id))
      .where(eq(shopeeStores.userId, userId))
      .orderBy(desc(productOptimizations.createdAt));

    return result;
  }

  // Metrics operations
  async getStoreMetrics(storeId: number, days = 7): Promise<StoreMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(storeMetrics)
      .where(
        and(
          eq(storeMetrics.storeId, storeId),
          gte(storeMetrics.date, startDate)
        )
      )
      .orderBy(storeMetrics.date);
  }

  async createStoreMetric(metric: InsertStoreMetric): Promise<StoreMetric> {
    const [newMetric] = await db
      .insert(storeMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  // AI Request operations
  async getAiRequestsByUserId(userId: string): Promise<AiRequest[]> {
    return db
      .select()
      .from(aiRequests)
      .where(eq(aiRequests.userId, userId))
      .orderBy(desc(aiRequests.createdAt));
  }

  async getAiRequestById(id: number): Promise<AiRequest | undefined> {
    const [request] = await db
      .select()
      .from(aiRequests)
      .where(eq(aiRequests.id, id));
    return request;
  }

  async createAiRequest(request: InsertAiRequest): Promise<AiRequest> {
    const [newRequest] = await db
      .insert(aiRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateAiRequest(id: number, data: Partial<AiRequest>): Promise<AiRequest | undefined> {
    const [updatedRequest] = await db
      .update(aiRequests)
      .set(data)
      .where(eq(aiRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Notification operations
  async getNotificationsByUserId(userId: string, limit = 10): Promise<Notification[]> {
    try {
      // Execute diretamente sem construir a consulta em etapas
      const results = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .execute();
      return results;
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      if (error instanceof Error) {
        console.error("Mensagem:", error.message);
      }
      // Retorna array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return true;
  }

  async createOrder(order: any): Promise<any> {
    try {
      const [newOrder] = await db.insert(orders).values(order).returning();
      return newOrder;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  }

  async updateOrder(orderId: number, updates: any): Promise<any> {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, orderId))
        .returning();
      return updatedOrder;
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }
  }

  async getOrderByOrderSn(orderSn: string): Promise<any> {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.orderSn, orderSn)
      });
      return order;
    } catch (error) {
      console.error('Erro ao buscar pedido por orderSn:', error);
      throw error;
    }
  }

  async getOrdersByStoreId(storeId: number, limit: number = 50, offset: number = 0, status?: string): Promise<any[]> {
    try {
      let whereCondition = eq(orders.storeId, storeId);

      if (status) {
        whereCondition = and(whereCondition, eq(orders.orderStatus, status));
      }

      const result = await db.query.orders.findMany({
        where: whereCondition,
        limit,
        offset,
        orderBy: desc(orders.createTime)
      });

      return result;
    } catch (error) {
      console.error('Erro ao buscar pedidos por storeId:', error);
      throw error;
    }
  }

  async getProductByStoreIdAndProductId(storeId: number, productId: string): Promise<any> {
    try {
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.storeId, storeId),
          eq(products.productId, productId)
        )
      });
      return product;
    } catch (error) {
      console.error('Erro ao buscar produto por storeId e productId:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log(`Buscando usuário por email: ${email}`);

      if (!email || typeof email !== 'string') {
        console.error('Email inválido:', email);
        return null;
      }

      const userResults = await this.executeWithRetry(async () => {
        return await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      });

      const user = userResults[0] || null;
      console.log(`Usuário encontrado para email ${email}:`, user ? 'Sim' : 'Não');
      return user;
    } catch (error) {
      console.error(`Erro ao buscar usuário por email ${email}:`, error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por username:', error);
      return null;
    }
  }

  async getUserByToken(token: string): Promise<{ claims: { sub: string; email?: string; first_name?: string; last_name?: string } } | null> {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const user = await this.getUser(decoded.userId);
      if (!user) return null;

      return {
        claims: {
          sub: user.id,
          email: user.email || '',
          first_name: user.firstName || '',
          last_name: user.lastName || ''
        }
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }
}

// In-memory storage for development or testing
export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private stores = new Map<number, ShopeeStore>();
  private products = new Map<number, Product>();
  private optimizations = new Map<number, ProductOptimization>();
  private metrics = new Map<number, StoreMetric>();
  private aiRequests = new Map<number, AiRequest>();
  private notifications = new Map<number, Notification>();

  private storeIdCounter = 1;
  private productIdCounter = 1;
  private optimizationIdCounter = 1;
  private metricIdCounter = 1;
  private aiRequestIdCounter = 1;
  private notificationIdCounter = 1;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      ...userData,
      createdAt: now,
      updatedAt: now,
      plan: userData.plan || 'free',
      planStatus: userData.planStatus || 'active',
      aiCreditsLeft: userData.aiCreditsLeft || 10,
      storeLimit: userData.storeLimit || 1
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserPlan(userId: string, plan: string, expiresAt?: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      plan,
      planExpiresAt: expiresAt,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserAiCredits(userId: string, newCredits: number, action = 'used', description = 'Crédito utilizado', relatedEntity?: { type: string, id: number }): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const previousBalance = user.aiCreditsLeft;
    const amount = newCredits - previousBalance;

    const updatedUser: User = {
      ...user,
      aiCreditsLeft: newCredits,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);

    //Simulando o histórico em memória
    //this.aiCreditsHistory.push({
    //  userId,
    //  action,
    //  amount,
    //  previousBalance,
    //  newBalance: newCredits,
    //  description,
    //  relatedEntityType: relatedEntity?.type,
    //  relatedEntityId: relatedEntity?.id,
    //  createdAt: new Date()
    //});
  }

  //Implementações de MemStorage para os métodos de histórico e relatório
  async getAiCreditsHistory(userId: string, limit = 50, offset = 0): Promise<AiCreditsHistory[]> {
    return [];
  }

  async getAiUsageAnalytics(userId: string, days = 30): Promise<any> {
    return {
      totalUsed: 0,
      totalGained: 0,
      netUsage: 0,
      dailyUsage: [],
      actionBreakdown: [],
      period: days
    };
  }
  async exportUserReports(userId: string, range: string, format: string): Promise<string> {
    return '';
  }

  // Store operations
  async getStoresByUserId(userId: string): Promise<ShopeeStore[]> {
    return Array.from(this.stores.values())
      .filter(store => store.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStoreById(id: number): Promise<ShopeeStore | undefined> {
    return this.stores.get(id);
  }

  async getStoreByShopId(shopId: string): Promise<ShopeeStore | undefined> {
    return Array.from(this.stores.values()).find(store => store.shopId === shopId);
  }

  async createStore(store: InsertShopeeStore): Promise<ShopeeStore> {
    const id = this.storeIdCounter++;
    const now = new Date();
    const newStore: ShopeeStore = {
      ...store,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: store.isActive !== undefined ? store.isActive : true,
      totalProducts: store.totalProducts || 0,
    };
    this.stores.set(id, newStore);
    return newStore;
  }

  async updateStore(id: number, data: Partial<ShopeeStore>): Promise<ShopeeStore | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;

    const updatedStore: ShopeeStore = {
      ...store,
      ...data,
      updatedAt: new Date()
    };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  async deleteStore(id: number): Promise<boolean> {
    return this.stores.delete(id);
  }

  // Product operations
  async getProductsByStoreId(storeId: number, limit = 100, offset = 0): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.storeId === storeId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(offset, offset + limit);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
      images: product.images || []
    };
    this.products.set(id, newProduct);    return newProduct;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...data,
      updatedAt: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Product Optimization operations
  async getOptimizationsByProductId(productId: number): Promise<ProductOptimization[]> {
    return Array.from(this.optimizations.values())
      .filter(opt => opt.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOptimizationById(id: number): Promise<ProductOptimization | undefined> {
    return this.optimizations.get(id);
  }

  async createOptimization(optimization: InsertProductOptimization): Promise<ProductOptimization> {
    const id = this.optimizationIdCounter++;
    const newOptimization: ProductOptimization = {
      ...optimization,
      id,
      createdAt: new Date(),
      status: optimization.status || 'pending'
    };
    this.optimizations.set(id, newOptimization);
    return newOptimization;
  }

  async updateOptimization(id: number, data: Partial<ProductOptimization>): Promise<ProductOptimization | undefined> {
    const optimization = this.optimizations.get(id);
    if (!optimization) return undefined;

    const updatedOptimization: ProductOptimization = {
      ...optimization,
      ...data,
    };
    this.optimizations.set(id, updatedOptimization);
    return updatedOptimization;
  }

  // Metrics operations
  async getStoreMetrics(storeId: number, days = 7): Promise<StoreMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Array.from(this.metrics.values())
      .filter(metric => 
        metric.storeId === storeId && metric.date >= startDate
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createStoreMetric(metric: InsertStoreMetric): Promise<StoreMetric> {
    const id = this.metricIdCounter++;
    const newMetric: StoreMetric = {
      ...metric,
      id,
      createdAt: new Date()
    };
    this.metrics.set(id, newMetric);
    return newMetric;
  }

  // AI Request operations
  async getAiRequestsByUserId(userId: string): Promise<AiRequest[]> {
    return Array.from(this.aiRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAiRequestById(id: number): Promise<AiRequest | undefined> {
    return this.aiRequests.get(id);
  }

  async createAiRequest(request: InsertAiRequest): Promise<AiRequest> {
    const id = this.aiRequestIdCounter++;
    const newRequest: AiRequest = {
      ...request,
      id,
      createdAt: new Date(),
      status: request.status || 'pending'
    };
    this.aiRequests.set(id, newRequest);
    return newRequest;
  }

  async updateAiRequest(id: number, data: Partial<AiRequest>): Promise<AiRequest | undefined> {
    const request = this.aiRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: AiRequest = {
      ...request,
      ...data,
    };
    this.aiRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Notification operations
  async getNotificationsByUserId(userId: string, limit = 10): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.set(id, {
      ...notification,
      isRead: true
    });
    return true;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification:Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      isRead: notification.isRead !== undefined ? notification.isRead : false
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  async getAllOptimizationsByUserId(userId: string): Promise<any[]> {
    return [];
  }
  async updateUser(id: string, updates: Partial<User>): Promise<void> {
      const user = this.users.get(id);
      if (!user) throw new Error('User not found');

      const updatedUser: User = {
        ...user,
        ...updates,
        updatedAt: new Date()
      };
      this.users.set(id, updatedUser);
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.stripeCustomerId === customerId);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByToken(token: string): Promise<any> {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            const user = this.users.get(decoded.userId);
            if (!user) return null;
            return {
                claims: {
                    sub: user.id,
                    email: user.email || '',
                    first_name: user.firstName || '',
                    last_name: user.lastName || ''
                }
            };
        } catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }
}

// Use in-memory storage for development and DB storage for production
export const storage = process.env.NODE_ENV === 'production'
  ? new DatabaseStorage()
  : new MemStorage();