import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';

const app = express();

// Configurar CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cipshopee.replit.app'] 
    : ['http://localhost:5000', 'http://localhost:3000', 'http://0.0.0.0:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
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

    // Middleware para garantir respostas JSON válidas
    app.use('/api/*', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Endpoint de configuração limpo
    app.get('/api/config', (req, res) => {
      res.json({
        app: 'CIP Shopee',
        version: '1.0.0',
        auth: 'replit-native'
      });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Configuração de porta com fallback automático
    const basePort = parseInt(process.env.PORT || '5000', 10);
    let port = basePort;

    const startServer = (attemptPort: number) => {
      server.listen(attemptPort, '0.0.0.0', () => {
        log(`✅ Server running on port ${attemptPort}`);
        if (attemptPort !== basePort) {
          log(`⚠️ Porta ${basePort} estava ocupada, usando porta ${attemptPort}`);
        }
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`❌ Porta ${attemptPort} já está em uso, tentando ${attemptPort + 1}...`);
          startServer(attemptPort + 1);
        } else {
          console.error('Erro ao iniciar servidor:', err);
          process.exit(1);
        }
      });
    };

    startServer(port);
  } catch (err) {
    console.error("Erro na inicialização do servidor:", err);
    process.exit(1);
  }
})();