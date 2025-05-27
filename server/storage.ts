import {
  users,
  type User,
  type UpsertUser,
  shopeeStores,
  type ShopeeStore,
  type InsertShopeeStore,
  products,
  type Product,
  type InsertProduct,
  productOptimizations,
  type ProductOptimization,
  type InsertProductOptimization,
  storeMetrics,
  type StoreMetric,
  type InsertStoreMetric,
  aiRequests,
  type AiRequest,
  type InsertAiRequest,
  notifications,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gt, lt, gte, lte, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async updateUserAiCredits(userId: string, credits: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        aiCreditsLeft: credits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Store operations
  async getStoresByUserId(userId: string): Promise<ShopeeStore[]> {
    console.log(`Buscando lojas para o usuário: ${userId}`);
    try {
      // Usando o Drizzle ORM sem SQL direto
      const stores = await db
        .select()
        .from(shopeeStores)
        .where(eq(shopeeStores.userId, userId))
        .orderBy(desc(shopeeStores.createdAt));

      console.log(`Encontradas ${stores.length} lojas para o usuário ${userId}`);
      return stores;
    } catch (error) {
      console.error("Erro detalhado em getStoresByUserId:", error);
      if (error instanceof Error) {
        console.error("Mensagem:", error.message);
        console.error("Stack:", error.stack);
      }
      // Retorna array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }

  async getStoreById(id: number): Promise<ShopeeStore | undefined> {
    const [store] = await db
      .select()
      .from(shopeeStores)
      .where(eq(shopeeStores.id, id));
    return store;
  }

  async getStoreByShopId(shopId: string): Promise<ShopeeStore | undefined> {
    const [store] = await db
      .select()
      .from(shopeeStores)
      .where(eq(shopeeStores.shopId, shopId));
    return store;
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

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  // Métodos para pedidos
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

  async updateUserAiCredits(userId: string, credits: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      aiCreditsLeft: credits,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
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
    this.products.set(id, newProduct);
    return newProduct;
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
    const newNotification: Notification = {
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
}

// Use in-memory storage for development and DB storage for production
export const storage = process.env.NODE_ENV === 'production'
  ? new DatabaseStorage()
  : new MemStorage();