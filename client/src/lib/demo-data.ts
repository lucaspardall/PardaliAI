import { faker } from '@faker-js/faker/locale/pt_BR';

export function generateDemoData() {
  // Dados do usuário
  const user = {
    id: '99999999',
    firstName: 'Teste',
    lastName: 'Shopee',
    email: 'teste@shopee.demo',
    profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=TS&backgroundColor=FF5722`,
    plan: 'pro',
    planStatus: 'active',
    aiCreditsLeft: 100,
    storeLimit: 10
  };

  // Loja virtual
  const stores = Array(3).fill(null).map((_, index) => ({
    id: index + 1,
    shopName: faker.company.name(),
    shopRegion: 'BR',
    totalProducts: faker.number.int({ min: 35, max: 120 }),
    lastSyncAt: faker.date.recent(),
    isActive: true,
    monthlyRevenue: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
    monthlySales: faker.number.int({ min: 20, max: 200 }),
    totalViews: faker.number.int({ min: 500, max: 5000 }),
    averageCtr: faker.number.float({ min: 1.5, max: 4.5, fractionDigits: 2 }),
  }));

  // Notificações
  const notifications = Array(8).fill(null).map((_, index) => ({
    id: index + 1,
    userId: user.id,
    title: faker.helpers.arrayElement([
      'Produto otimizado com sucesso',
      'Sincronização concluída',
      'Limite de créditos próximo',
      'Nova versão disponível',
      'Promoção exclusiva'
    ]),
    message: faker.helpers.arrayElement([
      'Seu produto foi otimizado com sucesso e está pronto para aumentar as vendas.',
      'Sincronização de produtos da loja concluída com sucesso.',
      'Você está próximo do limite de créditos AI. Considere fazer upgrade.',
      'Nova versão do CIP Shopee disponível com recursos exclusivos.',
      'Promoção exclusiva: ganhe 50% de desconto no plano anual.'
    ]),
    type: faker.helpers.arrayElement(['info', 'success', 'warning']),
    isRead: faker.datatype.boolean(),
    actionUrl: faker.helpers.arrayElement(['/dashboard', '/dashboard/products', '/dashboard/subscription']),
    createdAt: faker.date.recent()
  }));

  // Produtos
  const generateProducts = (storeId: number) => {
    return Array(15).fill(null).map((_, index) => ({
      id: index + 1,
      name: faker.commerce.productName(),
      storeId: storeId,
      productId: faker.string.alphanumeric(10),
      category: faker.commerce.department(),
      price: faker.number.float({ min: 19.9, max: 299.9, fractionDigits: 2 }),
      stock: faker.number.int({ min: 0, max: 100 }),
      sales: faker.number.int({ min: 0, max: 50 }),
      revenue: faker.number.float({ min: 0, max: 2000, fractionDigits: 2 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      lastSyncAt: faker.date.recent(),
      imageUrl: faker.image.urlLoremFlickr({ category: 'product' }),
      status: faker.helpers.arrayElement(['active', 'inactive', 'out_of_stock']),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      views: faker.number.int({ min: 10, max: 1000 }),
      conversionRate: faker.number.float({ min: 0.5, max: 8, fractionDigits: 1 }),
      optimized: faker.datatype.boolean(),
      description: faker.commerce.productDescription()
    }));
  };

  // Gerar produtos para todas as lojas
  const products = stores.flatMap(store => generateProducts(store.id));

  // Otimizações
  const optimizations = products
    .filter(product => product.optimized)
    .map(product => ({
      id: faker.number.int({ min: 1, max: 1000 }),
      productId: product.id,
      createdAt: faker.date.recent(),
      status: 'completed',
      originalTitle: product.name,
      originalDesc: product.description,
      originalKeywords: faker.helpers.arrayElements(['produto', 'shopee', 'venda', 'brasil', 'qualidade'], faker.number.int({ min: 3, max: 5 })).join(', '),
      suggestedTitle: `${product.name} - Premium ${faker.commerce.productAdjective()} | Entrega Rápida`,
      suggestedDesc: `${product.description}\n\n✅ Produto de alta qualidade\n✅ Entrega em todo Brasil\n✅ Garantia de ${faker.number.int({ min: 30, max: 90 })} dias\n\nCompre agora e receba ${faker.helpers.arrayElement(['frete grátis', 'desconto exclusivo', 'brinde especial'])}!`,
      suggestedKeywords: faker.helpers.arrayElements(['premium', 'qualidade', 'frete grátis', 'garantia', 'oferta', 'promoção', 'melhor preço', 'entrega rápida'], faker.number.int({ min: 5, max: 8 })).join(', '),
      aiReasoning: `Este produto teve sua descrição melhorada com palavras-chave estratégicas que aumentam a visibilidade nas buscas. Adicionamos elementos persuasivos como entrega rápida, garantia e destaque para a qualidade do produto. Estruturamos o texto com marcadores para facilitar a leitura.`,
      percentageImprovement: faker.number.float({ min: 15, max: 45, fractionDigits: 1 }),
      applied: faker.datatype.boolean()
    }));

  return {
    user,
    stores,
    notifications,
    products,
    optimizations
  };
}