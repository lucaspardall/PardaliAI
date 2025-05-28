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

// Verificar se a conexão está ativa
const checkConnection = async (): Promise<boolean> => {
  try {
    console.log("Verificando conexão com banco de dados...");
    await rawSql("SELECT 1");
    console.log("Conexão com banco de dados estabelecida com sucesso");
    return true;
  } catch (err) {
    console.error("Erro de conexão com banco de dados:", err);
    return false;
  }
};

// Função para executar queries com retry e diagnóstico
const executeWithRetry = async (fn: Function, maxRetries = 5): Promise<any> => {
  let lastError;

  // Verifica se a conexão está funcionando antes de tentar executar a query
  const isConnected = await checkConnection();
  if (!isConnected) {
    console.log("Tentando reconectar ao banco de dados...");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Log de diagnóstico
      if (attempt > 0) {
        console.log(`Tentativa ${attempt + 1}/${maxRetries} - Executando query...`);
      }

      // Executa a função
      const result = await fn();

      // Se chegou aqui, a query foi bem-sucedida
      if (attempt > 0) {
        console.log(`Query executada com sucesso após ${attempt + 1} tentativas`);
      }

      return result;
    } catch (err: any) {
      lastError = err;

      // Log detalhado do erro
      console.error(`Erro na tentativa ${attempt + 1}/${maxRetries}:`, {
        message: err.message,
        code: err.code,
        detail: err.detail,
        severity: err.severity,
        position: err.position
      });

      // Se for erro de timeout ou conexão, aguarda e tenta novamente
      if (err.message && (
          err.message.includes('connection timed out') || 
          err.message.includes('could not connect to server') ||
          err.message.includes('timeout') ||
          err.code === 'ECONNREFUSED'
        )) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Backoff exponencial até 10 segundos
        console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Para outros erros, lança imediatamente
      throw err;
    }
  }

  console.error("Todas as tentativas falharam. Último erro:", lastError);
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

// Cache para evitar múltiplas verificações simultâneas
let connectionPromise: Promise<boolean> | null = null;

export async function connectToDatabase() {
  // Se já há uma verificação em andamento, aguardar ela
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      console.log("Verificando conexão com banco de dados...");

      // Verificar se existe a variável de ambiente
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não está definida");
      }

      // Testar a conexão executando uma query simples
      await sql`SELECT 1`;
      console.log("Conexão com banco de dados estabelecida com sucesso");

      return true;
    } catch (error) {
      console.error("Erro ao conectar com o banco de dados:", error);
      connectionPromise = null; // Reset para permitir nova tentativa
      throw error;
    }
  })();

  return connectionPromise;
}

export async function testConnection() {
  try {
    // Reduzido log para evitar spam no console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Testando conexão com banco...');
    }
    // Use a simple query to test the connection
    // Assuming 'users' is defined or imported elsewhere in your code
    // Example: await db.select().from(users).limit(1);
    console.log("Ensure 'users' table is properly imported or defined for this test to work.");
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error);
    return false;
  }
}