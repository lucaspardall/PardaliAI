import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
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