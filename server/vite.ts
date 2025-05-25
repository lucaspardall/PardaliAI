
import { createServer } from 'vite';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Log colorido para desenvolvimento
export const log = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\x1b[36m${new Date().toLocaleTimeString()}\x1b[0m [express] ${message}`);
  } else {
    console.log(`${new Date().toLocaleTimeString()} [express] ${message}`);
  }
};

// Função para servir arquivos estáticos em produção
export const serveStatic = (app: express.Express) => {
  const publicDir = path.resolve('dist/public');
  
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir, {
      maxAge: '1d',
      etag: true,
      index: false
    }));
    
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      const indexPath = path.join(publicDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Página não encontrada');
      }
    });
  } else {
    log('Aviso: Diretório de arquivos estáticos não encontrado');
  }
};

// Configurar Vite para desenvolvimento
export const setupVite = async (app: express.Express, server: any) => {
  const clientDir = path.resolve('client');
  
  if (!fs.existsSync(clientDir)) {
    throw new Error('Diretório client não encontrado');
  }
  
  const vite = await createServer({
    root: clientDir,
    server: {
      middlewareMode: true,
      hmr: {
        server: server,
      },
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes
    if (url.startsWith('/api')) {
      return next();
    }

    try {
      // Ler o index.html
      let template = fs.readFileSync(
        path.resolve(clientDir, 'index.html'),
        'utf-8'
      );

      // Aplicar transformações do Vite
      template = await vite.transformIndexHtml(url, template);
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.message);
    }
  });
};
