import { Router, Request, Response } from 'express';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { storage } from '../storage';
import { users } from '@shared/schema';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Credenciais fixas para demonstração
const DEMO_USER = {
  username: "testeshopee",
  password: "ShopeeTest2025!"
};

// Verifica se a conta de demonstração já existe
router.get('/demo-account-info', async (req: Request, res: Response) => {
  try {
    const demoUser = await storage.getUserByEmail(DEMO_USER.username);
    
    if (demoUser) {
      return res.json({
        exists: true,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: `${demoUser.firstName || ''} ${demoUser.lastName || ''}`.trim(),
          plan: "pro", // Demonstração sempre tem plano pro
          storeCount: await getStoreCount(demoUser.id)
        },
        credentials: DEMO_USER,
        instructions: [
          "Para acessar sua conta de demonstração, clique no botão abaixo.",
          "Este ambiente contém dados fictícios para avaliar o CIP Shopee.",
          "Explore recursos como otimização de produtos, análise de métricas e sugestões da IA."
        ]
      });
    } else {
      return res.json({
        exists: false,
        message: "Conta de demonstração não encontrada. Clique em 'Criar Conta de Demonstração' para criar uma."
      });
    }
  } catch (error) {
    console.error("Erro ao verificar conta de demonstração:", error);
    return res.status(500).json({ exists: false, message: "Erro ao verificar conta de demonstração" });
  }
});

// Criar conta de demonstração
// Rota para acessar diretamente a demo (login automatizado)
router.get('/access-demo', async (req: Request, res: Response) => {
  try {
    console.log("Iniciando acesso à demonstração completa");
    
    // Verifica se a conta demo existe
    let demoUser = await storage.getUserByEmail(DEMO_USER.username);
    
    // Se não existir, cria
    if (!demoUser) {
      console.log("Criando nova conta de demonstração");
      const userId = faker.string.numeric(8);
      demoUser = await storage.upsertUser({
        id: userId,
        email: DEMO_USER.username,
        firstName: "Teste",
        lastName: "Shopee",
        profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=TS&backgroundColor=FF5722`,
        plan: "pro", // Demonstração sempre tem plano pro
        planStatus: "active",
        planExpiresAt: null,
        aiCreditsLeft: 100,
        storeLimit: 10
      });
      
      // Criar dados de demonstração para o novo usuário
      await createDemoDataForUser(demoUser.id);
    } else {
      console.log("Atualizando conta de demonstração existente:", demoUser.id);
      
      // Sempre atualiza para PRO com 100 créditos de IA
      await storage.upsertUser({
        ...demoUser,
        plan: "pro",
        planStatus: "active",
        aiCreditsLeft: 100,
        storeLimit: 10
      });
      
      // Limpa e recria os dados demo para garantir consistência
      await cleanExistingDemoData(demoUser.id);
      await createDemoDataForUser(demoUser.id);
    }
    
    // Configurar sessão de demonstração
    if (req.session) {
      req.session.demoMode = true;
      req.session.demoUserId = demoUser.id;
      await new Promise<void>((resolve) => req.session.save(() => resolve()));
      console.log("Sessão de demonstração configurada com sucesso");
    } else {
      console.error("Erro: req.session não está definido");
    }
    
    // Redirecionar para o dashboard
    console.log("Redirecionando para dashboard de demonstração");
    res.redirect('/dashboard');
  } catch (error) {
    console.error("Erro ao acessar demonstração:", error);
    res.status(500).json({ message: "Erro ao acessar demonstração" });
  }
});

router.post('/create-demo-account', async (req: Request, res: Response) => {
  try {
    // Verificar se já existe
    const existingUser = await storage.getUserByEmail(DEMO_USER.username);
    
    if (existingUser) {
      // Limpar dados existentes da conta de demonstração antes de recriar
      await cleanExistingDemoData(existingUser.id);
      
      // Criar dados de demonstração
      await createDemoDataForUser(existingUser.id);
      
      return res.json({
        success: true,
        demoAccount: DEMO_USER,
        message: "Conta de demonstração atualizada com sucesso!"
      });
    }
    
    // Criar usuário de demonstração
    const userId = faker.string.numeric(8);
    const newUser = await storage.upsertUser({
      id: userId,
      email: DEMO_USER.username,
      firstName: "Teste",
      lastName: "Shopee",
      profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=TS&backgroundColor=FF5722`,
    });
    
    // Criar dados de demonstração para o novo usuário
    await createDemoDataForUser(newUser.id);
    
    return res.json({
      success: true,
      demoAccount: DEMO_USER,
      message: "Conta de demonstração criada com sucesso!"
    });
  } catch (error) {
    console.error("Erro ao criar conta de demonstração:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erro ao criar conta de demonstração. Tente novamente mais tarde." 
    });
  }
});

// Limpar dados existentes para uma conta de demonstração
async function cleanExistingDemoData(userId: string) {
  try {
    // Obter lojas do usuário
    const userStores = await storage.getStoresByUserId(userId);
    
    // Limpar produtos e lojas
    for (const store of userStores) {
      // Obter produtos da loja
      const storeProducts = await storage.getProductsByStoreId(store.id);
      
      // Remover cada produto
      for (const product of storeProducts) {
        await storage.deleteProduct(product.id);
      }
      
      // Remover a loja
      await storage.deleteStore(store.id);
    }
  } catch (error) {
    console.error("Erro ao limpar dados de demonstração:", error);
  }
}

// Criar dados de demonstração para o usuário
async function createDemoDataForUser(userId: string) {
  // Criar loja de demonstração usando o storage ao invés do db diretamente
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
  
  const store = await storage.createStore({
    userId: userId,
    shopId: "123456789",
    shopName: "Minha Loja Shopee",
    shopLogo: "https://api.dicebear.com/7.x/initials/svg?seed=MLS&backgroundColor=FF5722",
    shopRegion: "BR",
    accessToken: faker.string.alphanumeric(40),
    refreshToken: faker.string.alphanumeric(40),
    tokenExpiresAt: expiryDate,
    isActive: true,
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    totalProducts: 15,
    averageCtr: 3.25,
    monthlyRevenue: 3467.50
  });
  
  // Criar produtos de demonstração (diferentes categorias)
  const categories = [
    "Eletrônicos", "Moda", "Casa e Decoração", "Beleza e Cuidados Pessoais", 
    "Esporte e Lazer", "Bebês e Crianças", "Acessórios", "Automotivo"
  ];
  
  for (let i = 0; i < 15; i++) {
    const price = parseFloat(faker.commerce.price({ min: 19, max: 499 }));
    const category = categories[Math.floor(i / 2) % categories.length];
    const name = faker.commerce.productName();
    const isOptimized = i % 3 === 0; // Cada terceiro produto é otimizado
    const productId = faker.string.numeric(10);
    
    // Usar storage ao invés de manipular o banco diretamente
    await storage.createProduct({
      storeId: store.id,
      productId,
      name,
      description: faker.commerce.productDescription(),
      price,
      category,
      stock: faker.number.int({ min: 0, max: 100 }),
      status: i % 7 === 0 ? "inactive" : "active",
      sales: faker.number.int({ min: 0, max: 500 }),
      views: faker.number.int({ min: 100, max: 5000 }),
      ctr: faker.number.float({ min: 0.5, max: 5.0 }),
      revenue: price * faker.number.int({ min: 0, max: 300 }),
      images: [
        `https://source.unsplash.com/300x300/?${encodeURIComponent(category.toLowerCase())}`,
        `https://source.unsplash.com/300x300/?${encodeURIComponent(name.toLowerCase())}`
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date()
    });
  }
  
  // Criar notificações
  const notificationTypes = [
    "product_optimization", 
    "sales_alert", 
    "system_update", 
    "stock_alert",
    "product_performance"
  ];
  
  // Criar algumas notificações de demonstração
  for (let i = 0; i < 8; i++) {
    const type = notificationTypes[i % notificationTypes.length];
    const createdAt = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)); // Uma notificação por dia
    let title, message;
    
    switch (type) {
      case "product_optimization":
        title = "Otimização de Produto Disponível";
        message = `Novas otimizações disponíveis para ${faker.number.int({ min: 1, max: 5 })} produtos`;
        break;
      case "sales_alert":
        title = "Alerta de Vendas";
        message = `Vendas aumentaram ${faker.number.int({ min: 10, max: 50 })}% nas últimas 24 horas`;
        break;
      case "system_update":
        title = "Atualização do Sistema";
        message = "Novos recursos disponíveis no CIP Shopee";
        break;
      case "stock_alert":
        title = "Alerta de Estoque";
        message = `${faker.number.int({ min: 1, max: 3 })} produtos estão com estoque baixo`;
        break;
      case "product_performance":
        title = "Análise de Desempenho";
        message = `Relatório semanal de desempenho disponível`;
        break;
      default:
        title = "Notificação";
        message = "Nova notificação do sistema";
    }
    
    // Usar o storage em vez do DB diretamente
    await storage.createNotification({
      userId,
      title,
      message,
      type,
      isRead: i > 5, // Primeiras notificações não lidas
      actionUrl: `/dashboard/${type.includes('product') ? 'products' : type.includes('sales') ? 'analytics' : 'settings'}`,
      createdAt
    });
  }
}

// Função auxiliar para contar lojas
async function getStoreCount(userId: string): Promise<number> {
  try {
    const storeCount = await storage.getStoresByUserId(userId);
    return storeCount.length;
  } catch (error) {
    console.error("Erro ao contar lojas:", error);
    return 0;
  }
}

export default router;