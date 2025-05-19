import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

// Usa a string de conexão para o banco de dados
const connectionString = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/cipshopee";

// Cria um cliente SQL raw do Neon
const rawSql = neon(connectionString);

// Adiciona compatibilidade para métodos que o connect-pg-simple espera
const enhancedSql = Object.assign(rawSql, {
  // Implementação da função query que o connect-pg-simple espera
  query: async (text: string, params: any[] = []) => {
    try {
      // Trata o caso de params vazios para evitar erros de binding
      if (!params || params.length === 0) {
        const result = await rawSql(text);
        return {
          rows: Array.isArray(result) ? result : [],
          rowCount: Array.isArray(result) ? result.length : 0
        };
      }
      
      const result = await rawSql(text, params);
      // Formata o resultado para o formato que o connect-pg-simple espera
      return {
        rows: Array.isArray(result) ? result : [],
        rowCount: Array.isArray(result) ? result.length : 0
      };
    } catch (err) {
      console.error("Erro na execução de query:", err);
      throw err;
    }
  }
});

// Exportar o cliente SQL para uso com connect-pg-simple
export const sql = enhancedSql;

// Exporta o cliente Drizzle para operações de ORM
export const db = drizzle(rawSql);
