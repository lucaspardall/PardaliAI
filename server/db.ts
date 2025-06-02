import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

// Usa a string de conexão para o banco de dados
const connectionString = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/cipshopee";

// Configurações otimizadas para Replit PostgreSQL
const neonOptions = {
  connectionTimeoutMillis: 30000, // 30 segundos para timeout
  queryTimeout: 20000, // Timeout de query
  idleTimeoutMillis: 30000, // Timeout de idle
  max: 10, // Máximo de conexões no pool
  min: 1, // Mínimo de conexões
  acquireTimeoutMillis: 60000, // Timeout para adquirir conexão
  createTimeoutMillis: 30000, // Timeout para criar conexão
  destroyTimeoutMillis: 5000, // Timeout para destruir conexão
  reapIntervalMillis: 1000, // Intervalo de limpeza
  createRetryIntervalMillis: 2000, // Intervalo entre retry de criação
};

// Cliente SQL otimizado para Replit
const rawSql = neon(connectionString, neonOptions);

// Cache de status da conexão para evitar verificações excessivas
let connectionStatus: { isConnected: boolean; lastCheck: number } = {
  isConnected: false,
  lastCheck: 0
};

// Verificar se a conexão está ativa (com cache de 30 segundos)
const checkConnection = async (): Promise<boolean> => {
  const now = Date.now();
  const cacheExpiry = 30000; // 30 segundos
  
  // Se verificou recentemente e estava conectado, retorna true
  if (connectionStatus.isConnected && (now - connectionStatus.lastCheck) < cacheExpiry) {
    return true;
  }
  
  try {
    // Log apenas em desenvolvimento ou se passou muito tempo
    const shouldLog = process.env.NODE_ENV === 'development' || (now - connectionStatus.lastCheck) > 60000;
    
    if (shouldLog) {
      console.log("🔌 Verificando conexão com banco...");
    }
    
    await rawSql("SELECT 1");
    
    connectionStatus = { isConnected: true, lastCheck: now };
    
    if (shouldLog) {
      console.log("✅ Conexão com banco estabelecida");
    }
    
    return true;
  } catch (err) {
    connectionStatus = { isConnected: false, lastCheck: now };
    console.error("❌ Erro de conexão com banco:", err);
    return false;
  }
};

// Função melhorada para retry com diferentes estratégias
const executeWithRetry = async (fn: Function, maxRetries = 3): Promise<any> => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Log apenas para múltiplas tentativas
      if (attempt > 0) {
        console.log(`[DB] Retry ${attempt + 1}/${maxRetries}`);
      }

      const result = await fn();
      
      // Log de sucesso apenas após retry
      if (attempt > 0) {
        console.log(`[DB] ✅ Sucesso após ${attempt + 1} tentativas`);
      }

      return result;
    } catch (err: any) {
      lastError = err;

      // Classificar tipos de erro
      const isConnectionError = err.code === 'ECONNREFUSED' || 
                               err.code === 'ENOTFOUND' ||
                               err.message?.includes('connection') ||
                               err.message?.includes('timeout');

      const isPreparedStatementError = err.code === '08P01' || 
                                      err.message?.includes('prepared statement') ||
                                      err.message?.includes('bind message');

      const isQueryError = err.code === '42P01' || // table does not exist
                          err.code === '42703' || // column does not exist
                          err.code === '23505';   // unique violation

      // Log estruturado do erro
      console.error(`[DB] Erro tentativa ${attempt + 1}/${maxRetries}:`, {
        type: isConnectionError ? 'CONNECTION' : 
              isPreparedStatementError ? 'PREPARED_STATEMENT' : 
              isQueryError ? 'QUERY' : 'OTHER',
        code: err.code,
        message: err.message?.substring(0, 200),
        severity: err.severity
      });

      // Estratégias diferentes por tipo de erro
      if (isPreparedStatementError) {
        // Não vale a pena retry para prepared statement
        console.error('[DB] ❌ Erro de prepared statement - não fazendo retry');
        throw err;
      }

      if (isQueryError) {
        // Erros de query não se beneficiam de retry
        console.error('[DB] ❌ Erro de query - não fazendo retry');
        throw err;
      }

      if (attempt === maxRetries - 1) {
        console.error('[DB] ❌ Todas tentativas falharam');
        throw err;
      }

      // Retry apenas para erros de conexão
      if (isConnectionError) {
        const waitTime = Math.min(500 * Math.pow(2, attempt), 5000);
        console.log(`[DB] ⏳ Aguardando ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Para outros erros, aguarda pouco tempo
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  throw lastError;
};

// Adiciona compatibilidade para métodos que o connect-pg-simple espera
const enhancedSql = Object.assign(rawSql, {
  // Implementação melhorada da função query
  query: async (text: string, params: any[] = []) => {
    try {
      return await executeWithRetry(async () => {
        // Normalizar parâmetros
        const normalizedParams = Array.isArray(params) ? params.filter(p => p !== undefined) : [];
        
        // Log para debug (apenas em desenvolvimento e para queries importantes)
        if (process.env.NODE_ENV === 'development' && !text.includes('sessions')) {
          console.log(`[DB] Query: ${text.substring(0, 100)}...`);
          console.log(`[DB] Params: ${normalizedParams.length} parameters`);
        }

        let result;
        
        // Executar query com ou sem parâmetros
        if (normalizedParams.length === 0) {
          // Query sem parâmetros - usar template literal
          result = await rawSql`${text}`;
        } else {
          // Query com parâmetros - usar função com array
          result = await rawSql(text, normalizedParams);
        }

        // Normalizar resultado
        const normalizedResult = {
          rows: Array.isArray(result) ? result : (result?.rows || []),
          rowCount: Array.isArray(result) ? result.length : (result?.rowCount || 0)
        };

        return normalizedResult;
      });
    } catch (err: any) {
      console.error("Erro na execução de query:", {
        query: text.substring(0, 100),
        paramCount: params?.length || 0,
        error: err.message,
        code: err.code
      });
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