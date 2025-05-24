import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Importar middlewares de segurança adicionais
import { sanitizeRequest, sqlInjectionProtection } from "./middlewares/security";
import { setupRouteValidators } from "./middlewares/security/apply-validators";
import { setupCsrfProtection } from "./middlewares/security/csrf-protection";

// Importar configurações de produção se estiver em ambiente de produção
const productionConfig = process.env.NODE_ENV === 'production' 
  ? require('./config/production') 
  : {};

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Forçar HTTPS em produção
if (process.env.NODE_ENV === 'production' && productionConfig.security?.forceHttps) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    return next();
  });
}

// Configuração segura de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Em produção no Replit
    const allowedOrigins = [
      process.env.REPLIT_APP_URL,
      'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co',
      'https://' + process.env.REPL_SLUG + '.repl.co'
    ].filter(Boolean);

    // Em desenvolvimento, permitir localhost e domínios do Replit
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5173');
      // Adicionar padrões de Replit para desenvolvimento
      allowedOrigins.push(/.*\.replit\.dev$/);
      allowedOrigins.push(/.*-.*\.preview\.app\.github\.dev$/);
    }

    // Permitir requisições sem origin (ex: Postman) ou em desenvolvimento
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Verificar se o origin corresponde a algum dos padrões permitidos
    const originIsAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (originIsAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  // Aplicar configurações de cookie seguro em produção
  ...(process.env.NODE_ENV === 'production' && productionConfig.security?.cookieOptions 
      ? { cookieOptions: productionConfig.security.cookieOptions } 
      : {})
};

app.use(cors(corsOptions));

// Configurações de segurança
// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.shopee.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Aplicar headers adicionais de segurança em produção
if (process.env.NODE_ENV === 'production' && productionConfig.security?.headers) {
  app.use((req, res, next) => {
    Object.entries(productionConfig.security.headers).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
    next();
  });
}

// Rate limiting global - usando configurações de produção se disponíveis
const globalLimiter = rateLimit({
  windowMs: productionConfig.rateLimits?.global?.windowMs || 15 * 60 * 1000, // 15 minutos
  max: productionConfig.rateLimits?.global?.max || 100, // limite de requests
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use('/api/', globalLimiter);

// Rate limiting estrito para auth - usando configurações de produção se disponíveis
const authLimiter = rateLimit({
  windowMs: productionConfig.rateLimits?.auth?.windowMs || 15 * 60 * 1000,
  max: productionConfig.rateLimits?.auth?.max || 5, // tentativas de login
  skipSuccessfulRequests: true
});
app.use('/api/auth/login', authLimiter);
app.use('/api/shopee/auth', authLimiter);

// Sanitização contra NoSQL injection
app.use(mongoSanitize());

// Middlewares de segurança adicionais
app.use(sanitizeRequest); // Sanitiza entradas para prevenir XSS
app.use(sqlInjectionProtection); // Proteção contra SQL Injection

// Aplicar validadores específicos para rotas vulneráveis
setupRouteValidators(app);

// Configurar proteção CSRF para rotas sensíveis
setupCsrfProtection(app);

// Desabilitar header X-Powered-By
app.disable('x-powered-by');

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Em produção, use configurações de log restritas
      if (process.env.NODE_ENV === 'production') {
        if (productionConfig.logging?.level === 'error') {
          // Log apenas em caso de erro
          if (res.statusCode >= 400) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

            // Não incluir corpo da resposta em produção se sanitize estiver ativo
            if (!productionConfig.logging?.sanitize && capturedJsonResponse) {
              logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
              logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
          }
        }
      } else {
        // Em desenvolvimento, manter logs completos
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    }
  });

  next();
});

(async () => {
  try {
    // Importa o db para verificar a conexão antes de iniciar o servidor
    const { sql } = await import('./db');

    // Verificar conexão com o banco
    try {
      await sql("SELECT 1");
      log("Conexão com o banco de dados estabelecida com sucesso");
    } catch (dbErr) {
      log("Aviso: não foi possível conectar ao banco de dados. Algumas funcionalidades podem não estar disponíveis.");
      console.error("Erro de conexão com o banco:", dbErr);
    }

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Erro ${status}: ${message}`);
      res.status(status).json({ message });

      // Não lançar o erro, apenas logar
      console.error(err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Configuração de porta adaptada para funcionar tanto em desenvolvimento quanto em deploy
    const port = process.env.PORT || 5000;

    // Tentar portas alternativas se a primeira estiver ocupada
    function tryConnect(currentPort: number) {
      server.listen({
        port: currentPort,
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${currentPort}`);
      }).on('error', (err: any) => {
        log(`Erro na porta ${currentPort}: ${err.message}`);

        if (err.code === 'EADDRINUSE' && currentPort < 5010) {
          // Tentar próxima porta
          const nextPort = currentPort + 1;
          log(`Porta ${currentPort} está em uso, tentando porta ${nextPort}...`);
          tryConnect(nextPort);
        } else {
          log(`Erro não recuperável no servidor: ${err.message}`);
          throw err;
        }
      });
    }

    // Iniciar com a porta configurada
    tryConnect(port);
  } catch (err) {
    console.error("Erro na inicialização do servidor:", err);
    process.exit(1);
  }
})();