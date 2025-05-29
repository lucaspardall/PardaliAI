
-- Tabela para armazenar diagnósticos de loja
CREATE TABLE "store_diagnoses" (
  "id" SERIAL PRIMARY KEY,
  "store_id" INTEGER NOT NULL REFERENCES "shopee_stores"("id") ON DELETE CASCADE,
  "overall_score" REAL NOT NULL, -- Score de 0-10
  "category_scores" JSONB NOT NULL DEFAULT '{}', -- Scores por categoria
  "strengths" JSONB NOT NULL DEFAULT '[]', -- Array de pontos fortes
  "weaknesses" JSONB NOT NULL DEFAULT '[]', -- Array de pontos fracos
  "recommendations" JSONB NOT NULL DEFAULT '[]', -- Array de recomendações
  "benchmark_data" JSONB NOT NULL DEFAULT '{}', -- Dados de comparação
  "metrics_used" JSONB NOT NULL DEFAULT '{}', -- Métricas utilizadas no cálculo
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX "idx_diagnoses_store_date" ON "store_diagnoses" ("store_id", "created_at");
CREATE INDEX "idx_diagnoses_score" ON "store_diagnoses" ("overall_score");
