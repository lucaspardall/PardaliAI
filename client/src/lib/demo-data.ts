import { faker } from '@faker-js/faker/locale/pt_BR';

export interface DemoUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  plan: string;
  planStatus: string;
  planExpiresAt: Date;
  aiCreditsLeft: number;
  storeLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoStore {
  id: number;
  userId: string;
  shopId: string;
  shopName: string;
  shopLogo: string;
  shopRegion: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  lastSyncAt: Date;
  totalProducts: number;
  totalSales: number;
  monthlyRevenue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoProduct {
  id: number;
  name: string;
  storeId: number;
  productId: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  imageUrl: string;
  status: string;
  lastSyncAt: Date;
  views: number;
  sales: number;
  revenue: number;
  optimized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoOptimization {
  id: number;
  productId: number;
  originalTitle: string;
  originalDesc: string;
  originalKeywords: string;
  suggestedTitle: string;
  suggestedDesc: string;
  suggestedKeywords: string;
  aiReasoning: string;
  percentageImprovement: number;
  status: string;
  applied: boolean;
  createdAt: Date;
}

export interface DemoNotification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: Date;
}

export interface DemoData {
  user: DemoUser;
  stores: DemoStore[];
  products: DemoProduct[];
  optimizations: DemoOptimization[];
  notifications: DemoNotification[];
}

// Funções auxiliares para gerar dados consistentes
const generateUserId = () => '927070657';
const generateStoreId = (index: number) => index + 1;
const generateProductId = (index: number) => index + 1;

export function generateDemoData(): DemoData {
  // Gerar usuário da demonstração
  const user: DemoUser = {
    id: generateUserId(),
    email: 'xavier@saraiva.com.br',
    firstName: 'Xavier',
    lastName: 'Franco e Xavier',
    profileImageUrl: 'https://i.pravatar.cc/150?img=58',
    plan: 'Pro',
    planStatus: 'active',
    planExpiresAt: faker.date.future(),
    aiCreditsLeft: 47,
    storeLimit: 5,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };

  // Gerar lojas de demonstração
  const storeCount = 3;
  const stores: DemoStore[] = Array.from({ length: storeCount }, (_, i) => {
    const shopName = faker.company.name();
    return {
      id: generateStoreId(i),
      userId: user.id,
      shopId: faker.string.uuid(),
      shopName: i === 0 ? 'Xavier, Franco e Xavier' : i === 1 ? 'Saraiva e Associados' : 'Batista Comércio',
      shopLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=random`,
      shopRegion: 'BR',
      accessToken: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(64),
      tokenExpiresAt: faker.date.future(),
      lastSyncAt: faker.date.recent(),
      totalProducts: faker.number.int({ min: 30, max: 200 }),
      totalSales: faker.number.int({ min: 50, max: 500 }),
      monthlyRevenue: faker.number.float({ min: 1000, max: 15000, precision: 0.01 }),
      isActive: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    };
  });

  // Categorias de produto disponíveis
  const categories = ['Eletrônicos', 'Moda', 'Casa', 'Beleza', 'Esportes', 'Infantil', 'Acessórios'];
  
  // Status de produto disponíveis
  const statuses = ['active', 'out_of_stock', 'inactive'];
  
  // Gerar produtos de demonstração
  const productCount = 120;
  const products: DemoProduct[] = Array.from({ length: productCount }, (_, i) => {
    const price = faker.number.float({ min: 19.99, max: 999.99, precision: 0.01 });
    const sales = faker.number.int({ min: 0, max: 100 });
    const storeId = generateStoreId(faker.number.int({ min: 0, max: storeCount - 1 }));
    const category = faker.helpers.arrayElement(categories);
    const productName = generateProductName(category);
    
    return {
      id: generateProductId(i),
      name: productName,
      storeId,
      productId: faker.string.uuid(),
      price,
      stock: faker.number.int({ min: 0, max: 100 }),
      category,
      description: generateProductDescription(productName, category),
      imageUrl: `https://picsum.photos/seed/${i}/400/400`,
      status: faker.helpers.arrayElement(statuses),
      lastSyncAt: faker.date.recent(),
      views: faker.number.int({ min: sales, max: sales * 10 }),
      sales,
      revenue: price * sales,
      optimized: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    };
  });

  // Gerar otimizações de demonstração para alguns produtos
  const optimizedProductIds = products
    .filter(p => p.optimized)
    .map(p => p.id);
  
  const optimizations: DemoOptimization[] = optimizedProductIds.map((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      productId,
      originalTitle: product.name,
      originalDesc: product.description,
      originalKeywords: generateKeywords(product.category, false),
      suggestedTitle: improveTitle(product.name),
      suggestedDesc: improveDescription(product.description),
      suggestedKeywords: generateKeywords(product.category, true),
      aiReasoning: generateReasoning(product.category),
      percentageImprovement: faker.number.float({ min: 15, max: 45, precision: 0.1 }),
      status: 'completed',
      applied: faker.datatype.boolean(),
      createdAt: faker.date.recent()
    };
  }).filter(Boolean) as DemoOptimization[];

  // Gerar notificações de demonstração
  const notifications: DemoNotification[] = [
    {
      id: 1,
      userId: user.id,
      title: 'Bem-vindo ao CIP Shopee',
      message: 'Obrigado por se juntar a nós! Comece conectando sua loja Shopee.',
      type: 'welcome',
      isRead: true,
      actionUrl: '/demo/dashboard',
      createdAt: new Date(Date.now() - 86400000 * 7) // 7 dias atrás
    },
    {
      id: 2,
      userId: user.id,
      title: 'Otimização concluída',
      message: 'Otimização do produto "Smartphone Galaxy Ultra" concluída com sucesso.',
      type: 'optimization',
      isRead: true,
      actionUrl: `/demo/optimize/${products[5].id}`,
      createdAt: new Date(Date.now() - 86400000 * 2) // 2 dias atrás
    },
    {
      id: 3,
      userId: user.id,
      title: 'Novo produto sincronizado',
      message: 'Um novo produto foi sincronizado da sua loja Shopee.',
      type: 'sync',
      isRead: false,
      actionUrl: `/demo/products`,
      createdAt: new Date(Date.now() - 86400000) // 1 dia atrás
    },
    {
      id: 4,
      userId: user.id,
      title: 'Aumento nas vendas detectado',
      message: 'Seus produtos otimizados estão gerando 23% mais vendas esta semana.',
      type: 'analytics',
      isRead: false,
      actionUrl: '/demo/dashboard',
      createdAt: new Date(Date.now() - 3600000 * 5) // 5 horas atrás
    }
  ];

  return {
    user,
    stores,
    products,
    optimizations,
    notifications
  };
}

// Funções para gerar conteúdo mais realista
function generateProductName(category: string): string {
  const prefixes = ['Premium', 'Novo', 'Kit', 'Conjunto', 'Super', 'Deluxe'];
  const suffix = faker.datatype.boolean() ? ' ' + faker.commerce.productAdjective() : '';
  
  let name = '';
  
  switch (category) {
    case 'Eletrônicos':
      const deviceTypes = ['Smartphone', 'Fone de Ouvido', 'Carregador', 'Smartwatch', 'Caixa de Som Bluetooth', 'Mouse Gamer'];
      const brands = ['Samsung', 'Xiaomi', 'JBL', 'Baseus', 'Huawei', 'Multilaser'];
      name = `${faker.helpers.arrayElement(brands)} ${faker.helpers.arrayElement(deviceTypes)} ${faker.string.alphanumeric(3).toUpperCase()}`;
      break;
    case 'Moda':
      const clothingTypes = ['Camiseta', 'Calça', 'Vestido', 'Jaqueta', 'Blusa', 'Bermuda'];
      name = `${faker.helpers.arrayElement(clothingTypes)} ${faker.commerce.productMaterial()} ${faker.color.human()}`;
      break;
    case 'Casa':
      const homeItems = ['Luminária', 'Tapete', 'Conjunto Potes', 'Organizador', 'Almofada', 'Cortina'];
      name = `${faker.helpers.arrayElement(homeItems)} ${faker.commerce.productAdjective()} ${faker.color.human()}`;
      break;
    case 'Beleza':
      const beautyItems = ['Batom', 'Base', 'Hidratante', 'Perfume', 'Máscara Facial', 'Esmalte'];
      const beautyBrands = ['Natura', 'O Boticário', 'Avon', 'Ruby Rose', 'Vult', 'Eudora'];
      name = `${faker.helpers.arrayElement(beautyBrands)} ${faker.helpers.arrayElement(beautyItems)} ${faker.color.human()}`;
      break;
    case 'Esportes':
      const sportsItems = ['Tênis', 'Camiseta Esportiva', 'Shorts', 'Bola', 'Mochila', 'Garrafa'];
      const sportsBrands = ['Adidas', 'Nike', 'Puma', 'Olympikus', 'Kappa', 'Umbro'];
      name = `${faker.helpers.arrayElement(sportsBrands)} ${faker.helpers.arrayElement(sportsItems)} ${faker.string.alphanumeric(2).toUpperCase()}`;
      break;
    default:
      name = `${faker.commerce.productName()} ${faker.color.human()}`;
  }
  
  // Adicionar prefixo ou sufixo aleatoriamente
  if (faker.datatype.boolean() && faker.datatype.boolean()) {
    name = `${faker.helpers.arrayElement(prefixes)} ${name}`;
  }
  
  return name + suffix;
}

function generateProductDescription(name: string, category: string): string {
  const benefits = [
    'Ótima qualidade',
    'Material durável',
    'Confortável',
    'Fácil de usar',
    'Design moderno',
    'Produto importado',
    'Melhor custo-benefício',
    'Entrega rápida',
    'A pronta entrega',
    'Garantia de 3 meses'
  ];
  
  const categorySpecificFeatures: Record<string, string[]> = {
    'Eletrônicos': [
      'Bateria de longa duração',
      'Compatível com Android e iOS',
      'Bluetooth 5.0',
      'Resistente à água',
      'Carregamento rápido'
    ],
    'Moda': [
      'Tecido macio e confortável',
      'Todos os tamanhos disponíveis',
      'Lavagem à máquina',
      'Não desbota',
      'Estilo casual e elegante'
    ],
    'Casa': [
      'Fácil de limpar',
      'Material anti-alérgico',
      'Ideal para decoração',
      'Resistente e durável',
      'Combina com qualquer ambiente'
    ],
    'Beleza': [
      'Dermatologicamente testado',
      'Não testado em animais',
      'Contém ingredientes naturais',
      'Hipoalergênico',
      'Longa duração'
    ],
    'Esportes': [
      'Material respirável',
      'Tecnologia anti-suor',
      'Secagem rápida',
      'Leve e resistente',
      'Ideal para práticas esportivas'
    ]
  };
  
  const features = categorySpecificFeatures[category] || benefits;
  const selectedFeatures = faker.helpers.arrayElements(features, faker.number.int({ min: 2, max: 4 }));
  const selectedBenefits = faker.helpers.arrayElements(benefits, faker.number.int({ min: 3, max: 5 }));
  
  const intro = `${name} - ${faker.commerce.productAdjective()} e ${faker.commerce.productAdjective()}.`;
  const featuresList = selectedFeatures.map(f => `- ${f}`).join('\n');
  const benefitsList = selectedBenefits.map(b => `- ${b}`).join('\n');
  
  return `${intro}\n\n📱 CARACTERÍSTICAS:\n${featuresList}\n\n✅ BENEFÍCIOS:\n${benefitsList}\n\nGarantia de ${faker.number.int({ min: 1, max: 12 })} meses. Enviamos para todo o Brasil! Compre agora!`;
}

function generateKeywords(category: string, improved: boolean): string {
  const commonKeywords = ['shopee', 'brasil', 'oferta', 'promoção', 'qualidade', 'barato', 'envio rápido'];
  
  const categoryKeywords: Record<string, string[]> = {
    'Eletrônicos': ['celular', 'smartphone', 'fone', 'bluetooth', 'carregador', 'tech', 'tecnologia', 'gadget'],
    'Moda': ['roupa', 'vestido', 'camiseta', 'calça', 'jeans', 'fashion', 'estilo', 'tendência'],
    'Casa': ['decoração', 'cozinha', 'quarto', 'sala', 'banheiro', 'organização', 'utensílios'],
    'Beleza': ['maquiagem', 'skincare', 'beleza', 'cosméticos', 'cuidados', 'hidratante', 'perfume'],
    'Esportes': ['esporte', 'fitness', 'treino', 'academia', 'corrida', 'exercício', 'saúde']
  };
  
  const baseKeywords = [...(categoryKeywords[category] || []), ...faker.helpers.arrayElements(commonKeywords, 3)];
  
  if (improved) {
    const improvedKeywords = [
      'melhor preço', 'frete grátis', 'original', 'garantia', 'desconto', 'novo', 'lançamento',
      'entrega expressa', 'premium', 'exclusivo', 'limitado', 'promoção imperdível'
    ];
    
    return [...baseKeywords, ...faker.helpers.arrayElements(improvedKeywords, 4)].join(', ');
  }
  
  return baseKeywords.join(', ');
}

function improveTitle(originalTitle: string): string {
  const suffixes = [
    '- Envio Imediato',
    '- Frete Grátis',
    '- Original',
    '- Premium',
    '- Garantia 1 Ano',
    '- Promoção'
  ];
  
  const prefix = faker.datatype.boolean() ? 'NOVO: ' : '';
  const suffix = faker.helpers.arrayElement(suffixes);
  
  // Manter o título original mas adicionar prefixo/sufixo para melhorar
  return `${prefix}${originalTitle} ${suffix}`;
}

function improveDescription(originalDescription: string): string {
  const persuasiveIntro = faker.helpers.arrayElement([
    '🔥 SUPER OFERTA! Aproveite enquanto durar o estoque! 🔥\n\n',
    '⚡ PROMOÇÃO RELÂMPAGO! Compre agora e economize! ⚡\n\n',
    '✨ PRODUTO PREMIUM DE ALTA QUALIDADE! ✨\n\n',
    '🌟 PRODUTO EXCLUSIVO COM GARANTIA DE SATISFAÇÃO! 🌟\n\n'
  ]);
  
  const benefitsToAdd = [
    '✅ Envio no mesmo dia para compras até 14h',
    '✅ Frete Grátis para todo Brasil',
    '✅ Garantia de 30 dias direto da loja',
    '✅ Produto Original com Nota Fiscal',
    '✅ Atendimento personalizado via WhatsApp',
    '✅ Desconto para compras em quantidade'
  ];
  
  const selectedBenefits = faker.helpers.arrayElements(benefitsToAdd, 3).join('\n');
  
  const callToAction = '\n\n🛒 COMPRE AGORA COM TOTAL SEGURANÇA! Estoque limitado!';
  
  // Preservar o conteúdo original mas melhorar com elementos persuasivos
  return persuasiveIntro + originalDescription + '\n\n' + selectedBenefits + callToAction;
}

function generateReasoning(category: string): string {
  const reasoningTemplates = [
    `Analisamos seu produto da categoria ${category} e identificamos oportunidades para aumentar sua conversão. O título foi otimizado com palavras-chave mais relevantes e elementos que chamam atenção como "Frete Grátis" e "Original". A descrição foi estruturada para destacar os benefícios mais importantes e incluir elementos persuasivos como emojis e marcadores, facilitando a leitura e compreensão. Adicionamos sinais de urgência e escassez para estimular a decisão de compra.`,
    
    `Nosso algoritmo de IA analisou produtos semelhantes na categoria ${category} com alta taxa de conversão e aplicou as melhores práticas ao seu produto. Adicionamos palavras-chave estratégicas no título que aumentam a visibilidade nas buscas da Shopee e elementos de confiança como "Garantia" e "Original". A descrição foi aprimorada com uma estrutura mais clara, uso de emojis para destacar pontos importantes e uma chamada para ação que incentiva a compra imediata.`,
    
    `Com base em dados de milhares de produtos de sucesso na categoria ${category}, otimizamos seu anúncio para maximizar o desempenho. O título agora contém termos que aumentam o clique como "Promoção" e "Premium". A descrição foi reorganizada para priorizar os benefícios mais valorizados pelos compradores, com destaque para elementos como frete grátis e garantia. Adicionamos gatilhos psicológicos de escassez e urgência para aumentar a conversão.`
  ];
  
  return faker.helpers.arrayElement(reasoningTemplates);
}