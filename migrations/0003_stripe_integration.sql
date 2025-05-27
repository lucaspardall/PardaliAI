
-- Add Stripe integration fields to users table
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar;
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" varchar;

-- Create unique indexes for Stripe fields
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_idx" ON "users" ("stripe_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_subscription_id_idx" ON "users" ("stripe_subscription_id");
