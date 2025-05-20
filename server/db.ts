import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

// Usa a string de conexão para o banco de dados
const connectionString = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/cipshopee";

// Configurações para melhorar a robustez da conexão
const neonOptions = {
  connectionTimeoutMillis: 10000, // 10 segundos para timeout de conexão
  max_retries: 5, // Número máximo de retentativas
  retry_interval: 1000, // Intervalo entre retentativas em ms
};

// Cria um cliente SQL raw do Neon com opções melhoradas
const rawSql = neon(connectionString, neonOptions);

// Função para executar queries com retry
const executeWithRetry = async (fn: Function, maxRetries = 3): Promise<any> => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Se for erro de timeout ou conexão, aguarda e tenta novamente
      if (err.message && (
          err.message.includes('connection timed out') || 
          err.message.includes('could not connect to server')
        )) {
        console.log(`Tentativa ${attempt + 1}/${maxRetries} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      // Para outros erros, lança imediatamente
      throw err;
    }
  }
  throw lastError;
};

// Adiciona compatibilidade para métodos que o connect-pg-simple espera
const enhancedSql = Object.assign(rawSql, {
  // Implementação da função query que o connect-pg-simple espera
  query: async (text: string, params: any[] = []) => {
    try {
      return await executeWithRetry(async () => {
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
      });
    } catch (err) {
      console.error("Erro na execução de query após múltiplas tentativas:", err);
      throw err;
    }
  }
});

// Exportar o cliente SQL para uso com connect-pg-simple
export const sql = enhancedSql;

// Exporta o cliente Drizzle para operações de ORM
export const db = drizzle(rawSql);
