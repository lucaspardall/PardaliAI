
-- Migração para adicionar tabela de histórico de créditos de IA
CREATE TABLE IF NOT EXISTS "ai_credits_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" VARCHAR NOT NULL,
  "amount" INTEGER NOT NULL,
  "previous_balance" INTEGER NOT NULL,
  "new_balance" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "related_entity_type" VARCHAR,
  "related_entity_id" INTEGER,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_credits_history_user_date" ON "ai_credits_history" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_credits_history_action" ON "ai_credits_history" ("action");
CREATE INDEX IF NOT EXISTS "idx_credits_history_entity" ON "ai_credits_history" ("related_entity_type", "related_entity_id");

-- Inserir dados iniciais para usuários existentes (histórico retroativo básico)
INSERT INTO "ai_credits_history" ("user_id", "action", "amount", "previous_balance", "new_balance", "description", "created_at")
SELECT 
  "id" as "user_id",
  'plan_upgrade' as "action",
  CASE 
    WHEN "plan" = 'free' THEN 10
    WHEN "plan" = 'starter' THEN 100
    ELSE 9999
  END as "amount",
  0 as "previous_balance",
  "ai_credits_left" as "new_balance",
  CASE 
    WHEN "plan" = 'free' THEN 'Créditos iniciais do plano gratuito'
    ELSE CONCAT('Créditos do plano ', UPPER("plan"))
  END as "description",
  "created_at"
FROM "users" 
WHERE "ai_credits_left" IS NOT NULL;
