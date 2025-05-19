import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Configuração do cliente Neon Database para PostgreSQL
const connectionString = process.env.DATABASE_URL;
const neonClient = neon(connectionString);

// Adicionar método query para compatibilidade
const sql = Object.assign(neonClient, {
  query: async (text, params) => {
    try {
      return await neonClient(text, params);
    } catch (error) {
      console.error('Erro ao executar query:', error);
      throw error;
    }
  }
});

// Inicializar o cliente Drizzle ORM
export const db = drizzle(sql, { schema });
export { sql }; // Export sql directly
export const client = sql;