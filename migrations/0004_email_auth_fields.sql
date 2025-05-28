
-- Migration: Add email/password authentication fields
-- Created: 2024-01-XX

-- Add authentication fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_provider" varchar DEFAULT 'replit';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" varchar;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expires" timestamp;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_verification_token_idx" ON "users" ("verification_token");
CREATE INDEX IF NOT EXISTS "users_reset_token_idx" ON "users" ("reset_token");
CREATE INDEX IF NOT EXISTS "users_auth_provider_idx" ON "users" ("auth_provider");

-- Update existing users to have 'replit' as auth provider
UPDATE "users" SET "auth_provider" = 'replit' WHERE "auth_provider" IS NULL;
