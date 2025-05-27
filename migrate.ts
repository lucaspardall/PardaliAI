import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { neon } from "@neondatabase/serverless";
import { sql } from "./server/db";
import * as schema from "./shared/schema";

// Log the environment variables for debugging
console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");

// Create the neon SQL client
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Run the migration
async function main() {
  console.log("Running migration...");

  try {
    // Push the schema to the database
    await db.execute(/* SQL */ `
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar UNIQUE,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "plan" varchar DEFAULT 'free' NOT NULL,
        "plan_status" varchar DEFAULT 'active' NOT NULL,
        "plan_expires_at" timestamp,
        "ai_credits_left" integer DEFAULT 10 NOT NULL,
        "store_limit" integer DEFAULT 1 NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "shopee_stores" (
        "id" serial PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "shop_id" varchar UNIQUE NOT NULL,
        "shop_name" varchar NOT NULL,
        "shop_logo" varchar,
        "shop_region" varchar DEFAULT 'BR' NOT NULL,
        "access_token" varchar NOT NULL,
        "refresh_token" varchar NOT NULL,
        "token_expires_at" timestamp NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_sync_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "total_products" integer DEFAULT 0 NOT NULL,
        "average_ctr" real,
        "monthly_revenue" real,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY,
        "store_id" integer NOT NULL,
        "product_id" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "price" real NOT NULL,
        "stock" integer NOT NULL,
        "images" jsonb DEFAULT '[]',
        "category" varchar,
        "status" varchar DEFAULT 'active' NOT NULL,
        "ctr" real,
        "views" integer,
        "sales" integer,
        "revenue" real,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "last_sync_at" timestamp,
        FOREIGN KEY ("store_id") REFERENCES "shopee_stores" ("id") ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "idx_store_product" ON "products" ("store_id", "product_id");

      CREATE TABLE IF NOT EXISTS "product_optimizations" (
        "id" serial PRIMARY KEY,
        "product_id" integer NOT NULL,
        "original_title" varchar,
        "original_desc" text,
        "original_keywords" varchar,
        "suggested_title" varchar,
        "suggested_desc" text,
        "suggested_keywords" varchar,
        "reasoning_notes" text,
        "status" varchar DEFAULT 'pending' NOT NULL,
        "applied_at" timestamp,
        "feedback_rating" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "ai_request_id" integer,
        FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "store_metrics" (
        "id" serial PRIMARY KEY,
        "store_id" integer NOT NULL,
        "date" timestamp NOT NULL,
        "total_views" integer,
        "total_sales" integer,
        "total_revenue" real,
        "average_ctr" real,
        "product_count" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("store_id") REFERENCES "shopee_stores" ("id") ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX IF NOT EXISTS "idx_store_date" ON "store_metrics" ("store_id", "date");

      CREATE TABLE IF NOT EXISTS "ai_requests" (
        "id" serial PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "type" varchar NOT NULL,
        "input" jsonb NOT NULL,
        "output" jsonb,
        "status" varchar DEFAULT 'pending' NOT NULL,
        "processing_time" integer,
        "error_message" varchar,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "title" varchar NOT NULL,
        "message" text NOT NULL,
        "type" varchar NOT NULL,
        "is_read" boolean DEFAULT false NOT NULL,
        "action_url" varchar,
        "created_at" timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();

const runMigrations = async () => {
  console.log("⏳ Running migrations...");

  const start = Date.now();

  try {
    // Executar migrations do Drizzle
    await migrate(db, { migrationsFolder: "./migrations" });

    // Executar migration customizada de melhorias
    console.log("🔧 Applying database enhancements...");

    // Verificar se precisa executar a migration de melhorias
    const migrationCheck = await sql.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'original_price'
      ) as enhanced
    `);

    if (!migrationCheck.rows[0]?.enhanced) {
      console.log("📊 Adding enhanced database schema...");

      // Adicionar novas colunas à tabela products
      await sql.query(`
        ALTER TABLE "products" 
        ADD COLUMN IF NOT EXISTS "original_price" real,
        ADD COLUMN IF NOT EXISTS "sold" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "category_id" varchar,
        ADD COLUMN IF NOT EXISTS "brand" varchar,
        ADD COLUMN IF NOT EXISTS "weight" real,
        ADD COLUMN IF NOT EXISTS "dimensions" jsonb,
        ADD COLUMN IF NOT EXISTS "attributes" jsonb DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS "variations" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "wholesales" jsonb DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "condition" varchar DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS "pre_order" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "conversion_rate" real,
        ADD COLUMN IF NOT EXISTS "likes" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "rating" real,
        ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "shopee_created_at" timestamp,
        ADD COLUMN IF NOT EXISTS "shopee_updated_at" timestamp
      `);

      // Adicionar novas colunas à tabela shopee_stores
      await sql.query(`
        ALTER TABLE "shopee_stores"
        ADD COLUMN IF NOT EXISTS "shop_description" text,
        ADD COLUMN IF NOT EXISTS "shop_status" varchar DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS "is_official" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "is_preferred" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "auto_sync" boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS "sync_interval" integer DEFAULT 60,
        ADD COLUMN IF NOT EXISTS "last_successful_sync" timestamp,
        ADD COLUMN IF NOT EXISTS "sync_errors" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "last_sync_error" text,
        ADD COLUMN IF NOT EXISTS "active_products" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "total_orders" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "total_revenue" real DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "follower_count" integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "rating" real,
        ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0
      `);

      // Criar novos índices
      await sql.query(`
        CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products" ("status");
        CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" ("category_id");
        CREATE INDEX IF NOT EXISTS "idx_products_performance" ON "products" ("revenue", "sales", "views");
        CREATE INDEX IF NOT EXISTS "idx_stores_user_active" ON "shopee_stores" ("user_id", "is_active");
        CREATE INDEX IF NOT EXISTS "idx_stores_region" ON "shopee_stores" ("shop_region");
        CREATE INDEX IF NOT EXISTS "idx_stores_sync" ON "shopee_stores" ("last_sync_at", "is_active");
      `);

      console.log("✅ Database enhancements applied successfully");
    } else {
      console.log("ℹ️ Database already enhanced, skipping...");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  const end = Date.now();

  console.log(`✅ All migrations completed in ${end - start}ms`);
  process.exit(0);
};