CREATE TABLE "ai_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"processing_time" integer,
	"error_message" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"action_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_optimizations" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"ai_request_id" integer
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"product_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" real NOT NULL,
	"stock" integer NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"category" varchar,
	"status" varchar DEFAULT 'active' NOT NULL,
	"ctr" real,
	"views" integer,
	"sales" integer,
	"revenue" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopee_stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"shop_id" varchar NOT NULL,
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
	CONSTRAINT "shopee_stores_shop_id_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
CREATE TABLE "store_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"total_views" integer,
	"total_sales" integer,
	"total_revenue" real,
	"average_ctr" real,
	"product_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"plan" varchar DEFAULT 'free' NOT NULL,
	"plan_status" varchar DEFAULT 'active' NOT NULL,
	"plan_expires_at" timestamp,
	"ai_credits_left" integer DEFAULT 10 NOT NULL,
	"store_limit" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_optimizations" ADD CONSTRAINT "product_optimizations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_shopee_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."shopee_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopee_stores" ADD CONSTRAINT "shopee_stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_metrics" ADD CONSTRAINT "store_metrics_store_id_shopee_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."shopee_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_store_product" ON "products" USING btree ("store_id","product_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_store_date" ON "store_metrics" USING btree ("store_id","date");