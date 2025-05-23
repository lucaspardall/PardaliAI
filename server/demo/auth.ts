/**
 * Sistema de autenticação para o modo de demonstração
 * 
 * Este módulo fornece autenticação dedicada para o modo de demonstração,
 * completamente separado do fluxo principal de autenticação.
 */

import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { db, sql } from '../db';
import connectPg from 'connect-pg-simple';

// Credenciais de demonstração fixas
const DEMO_CREDENTIALS = {
  username: 'testeshopee',
  password: 'ShopeeTest2025!',  // Em produção, usaríamos hash+salt
  user: {
    id: 'demo-user-123',
    email: 'demo@cipshopee.com',
    firstName: 'Demo',
    lastName: 'Usuário',
    profileImageUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=FF5722&color=fff',
    plan: 'premium',
    planStatus: 'active',
    aiCreditsLeft: 500,
    storeLimit: 3,
    planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

/**
 * Middleware para configurar sessão de demonstração
 */
export function setupDemoSession(app: any): void {
  const pgSession = connectPg(session);

  // Usar a mesma conexão de banco de dados, mas uma tabela diferente
  // Usar o cliente de DB já configurado no aplicativo principal
  const sessionStore = new pgSession({
    conObject: { pool: sql },
    tableName: 'demo_sessions', // Tabela separada para sessões demo
    createTableIfMissing: true,
  });

  // Configuração de sessão específica para o modo de demonstração
  app.use('/demo', session({
    store: sessionStore,
    name: 'demo.sid', // Nome do cookie diferente para não conflitar
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    }
  }));
}

/**
 * Processa login para o modo de demonstração
 */
export function handleDemoLogin(req: Request, res: Response): void {
  const { username, password } = req.body;

  // Verificar credenciais
  if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
    // Armazenar informações do usuário na sessão
    const demoSession = req.session as any;
    demoSession.demoUser = DEMO_CREDENTIALS.user;
    demoSession.isDemoMode = true;

    res.status(200).json({
      success: true,
      user: DEMO_CREDENTIALS.user,
      redirectTo: '/demo/dashboard' // Adicionar redireção explícita
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais de demonstração inválidas'
    });
  }
}

/**
 * Processa logout do modo de demonstração
 */
export function handleDemoLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão de demonstração:', err);
      res.status(500).json({ success: false, message: 'Erro ao fazer logout' });
    } else {
      res.clearCookie('demo.sid');
      
      // Verificar se é uma solicitação AJAX
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        res.status(200).json({ success: true, redirectTo: '/' });
      } else {
        // Redirecionar para a página inicial
        res.redirect('/');
      }
    }
  });
}

/**
 * Middleware para verificar se o usuário está autenticado no modo de demonstração
 */
export function isDemoAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const demoSession = req.session as any;

  if (demoSession && demoSession.demoUser && demoSession.isDemoMode) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Não autenticado no modo de demonstração',
      redirectTo: '/demo/login'
    });
  }
}

/**
 * Middleware para adicionar o usuário de demonstração no request
 */
export function addDemoUser(req: Request, res: Response, next: NextFunction): void {
  const demoSession = req.session as any;

  if (demoSession && demoSession.demoUser) {
    (req as any).demoUser = demoSession.demoUser;
  }

  next();
}