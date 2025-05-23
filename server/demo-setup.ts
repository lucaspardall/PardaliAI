/**
 * Script simplificado para criar uma conta de demonstração para a Shopee
 */
import { storage } from './storage';
import { db } from './db';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { users, shopeeStores, products, productOptimizations, storeMetrics, notifications } from '@shared/schema';

/**
 * Cria uma conta de usuário de demonstração para a Shopee
 */
export async function createDemoAccount() {
  try {
    // Configurações da conta de demonstração
    const username = 'testeshopee';
    const password = 'ShopeeTest2025!';
    const userId = `demo_${username}`;
    
    console.log(`Criando conta de demonstração para a Shopee: ${username}`);
    
    // Verificar se o usuário já existe
    let user = await storage.getUser(userId);
    
    if (!user) {
      // Criar novo usuário demo
      user = await storage.upsertUser({
        id: userId,
        email: `${username}@cipshopee.demo`,
        firstName: 'Demo',
        lastName: 'Shopee',
        profileImageUrl: 'https://ui-avatars.com/api/?name=Demo+Shopee&background=FF5722&color=fff',
        plan: 'pro',
        aiCreditsLeft: 100,
        storeLimit: 10
      });
      console.log('Usuário de demonstração criado com sucesso');
    } else {
      console.log('Usuário de demonstração já existe');
    }
    
    // Criar três lojas diferentes
    const storeNames = ['Moda Brasileira', 'Eletrônicos Prime', 'Casa & Decoração'];
    const regions = ['BR', 'SG', 'MY'];
    
    for (let i = 0; i < storeNames.length; i++) {
      const shopId = `demo_shop_${i+1}_${userId}`;
      
      // Verificar se a loja já existe
      const existingStores = await storage.getStoresByUserId(userId);
      const storeExists = existingStores.some(store => store.shopId === shopId);
      
      if (!storeExists) {
        // Expiração do token em 30 dias
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        // Criar loja
        await storage.createStore({
          userId,
          shopId,
          shopName: storeNames[i],
          shopRegion: regions[i],
          shopLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeNames[i])}&background=random`,
          accessToken: 'demo_token',
          refreshToken: 'demo_refresh_token',
          tokenExpiresAt: expiryDate,
          isActive: true,
          lastSyncAt: new Date(),
          totalProducts: Math.floor(Math.random() * 100) + 20,
          averageCtr: (Math.random() * 4) + 1,
          monthlyRevenue: (Math.random() * 30000) + 5000,
        });
        
        console.log(`Loja ${storeNames[i]} criada`);
      } else {
        console.log(`Loja ${storeNames[i]} já existe`);
      }
    }
    
    // Criar algumas notificações
    const notificationTemplates = [
      {
        title: 'Bem-vindo à Demonstração',
        message: 'Esta é uma conta de demonstração para a equipe Shopee. Explore todas as funcionalidades!',
        type: 'info'
      },
      {
        title: 'Otimização de Produto Recomendada',
        message: 'Nossa IA analisou seu produto e tem sugestões para melhorar seu desempenho.',
        type: 'info'
      },
      {
        title: 'Análise de Concorrência Disponível',
        message: 'Uma nova análise de concorrência para seus produtos está disponível.',
        type: 'success'
      }
    ];
    
    // Verificar se já existem notificações
    const existingNotifications = await storage.getNotificationsByUserId(userId);
    
    if (existingNotifications.length === 0) {
      // Criar notificações
      for (const template of notificationTemplates) {
        await storage.createNotification({
          userId,
          title: template.title,
          message: template.message,
          type: template.type,
          isRead: false
        });
      }
      console.log('Notificações de demonstração criadas');
    } else {
      console.log('Notificações de demonstração já existem');
    }
    
    return {
      username,
      password,
      userId
    };
  } catch (error) {
    console.error('Erro ao criar conta de demonstração:', error);
    throw error;
  }
}