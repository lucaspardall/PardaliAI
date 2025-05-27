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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Added CIP Shopee specific user info
  plan: varchar("plan").default("free").notNull(), // free, starter, pro, enterprise
  planStatus: varchar("plan_status").default("active").notNull(), // active, canceled, past_due
  planExpiresAt: timestamp("plan_expires_at"),
  aiCreditsLeft: integer("ai_credits_left").default(10).notNull(),
  storeLimit: integer("store_limit").default(1).notNull(),
});

export const shopeeStores = pgTable("shopee_stores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shopId: varchar("shop_id").unique().notNull(),
  shopName: varchar("shop_name").notNull(),
  shopLogo: varchar("shop_logo"),
  shopRegion: varchar("shop_region").default("BR").notNull(),
  accessToken: varchar("access_token").notNull(),
  refreshToken: varchar("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  totalProducts: integer("total_products").default(0).notNull(),
  averageCtr: real("average_ctr"),
  monthlyRevenue: real("monthly_revenue"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  stock: integer("stock").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  category: varchar("category"),
  status: varchar("status").default("active").notNull(), // active, inactive, deleted
  ctr: real("ctr"),
  views: integer("views"),
  sales: integer("sales"),
  revenue: real("revenue"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncAt: timestamp("last_sync_at"),
}, (table) => {
  return [
    uniqueIndex("idx_store_product").on(table.storeId, table.productId)
  ];
});

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

// Schema para pedidos
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id').notNull().references(() => shopeeStores.id, { onDelete: "cascade" }),
  orderSn: varchar('order_sn', { length: 255 }).notNull().unique(),
  orderStatus: varchar('order_status', { length: 50 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('BRL'),
  paymentMethod: varchar('payment_method', { length: 100 }),
  shippingCarrier: varchar('shipping_carrier', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  createTime: timestamp('create_time').notNull(),
  updateTime: timestamp('update_time').notNull(),
  buyerUsername: varchar('buyer_username', { length: 255 }),
  recipientAddress: text('recipient_address'),
  items: jsonb('items').$type<any[]>(),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return [
    index("idx_orders_store_status").on(table.storeId, table.orderStatus),
    index("idx_orders_create_time").on(table.createTime),
    index("idx_orders_tracking").on(table.trackingNumber)
  ];
});

// Order schemas (após definição da tabela)
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;