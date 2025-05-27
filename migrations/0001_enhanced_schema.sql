
-- Migration para melhorias no schema do banco de dados

-- Adicionar novas colunas à tabela products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "original_price" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sold" integer DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dimensions" jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "attributes" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variations" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wholesales" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "condition" varchar DEFAULT 'new';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pre_order" boolean DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "conversion_rate" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "likes" integer DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shopee_created_at" timestamp;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shopee_updated_at" timestamp;

-- Adicionar valores padrão para colunas existentes
UPDATE "products" SET "views" = 0 WHERE "views" IS NULL;
UPDATE "products" SET "sales" = 0 WHERE "sales" IS NULL;
UPDATE "products" SET "revenue" = 0 WHERE "revenue" IS NULL;

-- Adicionar novas colunas à tabela shopee_stores
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "shop_description" text;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "shop_status" varchar DEFAULT 'normal';
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "is_official" boolean DEFAULT false;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "is_preferred" boolean DEFAULT false;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "auto_sync" boolean DEFAULT true;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "sync_interval" integer DEFAULT 60;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "last_successful_sync" timestamp;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "sync_errors" integer DEFAULT 0;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "last_sync_error" text;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "active_products" integer DEFAULT 0;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "total_orders" integer DEFAULT 0;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "total_revenue" real DEFAULT 0;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "follower_count" integer DEFAULT 0;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "rating" real;
ALTER TABLE "shopee_stores" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0;

-- Criar tabela orders se não existir
CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY,
  "store_id" integer NOT NULL,
  "order_sn" varchar(255) NOT NULL UNIQUE,
  "order_status" varchar(50) NOT NULL,
  "total_amount" real NOT NULL,
  "currency" varchar(10) DEFAULT 'BRL' NOT NULL,
  "payment_method" varchar(100),
  "shipping_carrier" varchar(100),
  "tracking_number" varchar(255),
  "create_time" timestamp NOT NULL,
  "update_time" timestamp NOT NULL,
  "buyer_username" varchar(255),
  "recipient_address" text,
  "items" jsonb DEFAULT '[]'::jsonb,
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("store_id") REFERENCES "shopee_stores" ("id") ON DELETE CASCADE
);

-- Criar tabela system_logs
CREATE TABLE IF NOT EXISTS "system_logs" (
  "id" serial PRIMARY KEY,
  "user_id" varchar,
  "store_id" integer,
  "action" varchar NOT NULL,
  "entity" varchar,
  "entity_id" varchar,
  "details" jsonb DEFAULT '{}'::jsonb,
  "level" varchar DEFAULT 'info' NOT NULL,
  "ip_address" varchar,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("store_id") REFERENCES "shopee_stores" ("id") ON DELETE SET NULL
);

-- Criar tabela api_cache
CREATE TABLE IF NOT EXISTS "api_cache" (
  "id" serial PRIMARY KEY,
  "store_id" integer NOT NULL,
  "endpoint" varchar NOT NULL,
  "cache_key" varchar NOT NULL,
  "data" jsonb NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  FOREIGN KEY ("store_id") REFERENCES "shopee_stores" ("id") ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products" ("status");
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_performance" ON "products" ("revenue", "sales", "views");

CREATE INDEX IF NOT EXISTS "idx_stores_user_active" ON "shopee_stores" ("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_stores_region" ON "shopee_stores" ("shop_region");
CREATE INDEX IF NOT EXISTS "idx_stores_sync" ON "shopee_stores" ("last_sync_at", "is_active");

CREATE INDEX IF NOT EXISTS "idx_orders_store_status" ON "orders" ("store_id", "order_status");
CREATE INDEX IF NOT EXISTS "idx_orders_create_time" ON "orders" ("create_time");
CREATE INDEX IF NOT EXISTS "idx_orders_tracking" ON "orders" ("tracking_number");
CREATE INDEX IF NOT EXISTS "idx_orders_store_date" ON "orders" ("store_id", "create_time");

CREATE INDEX IF NOT EXISTS "idx_logs_user_action" ON "system_logs" ("user_id", "action");
CREATE INDEX IF NOT EXISTS "idx_logs_store_action" ON "system_logs" ("store_id", "action");
CREATE INDEX IF NOT EXISTS "idx_logs_level_date" ON "system_logs" ("level", "created_at");
CREATE INDEX IF NOT EXISTS "idx_logs_entity" ON "system_logs" ("entity", "entity_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_cache_store_endpoint_key" ON "api_cache" ("store_id", "endpoint", "cache_key");
CREATE INDEX IF NOT EXISTS "idx_cache_expires" ON "api_cache" ("expires_at");

-- Atualizar meta dados da migration
INSERT INTO "public"."__drizzle_migrations" ("id", "hash", "created_at") 
VALUES (1, '0001_enhanced_schema', NOW())
ON CONFLICT ("id") DO NOTHING;
