import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
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
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

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