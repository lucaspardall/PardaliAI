/**
 * Módulo para criar contas e dados de demonstração para o CIP Shopee
 */
import { storage } from './storage';
import { db } from './db';
import { users, shopeeStores, products, productOptimizations, storeMetrics, notifications, aiRequests } from '@shared/schema';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { eq, inArray } from 'drizzle-orm';

/**
 * Cria uma conta de usuário de demonstração para testes
 */
export async function createDemoAccount(username: string, password: string): Promise<any> {
  try {
    console.log(`Criando conta de demonstração: ${username}`);
    
    // ID único baseado no username
    const userId = `demo_${username}`;
    
    // Verificar se o usuário já existe
    const existingUser = await storage.getUser(userId);
    if (existingUser) {
      console.log('Usuário de demonstração já existe, atualizando...');
      
      // Apenas atualizar dados do usuário existente
      return await db.update(users)
        .set({
          email: `${username}@cipshopee.demo`,
          firstName: 'Demo',
          lastName: 'Shopee',
          plan: 'pro',
          aiCreditsLeft: 100,
          storeLimit: 10,
          updatedAt: new Date()
        })
        .where(db.eq(users.id, userId))
        .returning();
    }
    
    // Criar novo usuário demo
    const newUser = await storage.upsertUser({
      id: userId,
      email: `${username}@cipshopee.demo`,
      firstName: 'Demo',
      lastName: 'Shopee',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Demo+Shopee&background=FF5722&color=fff',
      plan: 'pro',
      aiCreditsLeft: 100,
      storeLimit: 10
    });
    
    console.log('Usuário de demonstração criado com sucesso:', newUser);
    
    // Criar dados de exemplo para este usuário
    await createDemoData(userId);
    
    return newUser;
  } catch (error) {
    console.error('Erro ao criar conta de demonstração:', error);
    throw error;
  }
}

/**
 * Cria dados de demonstração para um usuário
 */
async function createDemoData(userId: string) {
  try {
    console.log(`Criando dados de demonstração para usuário ${userId}...`);
    
    // Primeiro limpar quaisquer dados de demonstração existentes deste usuário
    await cleanUpDemoData(userId);
    
    // Criar 3 lojas diferentes com dados variados
    const storeIds = await createDemoStores(userId);
    
    // Criar produtos para cada loja
    for (const storeId of storeIds) {
      await createDemoProducts(storeId);
    }
    
    // Criar métricas para as lojas
    await createDemoMetrics(storeIds);
    
    // Criar notificações
    await createDemoNotifications(userId);
    
    console.log('Dados de demonstração criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados de demonstração:', error);
    throw error;
  }
}

/**
 * Limpa dados de demonstração existentes de um usuário
 */
async function cleanUpDemoData(userId: string) {
  try {
    // Obter IDs de todas as lojas do usuário
    const stores = await db.select().from(shopeeStores).where(db.eq(shopeeStores.userId, userId));
    const storeIds = stores.map(store => store.id);
    
    // Apagar em cascata começando por métricas
    if (storeIds.length > 0) {
      await db.delete(storeMetrics).where(db.inArray(storeMetrics.storeId, storeIds));
      
      // Para cada loja, apagar produtos e suas otimizações
      for (const storeId of storeIds) {
        const storeProducts = await db.select().from(products).where(db.eq(products.storeId, storeId));
        const productIds = storeProducts.map(p => p.id);
        
        if (productIds.length > 0) {
          await db.delete(productOptimizations).where(db.inArray(productOptimizations.productId, productIds));
          await db.delete(products).where(db.eq(products.storeId, storeId));
        }
      }
      
      // Apagar lojas
      await db.delete(shopeeStores).where(db.eq(shopeeStores.userId, userId));
    }
    
    // Apagar notificações e requisições AI
    await db.delete(notifications).where(db.eq(notifications.userId, userId));
    await db.delete(aiRequests).where(db.eq(aiRequests.userId, userId));
    
    console.log(`Dados de demonstração limpos para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao limpar dados de demonstração:', error);
    throw error;
  }
}

/**
 * Cria lojas de demonstração para um usuário
 */
async function createDemoStores(userId: string): Promise<number[]> {
  const storeIds: number[] = [];
  
  // Exemplos de regiões da Shopee
  const regions = ['BR', 'SG', 'MY'];
  const storeNames = ['Moda Brasileira', 'Eletrônicos Prime', 'Casa & Decoração'];
  
  for (let i = 0; i < storeNames.length; i++) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Expira em 30 dias
    
    const [store] = await db.insert(shopeeStores).values({
      userId,
      shopId: `demo_shop_${i+1}_${userId}`,
      shopName: storeNames[i],
      shopRegion: regions[i],
      shopLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeNames[i])}&background=random`,
      accessToken: 'demo_token',
      refreshToken: 'demo_refresh_token',
      tokenExpiresAt: expiryDate,
      isActive: true,
      lastSyncAt: new Date(),
      totalProducts: faker.number.int({ min: 25, max: 150 }),
      averageCtr: faker.number.float({ min: 0.5, max: 5, precision: 0.1 }),
      monthlyRevenue: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }),
    }).returning();
    
    storeIds.push(store.id);
  }
  
  console.log(`Criadas ${storeIds.length} lojas de demonstração`);
  return storeIds;
}

/**
 * Cria produtos de demonstração para uma loja
 */
async function createDemoProducts(storeId: number) {
  // Lista de categorias de produtos
  const categories = [
    'Roupas Femininas', 'Roupas Masculinas', 'Eletrônicos', 
    'Casa & Decoração', 'Beleza & Saúde', 'Acessórios', 
    'Esportes', 'Bebês & Crianças'
  ];
  
  // Número aleatório de produtos entre 10 e 25
  const productCount = faker.number.int({ min: 10, max: 25 });
  
  for (let i = 0; i < productCount; i++) {
    const category = faker.helpers.arrayElement(categories);
    const name = generateProductName(category);
    const description = generateProductDescription(category, name);
    const price = faker.number.float({ min: 19.99, max: 499.99, precision: 0.01 });
    const stock = faker.number.int({ min: 0, max: 500 });
    const views = faker.number.int({ min: 50, max: 5000 });
    const ctr = faker.number.float({ min: 0.5, max: 8, precision: 0.1 });
    const sales = Math.floor(views * (ctr / 100)); // Vendas baseadas no CTR
    const revenue = sales * price;
    
    // Gerar entre 1 e 5 imagens para o produto
    const imageCount = faker.number.int({ min: 1, max: 5 });
    const images = [];
    for (let j = 0; j < imageCount; j++) {
      // Usar placeholders de imagem baseados na categoria
      images.push(`https://source.unsplash.com/400x400/?${encodeURIComponent(category.toLowerCase())}`);
    }
    
    // Inserir produto
    const [product] = await db.insert(products).values({
      storeId,
      productId: `demo_product_${i+1}_${storeId}`,
      name,
      description,
      price,
      stock,
      images,
      category,
      status: stock > 0 ? 'active' : 'inactive',
      ctr,
      views,
      sales,
      revenue,
      lastSyncAt: new Date()
    }).returning();
    
    // 70% de chance de ter uma otimização
    if (faker.number.int({ min: 1, max: 10 }) <= 7) {
      await createProductOptimization(product.id, name, description);
    }
  }
  
  console.log(`Criados ${productCount} produtos para a loja ${storeId}`);
}

/**
 * Gera um nome de produto baseado na categoria
 */
function generateProductName(category: string): string {
  const adjectives = ['Premium', 'Profissional', 'Elegante', 'Moderno', 'Clássico', 'Versátil', 'Durável', 'Exclusivo'];
  const adj = faker.helpers.arrayElement(adjectives);
  
  switch (category) {
    case 'Roupas Femininas':
      return faker.helpers.arrayElement([
        `${adj} Vestido ${faker.commerce.productMaterial()}`,
        `Blusa ${adj} ${faker.commerce.productMaterial()}`,
        `Calça ${faker.commerce.productMaterial()} ${adj}`,
        `Saia ${adj} ${faker.commerce.productMaterial()}`
      ]);
    case 'Roupas Masculinas':
      return faker.helpers.arrayElement([
        `Camisa ${adj} ${faker.commerce.productMaterial()}`,
        `Calça ${faker.commerce.productMaterial()} ${adj}`,
        `${adj} Bermuda ${faker.commerce.productMaterial()}`,
        `Jaqueta ${faker.commerce.productMaterial()} ${adj}`
      ]);
    case 'Eletrônicos':
      return faker.helpers.arrayElement([
        `${adj} Fone de Ouvido Bluetooth`,
        `Carregador Portátil ${adj}`,
        `Smartwatch ${adj} Multifuncional`,
        `${adj} Caixa de Som Bluetooth`
      ]);
    case 'Casa & Decoração':
      return faker.helpers.arrayElement([
        `Conjunto de ${faker.number.int({ min: 2, max: 6 })} Copos ${adj}`,
        `Vaso Decorativo ${adj}`,
        `Luminária ${adj} LED`,
        `Kit ${adj} para Cozinha`
      ]);
    default:
      return `${adj} ${faker.commerce.productName()}`;
  }
}

/**
 * Gera uma descrição de produto baseada na categoria e nome
 */
function generateProductDescription(category: string, name: string): string {
  const baseDescription = `${name} - ${faker.commerce.productDescription()}`;
  
  // Características específicas de cada categoria
  let specificFeatures = '';
  
  switch (category) {
    case 'Roupas Femininas':
    case 'Roupas Masculinas':
      specificFeatures = [
        `\n\n• Material: ${faker.commerce.productMaterial()}`,
        `\n• Tamanhos disponíveis: ${faker.helpers.arrayElements(['P', 'M', 'G', 'GG'], { min: 2, max: 4 }).join(', ')}`,
        `\n• Cores disponíveis: ${faker.helpers.arrayElements(['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Amarelo'], { min: 2, max: 4 }).join(', ')}`,
        `\n• Estilo: ${faker.helpers.arrayElement(['Casual', 'Formal', 'Esportivo', 'Festa', 'Praia'])}`,
        `\n• Instruções de lavagem: ${faker.helpers.arrayElement(['Lavar à mão', 'Lavar à máquina em água fria', 'Não usar alvejante', 'Secar na sombra'])}`
      ].join('');
      break;
    case 'Eletrônicos':
      specificFeatures = [
        `\n\n• Marca: ${faker.company.name()}`,
        `\n• Modelo: ${faker.string.alphanumeric(8).toUpperCase()}`,
        `\n• Conexão: ${faker.helpers.arrayElement(['Bluetooth 5.0', 'USB-C', 'Sem fio', 'Wi-Fi'])}`,
        `\n• Bateria: ${faker.helpers.arrayElement(['5000mAh', '3000mAh', '10000mAh', 'Recarregável via USB'])}`,
        `\n• Compatibilidade: ${faker.helpers.arrayElement(['Android e iOS', 'Todos os dispositivos', 'Universal'])}`,
        `\n• Garantia: ${faker.number.int({ min: 6, max: 24 })} meses`
      ].join('');
      break;
    case 'Casa & Decoração':
      specificFeatures = [
        `\n\n• Material: ${faker.commerce.productMaterial()}`,
        `\n• Dimensões: ${faker.number.int({ min: 10, max: 50 })}cm x ${faker.number.int({ min: 10, max: 50 })}cm x ${faker.number.int({ min: 5, max: 30 })}cm`,
        `\n• Peso: ${faker.number.float({ min: 0.1, max: 5, precision: 0.1 })}kg`,
        `\n• Cor: ${faker.helpers.arrayElements(['Preto', 'Branco', 'Madeira', 'Marrom', 'Cinza'], { min: 1, max: 3 }).join(', ')}`,
        `\n• Estilo: ${faker.helpers.arrayElement(['Moderno', 'Rústico', 'Industrial', 'Minimalista', 'Retrô'])}`
      ].join('');
      break;
    default:
      specificFeatures = [
        `\n\n• Marca: ${faker.company.name()}`,
        `\n• Modelo: ${faker.string.alphanumeric(6).toUpperCase()}`,
        `\n• Dimensões: ${faker.number.int({ min: 5, max: 30 })} x ${faker.number.int({ min: 5, max: 30 })} x ${faker.number.int({ min: 2, max: 15 })}cm`,
        `\n• Peso: ${faker.number.float({ min: 0.1, max: 2, precision: 0.01 })}kg`
      ].join('');
  }
  
  const endingDescription = [
    `\n\n✅ Envio rápido!`,
    `\n✅ Garantia de qualidade`,
    `\n✅ Pronta entrega`,
    `\n✅ Compra segura`
  ].join('');
  
  return baseDescription + specificFeatures + endingDescription;
}

/**
 * Cria uma otimização de produto de exemplo
 */
async function createProductOptimization(productId: number, originalTitle: string, originalDesc: string) {
  // Status aleatório da otimização
  const status = faker.helpers.arrayElement(['pending', 'applied', 'ignored']);
  
  // Data de aplicação se o status for 'applied'
  const appliedAt = status === 'applied' ? new Date() : null;
  
  // Feedback se foi aplicado
  const feedbackRating = status === 'applied' 
    ? faker.number.int({ min: 3, max: 5 })
    : null;
  
  // Criar otimização aprimorada do título original
  const suggestedTitle = improveTitle(originalTitle);
  
  // Criar otimização da descrição
  const suggestedDesc = improveDescription(originalDesc);
  
  // Gerar palavras-chave baseadas no título
  const originalKeywords = extractKeywords(originalTitle, originalDesc);
  const suggestedKeywords = originalKeywords.concat(generateMoreKeywords(originalTitle, originalDesc));
  
  // Criar justificativa para as otimizações
  const reasoningNotes = generateReasoning(originalTitle, suggestedTitle, originalDesc, suggestedDesc);
  
  await db.insert(productOptimizations).values({
    productId,
    originalTitle,
    originalDesc,
    originalKeywords: originalKeywords.join(', '),
    suggestedTitle,
    suggestedDesc,
    suggestedKeywords: suggestedKeywords.join(', '),
    reasoningNotes,
    status,
    appliedAt,
    feedbackRating,
    aiRequestId: faker.number.int({ min: 1000, max: 9999 })
  });
}

/**
 * Melhora um título de produto para otimização
 */
function improveTitle(title: string): string {
  // Adicionar mais detalhes ou melhorar palavras-chave
  const qualifiers = ['Premium', 'Profissional', 'Original', 'Exclusivo', 'Alta Qualidade', 'Luxo'];
  const benefits = ['Confortável', 'Durável', 'Moderno', 'Versátil', 'Multifuncional'];
  
  // 50% de chance de adicionar um qualificador
  if (faker.datatype.boolean()) {
    const qualifier = faker.helpers.arrayElement(qualifiers);
    if (!title.includes(qualifier)) {
      return `${qualifier} ${title}`;
    }
  }
  
  // 50% de chance de adicionar um benefício
  if (faker.datatype.boolean()) {
    const benefit = faker.helpers.arrayElement(benefits);
    if (!title.includes(benefit)) {
      return `${title} ${benefit}`;
    }
  }
  
  // Se nenhuma das opções anteriores, adicionar detalhes específicos
  const specificDetails = ['com Garantia', '+ Brinde', 'Pronta Entrega', 'Modelo 2025'];
  const detail = faker.helpers.arrayElement(specificDetails);
  
  return `${title} ${detail}`;
}

/**
 * Melhora uma descrição de produto para otimização
 */
function improveDescription(description: string): string {
  // Adicionar seções melhoradas à descrição original
  
  // Adicionar benefícios
  const benefits = [
    '\n\n📌 PRINCIPAIS BENEFÍCIOS:',
    '\n✔️ Qualidade premium garantida',
    '\n✔️ Design exclusivo e moderno',
    '\n✔️ Atendimento ao cliente 24/7',
    '\n✔️ Envio rápido para todo o Brasil'
  ].join('');
  
  // Adicionar garantia
  const warranty = [
    '\n\n🛡️ GARANTIA E SUPORTE:',
    `\nGarantia de ${faker.number.int({ min: 30, max: 90 })} dias contra defeitos de fabricação.`,
    '\nSuporte técnico disponível por e-mail e WhatsApp.'
  ].join('');
  
  // Adicionar perguntas frequentes
  const faqs = [
    '\n\n❓ PERGUNTAS FREQUENTES:',
    `\n1. Qual o prazo de entrega? R: ${faker.number.int({ min: 2, max: 10 })} a ${faker.number.int({ min: 15, max: 30 })} dias úteis, dependendo da sua localização.`,
    '\n2. Posso trocar se não gostar? R: Sim, garantimos a troca em até 7 dias após o recebimento.',
    '\n3. Tem desconto para compras em quantidade? R: Sim, consulte-nos via chat para negociar descontos especiais.'
  ].join('');
  
  return description + benefits + warranty + faqs;
}

/**
 * Extrai palavras-chave de um título e descrição
 */
function extractKeywords(title: string, description: string): string[] {
  // Simula a extração de palavras-chave
  const words = title.split(' ');
  const keywords = words
    .filter(word => word.length > 3)
    .map(word => word.replace(/[^a-zA-ZáàâãéèêíìóòôõúùûçÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÛÇ]/g, ''))
    .filter(word => word.length > 3);
  
  // Garantir pelo menos 3 palavras-chave
  while (keywords.length < 3) {
    const descWords = description.split(' ');
    const randomWord = faker.helpers.arrayElement(descWords);
    if (randomWord.length > 3 && !keywords.includes(randomWord)) {
      keywords.push(randomWord);
    }
  }
  
  return keywords;
}

/**
 * Gera palavras-chave adicionais para otimização
 */
function generateMoreKeywords(title: string, description: string): string[] {
  // Simula a geração de mais palavras-chave relevantes
  const additionalKeywords = [
    'promoção', 'desconto', 'oferta', 'qualidade', 
    'envio rápido', 'frete grátis', 'garantia', 'original',
    'autêntico', 'melhor preço', 'novo', 'lançamento'
  ];
  
  // Selecionar algumas palavras-chave aleatórias
  return faker.helpers.arrayElements(additionalKeywords, { min: 3, max: 6 });
}

/**
 * Gera uma justificativa para as otimizações sugeridas
 */
function generateReasoning(originalTitle: string, suggestedTitle: string, originalDesc: string, suggestedDesc: string): string {
  return [
    '## Análise de Otimização\n',
    '### Título do Produto\n',
    `**Original:** "${originalTitle}"\n`,
    `**Sugestão:** "${suggestedTitle}"\n\n`,
    'O título sugerido adiciona qualificadores importantes e especificações que aumentam a visibilidade nas buscas. Incluímos palavras-chave de alto volume e destacamos características que diferenciam seu produto da concorrência.\n\n',
    '### Descrição do Produto\n',
    'A descrição sugerida foi estruturada para:\n',
    '- Destacar benefícios principais logo no início\n',
    '- Adicionar seções claramente definidas para melhor legibilidade\n',
    '- Incluir perguntas frequentes para reduzir dúvidas e aumentar a taxa de conversão\n',
    '- Enfatizar garantia e suporte, reduzindo objeções à compra\n\n',
    '### Palavras-chave\n',
    'Adicionamos palavras-chave de alto volume de busca que são relevantes para seu nicho. A densidade de palavras-chave foi otimizada para maximizar a visibilidade sem comprometer a legibilidade ou arriscar penalizações dos algoritmos da Shopee.\n\n',
    '### Impacto Esperado\n',
    `- Aumento estimado de ${faker.number.int({ min: 15, max: 40 })}% nas impressões\n`,
    `- Potencial aumento de ${faker.number.int({ min: 10, max: 30 })}% na taxa de conversão\n`,
    `- Melhoria na posição média nas buscas em aproximadamente ${faker.number.int({ min: 3, max: 12 })} posições`
  ].join('');
}

/**
 * Cria métricas de loja de demonstração
 */
async function createDemoMetrics(storeIds: number[]) {
  // Criar métricas para os últimos 30 dias
  const today = new Date();
  const metrics = [];
  
  for (const storeId of storeIds) {
    // Valores base para esta loja
    const baseViews = faker.number.int({ min: 500, max: 5000 });
    const baseSales = faker.number.int({ min: 20, max: 300 });
    const baseRevenue = faker.number.float({ min: 1000, max: 15000, precision: 0.01 });
    const baseCtr = faker.number.float({ min: 1, max: 7, precision: 0.1 });
    const baseProducts = faker.number.int({ min: 20, max: 150 });
    
    // Tendência (crescimento ou queda)
    const trend = faker.helpers.arrayElement([0.95, 0.98, 1.0, 1.02, 1.05, 1.08]);
    
    // Criar métricas para cada dia
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Calcular métricas com variação diária e tendência
      const dayFactor = Math.pow(trend, 30 - i); // Fator de tendência ao longo do tempo
      const randomFactor = faker.number.float({ min: 0.85, max: 1.15 }); // Variação diária aleatória
      
      // Calcular valores com tendência e variação
      const totalViews = Math.floor(baseViews * dayFactor * randomFactor);
      const totalSales = Math.floor(baseSales * dayFactor * randomFactor);
      const totalRevenue = baseRevenue * dayFactor * randomFactor;
      const averageCtr = baseCtr * dayFactor * randomFactor;
      
      // Produto conta com pequena tendência de crescimento
      const productCount = Math.floor(baseProducts * (i === 30 ? 1 : Math.pow(1.01, 30 - i)));
      
      metrics.push({
        storeId,
        date,
        totalViews,
        totalSales,
        totalRevenue,
        averageCtr,
        productCount
      });
    }
  }
  
  // Inserir todas as métricas
  await db.insert(storeMetrics).values(metrics);
  console.log(`Criadas ${metrics.length} métricas para ${storeIds.length} lojas`);
}

/**
 * Cria notificações de demonstração para um usuário
 */
async function createDemoNotifications(userId: string) {
  const notificationTypes = ['info', 'success', 'warning', 'error'];
  const notificationCount = faker.number.int({ min: 5, max: 15 });
  
  const notificationTemplates = [
    {
      title: 'Otimização de Produto Recomendada',
      message: 'Nossa IA analisou seu produto e tem sugestões para melhorar seu desempenho.',
      type: 'info',
      actionUrl: '/dashboard/products/optimize'
    },
    {
      title: 'Queda nas Vendas Detectada',
      message: 'Detectamos uma queda de vendas na última semana. Recomendamos revisar suas estratégias.',
      type: 'warning',
      actionUrl: '/dashboard/analytics'
    },
    {
      title: 'Otimização Aplicada com Sucesso',
      message: 'As otimizações sugeridas foram aplicadas com sucesso ao seu produto.',
      type: 'success',
      actionUrl: '/dashboard/products'
    },
    {
      title: 'Novos Créditos de IA Adicionados',
      message: 'Você recebeu 10 novos créditos de IA para usar em otimizações de produtos.',
      type: 'success',
      actionUrl: '/dashboard/account'
    },
    {
      title: 'Erros na Sincronização da Loja',
      message: 'Encontramos alguns erros ao sincronizar sua loja. Verifique as configurações de conexão.',
      type: 'error',
      actionUrl: '/dashboard/stores'
    },
    {
      title: 'Novo Recurso Disponível',
      message: 'Lançamos um novo recurso de análise de concorrência. Experimente agora!',
      type: 'info',
      actionUrl: '/dashboard/analytics/competition'
    },
    {
      title: 'Pico de Tráfego Detectado',
      message: 'Sua loja recebeu um pico de tráfego nas últimas 24 horas. Verifique a origem.',
      type: 'info',
      actionUrl: '/dashboard/analytics/traffic'
    },
    {
      title: 'Token de Acesso Expirando',
      message: 'Seu token de acesso da API Shopee expirará em breve. Renove a autorização para continuar.',
      type: 'warning',
      actionUrl: '/dashboard/stores/connect'
    }
  ];
  
  const notifications = [];
  
  // Criar algumas notificações lidas e não lidas
  for (let i = 0; i < notificationCount; i++) {
    const template = faker.helpers.arrayElement(notificationTemplates);
    const isRead = i < 3 ? false : faker.datatype.boolean(); // Garantir algumas notificações não lidas
    
    // Criar data aleatória nos últimos 14 dias
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - faker.number.int({ min: 0, max: 14 }));
    createdAt.setHours(faker.number.int({ min: 0, max: 23 }), faker.number.int({ min: 0, max: 59 }));
    
    notifications.push({
      userId,
      title: template.title,
      message: template.message,
      type: template.type,
      isRead,
      actionUrl: template.actionUrl,
      createdAt
    });
  }
  
  await db.insert(notifications).values(notifications);
  console.log(`Criadas ${notifications.length} notificações para o usuário ${userId}`);
}

/**
 * Função principal que executa a criação da conta de demonstração
 * utilizando configurações específicas para o teste da Shopee
 */
export async function createShopeeTestAccount() {
  try {
    console.log('Criando conta de teste para a Shopee...');
    
    // Usar valores específicos conforme solicitado
    const username = 'testeshopee';
    const password = 'ShopeeTest2025!';
    
    const user = await createDemoAccount(username, password);
    
    console.log('Conta de teste para a Shopee criada com sucesso:', user);
    return {
      username,
      password,
      userId: user.id
    };
  } catch (error) {
    console.error('Erro ao criar conta de teste para a Shopee:', error);
    throw error;
  }
}