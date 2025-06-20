import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  real,
  boolean,
  serial,
  uniqueIndex,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Campos para autenticação email/senha
  passwordHash: varchar("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  authProvider: varchar("auth_provider").default("replit").notNull(), // 'replit', 'email', 'google'
  verificationToken: varchar("verification_token"),
  resetToken: varchar("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Added CIP Shopee specific user info
  plan: varchar("plan").default("free").notNull(), // free, starter, pro, enterprise
  planStatus: varchar("plan_status").default("active").notNull(), // active, canceled, past_due
  planExpiresAt: timestamp("plan_expires_at"),
  aiCreditsLeft: integer("ai_credits_left").default(10).notNull(),
  storeLimit: integer("store_limit").default(1).notNull(),
  // Stripe integration fields
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
});

export const shopeeStores = pgTable("shopee_stores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shopId: varchar("shop_id").unique().notNull(),
  shopName: varchar("shop_name").notNull(),
  shopLogo: varchar("shop_logo"),
  shopDescription: text("shop_description"),
  shopRegion: varchar("shop_region").default("BR").notNull(),
  shopStatus: varchar("shop_status").default("normal"), // normal, frozen, banned
  isOfficial: boolean("is_official").default(false),
  isPreferred: boolean("is_preferred").default(false),
  // Tokens de acesso
  accessToken: varchar("access_token").notNull(),
  refreshToken: varchar("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  // Configurações
  isActive: boolean("is_active").default(true).notNull(),
  autoSync: boolean("auto_sync").default(true),
  syncInterval: integer("sync_interval").default(60), // em minutos
  // Dados de sincronização
  lastSyncAt: timestamp("last_sync_at"),
  lastSuccessfulSync: timestamp("last_successful_sync"),
  syncErrors: integer("sync_errors").default(0),
  lastSyncError: text("last_sync_error"),
  // Métricas da loja
  totalProducts: integer("total_products").default(0).notNull(),
  activeProducts: integer("active_products").default(0),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: real("total_revenue").default(0),
  averageCtr: real("average_ctr"),
  monthlyRevenue: real("monthly_revenue"),
  followerCount: integer("follower_count").default(0),
  rating: real("rating"),
  ratingCount: integer("rating_count").default(0),
  // Datas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_stores_user_active").on(table.userId, table.isActive),
    index("idx_stores_region").on(table.shopRegion),
    index("idx_stores_sync").on(table.lastSyncAt, table.isActive)
  ];
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  originalPrice: real("original_price"), // Preço original antes de promoções
  stock: integer("stock").notNull(),
  sold: integer("sold").default(0), // Quantidade vendida
  images: jsonb("images").$type<string[]>().default([]),
  category: varchar("category"),
  categoryId: varchar("category_id"), // ID da categoria na Shopee
  brand: varchar("brand"),
  weight: real("weight"), // Peso do produto
  dimensions: jsonb("dimensions").$type<{length?: number, width?: number, height?: number}>(),
  attributes: jsonb("attributes").$type<Record<string, any>>().default({}),
  variations: jsonb("variations").$type<ProductVariation[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: varchar("status").default("active").notNull(), // active, inactive, deleted, banned
  wholesales: jsonb("wholesales").$type<any[]>().default([]),
  condition: varchar("condition").default("new"), // new, used
  preOrder: boolean("pre_order").default(false),
  // Métricas de performance
  ctr: real("ctr"),
  conversionRate: real("conversion_rate"),
  views: integer("views").default(0),
  sales: integer("sales").default(0),
  revenue: real("revenue").default(0),
  likes: integer("likes").default(0),
  rating: real("rating"),
  ratingCount: integer("rating_count").default(0),
  // Datas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  shopeeCreatedAt: timestamp("shopee_created_at"),
  shopeeUpdatedAt: timestamp("shopee_updated_at"),
}, (table) => {
  return [
    uniqueIndex("idx_store_product").on(table.storeId, table.productId),
    index("idx_products_status").on(table.status),
    index("idx_products_category").on(table.categoryId),
    index("idx_products_performance").on(table.revenue, table.sales, table.views)
  ];
});

// Tipo para variações de produto
export interface ProductVariation {
  variationId: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  images?: string[];
  attributes?: Record<string, string>;
}

export const productOptimizations = pgTable("product_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  originalTitle: varchar("original_title"),
  originalDesc: text("original_desc"),
  originalKeywords: varchar("original_keywords"),
  suggestedTitle: varchar("suggested_title"),
  suggestedDesc: text("suggested_desc"),
  suggestedKeywords: varchar("suggested_keywords"),
  reasoningNotes: text("reasoning_notes"),
  status: varchar("status").default("pending").notNull(), // pending, applied, ignored
  appliedAt: timestamp("applied_at"),
  feedbackRating: integer("feedback_rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
  aiRequestId: integer("ai_request_id"),
});

export const storeMetrics = pgTable("store_metrics", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  totalViews: integer("total_views"),
  totalSales: integer("total_sales"),
  totalRevenue: real("total_revenue"),
  averageCtr: real("average_ctr"),
  productCount: integer("product_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex("idx_store_date").on(table.storeId, table.date)
  ];
});

export const aiRequests = pgTable("ai_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // product_optimization, product_creation, store_diagnosis
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  status: varchar("status").default("pending").notNull(), // pending, processing, completed, failed
  processingTime: integer("processing_time"), // in milliseconds
  errorMessage: varchar("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // info, success, warning, error
  isRead: boolean("is_read").default(false).notNull(),
  actionUrl: varchar("action_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod Schemas
export const upsertUserSchema = createInsertSchema(users);
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertShopeeStoreSchema = createInsertSchema(shopeeStores).omit({ id: true });
export type InsertShopeeStore = z.infer<typeof insertShopeeStoreSchema>;
export type ShopeeStore = typeof shopeeStores.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const insertProductOptimizationSchema = createInsertSchema(productOptimizations).omit({ id: true });
export type InsertProductOptimization = z.infer<typeof insertProductOptimizationSchema>;
export type ProductOptimization = typeof productOptimizations.$inferSelect;

export const insertStoreMetricSchema = createInsertSchema(storeMetrics).omit({ id: true });
export type InsertStoreMetric = z.infer<typeof insertStoreMetricSchema>;
export type StoreMetric = typeof storeMetrics.$inferSelect;

export const insertAiRequestSchema = createInsertSchema(aiRequests).omit({ id: true });
export type InsertAiRequest = z.infer<typeof insertAiRequestSchema>;
export type AiRequest = typeof aiRequests.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Tabela para logs de sistema e auditoria
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  storeId: integer("store_id").references(() => shopeeStores.id, { onDelete: "set null" }),
  action: varchar("action").notNull(), // sync, auth, api_call, error, etc.
  entity: varchar("entity"), // product, order, store, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  level: varchar("level").default("info").notNull(), // info, warning, error, debug
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_logs_user_action").on(table.userId, table.action),
    index("idx_logs_store_action").on(table.storeId, table.action),
    index("idx_logs_level_date").on(table.level, table.createdAt),
    index("idx_logs_entity").on(table.entity, table.entityId)
  ];
});

// Tabela para cache de dados da API Shopee
export const apiCache = pgTable("api_cache", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  endpoint: varchar("endpoint").notNull(), // get_item_list, get_order_list, etc.
  cacheKey: varchar("cache_key").notNull(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    uniqueIndex("idx_cache_store_endpoint_key").on(table.storeId, table.endpoint, table.cacheKey),
    index("idx_cache_expires").on(table.expiresAt)
  ];
});

// Tabela para histórico de créditos de IA
export const aiCreditsHistory = pgTable("ai_credits_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // 'used', 'refunded', 'bonus', 'plan_upgrade'
  amount: integer("amount").notNull(), // Quantidade de créditos (positivo para ganho, negativo para uso)
  previousBalance: integer("previous_balance").notNull(),
  newBalance: integer("new_balance").notNull(),
  description: text("description").notNull(),
  relatedEntityType: varchar("related_entity_type"), // 'optimization', 'bulk_optimization', 'product_creation'
  relatedEntityId: integer("related_entity_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_credits_history_user_date").on(table.userId, table.createdAt),
    index("idx_credits_history_action").on(table.action),
    index("idx_credits_history_entity").on(table.relatedEntityType, table.relatedEntityId)
  ];
});

// Schemas para as novas tabelas
export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({ id: true });
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

export const insertAiCreditsHistorySchema = createInsertSchema(aiCreditsHistory).omit({ id: true });
export type InsertAiCreditsHistory = z.infer<typeof insertAiCreditsHistorySchema>;
export type AiCreditsHistory = typeof aiCreditsHistory.$inferSelect;

export const insertApiCacheSchema = createInsertSchema(apiCache).omit({ id: true });
export type InsertApiCache = z.infer<typeof insertApiCacheSchema>;
export type ApiCache = typeof apiCache.$inferSelect;

// Tabela de diagnósticos da loja
export const storeDiagnoses = pgTable("store_diagnoses", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  overallScore: real("overall_score").notNull(), // Score de 0-10
  categoryScores: jsonb("category_scores").$type<CategoryScores>().default({}),
  strengths: jsonb("strengths").$type<string[]>().default([]),
  weaknesses: jsonb("weaknesses").$type<string[]>().default([]),
  recommendations: jsonb("recommendations").$type<TacticalRecommendation[]>().default([]),
  benchmarkData: jsonb("benchmark_data").$type<BenchmarkData>().default({}),
  metricsUsed: jsonb("metrics_used").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    index("idx_diagnoses_store_date").on(table.storeId, table.createdAt),
    index("idx_diagnoses_score").on(table.overallScore)
  ];
});

// Tipos para diagnóstico
export interface CategoryScores {
  ctr: number;
  inventory: number;
  sales: number;
  optimization: number;
  engagement: number;
}

export interface TacticalRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionSteps: string[];
  expectedImpact: string;
  estimatedTime: string;
}

export interface BenchmarkData {
  industryAverage: CategoryScores;
  topPerformers: CategoryScores;
  yourPosition: {
    percentile: number;
    rank: string; // 'excellent', 'good', 'average', 'below_average', 'poor'
  };
}

export const insertStoreDiagnosisSchema = createInsertSchema(storeDiagnoses).omit({ id: true });
export type InsertStoreDiagnosis = z.infer<typeof insertStoreDiagnosisSchema>;
export type StoreDiagnosis = typeof storeDiagnoses.$inferSelect;

// Tabela de pedidos da Shopee
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  orderSn: varchar('order_sn', { length: 255 }).notNull().unique(),
  orderStatus: varchar('order_status', { length: 50 }).notNull(),
  totalAmount: real('total_amount').notNull(), // Mudado de decimal para real para consistência
  currency: varchar('currency', { length: 10 }).default('BRL').notNull(),
  paymentMethod: varchar('payment_method', { length: 100 }),
  shippingCarrier: varchar('shipping_carrier', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  createTime: timestamp('create_time').notNull(),
  updateTime: timestamp('update_time').notNull(),
  buyerUsername: varchar('buyer_username', { length: 255 }),
  recipientAddress: text('recipient_address'),
  items: jsonb('items').$type<OrderItem[]>().default([]),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return [
    index("idx_orders_store_status").on(table.storeId, table.orderStatus),
    index("idx_orders_create_time").on(table.createTime),
    index("idx_orders_tracking").on(table.trackingNumber),
    index("idx_orders_store_date").on(table.storeId, table.createTime)
  ];
});

// Tipo para itens do pedido
export interface OrderItem {
  itemId: string;
  itemName: string;
  modelName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemSku?: string;
  variation?: string;
}

// Schemas para orders
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;