/**
 * Dados fictícios para o modo de demonstração
 */

// Lojas demo
export const demoStores = [
  {
    id: 101,
    userId: 'demo-user-123',
    shopId: 'demo-shop-1',
    shopName: 'Eletrônicos Brasil',
    shopLogo: 'https://ui-avatars.com/api/?name=Eletrônicos+Brasil&background=0D8ABC&color=fff',
    shopRegion: 'BR',
    accessToken: 'demo-token-1',
    refreshToken: 'demo-refresh-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isActive: true,
    totalProducts: 187,
    totalOrders: 1452,
    monthlyRevenue: 45780.92,
  },
  {
    id: 102,
    userId: 'demo-user-123',
    shopId: 'demo-shop-2',
    shopName: 'Moda Exclusiva',
    shopLogo: 'https://ui-avatars.com/api/?name=Moda+Exclusiva&background=D81B60&color=fff',
    shopRegion: 'BR',
    accessToken: 'demo-token-2',
    refreshToken: 'demo-refresh-2',
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isActive: true,
    totalProducts: 312,
    totalOrders: 874,
    monthlyRevenue: 28450.35,
  }
];

// Produtos fictícios
export const demoProducts = [
  // Produtos da loja 1 - Eletrônicos Brasil
  {
    id: 1001,
    storeId: 101,
    name: 'Smartphone XZ Pro 128GB',
    productId: 'SP12345BR',
    price: 1899.90,
    stock: 45,
    category: 'Smartphones',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Smartphone+XZ',
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: 'Smartphone com 128GB de armazenamento, tela AMOLED de 6.4", câmera tripla de 64MP + 12MP + 8MP, bateria de 5000mAh',
    views: 4562,
    likes: 378,
    sales: 124,
    ctr: 3.2,
    conversionRate: 2.7,
    revenue: 235587.60
  },
  {
    id: 1002,
    storeId: 101,
    name: 'Fone de Ouvido Bluetooth TWS',
    productId: 'FB7890BR',
    price: 199.90,
    stock: 130,
    category: 'Acessórios',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Fone+Bluetooth',
    status: 'active',
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: 'Fone de ouvido sem fio com cancelamento de ruído, resistente à água IPX7, bateria de longa duração de até 24 horas',
    views: 3874,
    likes: 289,
    sales: 211,
    ctr: 4.1,
    conversionRate: 5.4,
    revenue: 42179.90
  },
  {
    id: 1003,
    storeId: 101,
    name: 'Smartwatch Fit Band Pro',
    productId: 'SW4567BR',
    price: 349.90,
    stock: 68,
    category: 'Smartwatches',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Smartwatch',
    status: 'active',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: 'Smartwatch com monitoramento de saúde, batimentos cardíacos, oxigênio no sangue, passos, calorias, à prova d\'água.',
    views: 2142,
    likes: 167,
    sales: 78,
    ctr: 3.8,
    conversionRate: 3.6,
    revenue: 27292.20
  },
  // Produtos da loja 2 - Moda Exclusiva
  {
    id: 2001,
    storeId: 102,
    name: 'Vestido Floral Primavera',
    productId: 'VS123FR',
    price: 129.90,
    stock: 95,
    category: 'Vestidos',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Vestido+Floral',
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    description: 'Vestido floral com corte evasê, perfeito para a primavera. Material leve e confortável, disponível nos tamanhos P, M, G.',
    views: 5670,
    likes: 435,
    sales: 187,
    ctr: 5.4,
    conversionRate: 3.3,
    revenue: 24291.30
  },
  {
    id: 2002,
    storeId: 102,
    name: 'Calça Jeans Skinny Premium',
    productId: 'CJ456SK',
    price: 159.90,
    stock: 78,
    category: 'Calças',
    imageUrl: 'https://via.placeholder.com/300x300.png?text=Calça+Jeans',
    status: 'active',
    createdAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    description: 'Calça jeans skinny premium com cintura alta, stretch confortável, acabamento premium e lavagem especial.',
    views: 4238,
    likes: 312,
    sales: 145,
    ctr: 4.8,
    conversionRate: 3.4,
    revenue: 23185.50
  }
];

// Otimizações fictícias de produtos
export const demoOptimizations = [
  {
    id: 10001,
    productId: 1001,
    status: 'completed',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    originalTitle: 'Smartphone XZ Pro 128GB',
    originalDesc: 'Smartphone com 128GB de armazenamento, tela AMOLED de 6.4", câmera tripla de 64MP + 12MP + 8MP, bateria de 5000mAh',
    originalKeywords: 'smartphone, celular, xz pro, 128gb',
    suggestedTitle: 'Smartphone XZ Pro 128GB 6.4" - Câmera Tripla 64MP - Bateria 5000mAh',
    suggestedDesc: 'O Smartphone XZ Pro oferece desempenho excepcional com seus 128GB de armazenamento e processador octa-core. Capture momentos inesquecíveis com a câmera tripla de 64MP+12MP+8MP e desfrute de imagens vibrantes na tela AMOLED de 6.4". A bateria de 5000mAh garante autonomia para o dia todo, mesmo com uso intenso. Disponível nas cores preto, azul e dourado.',
    suggestedKeywords: 'smartphone xz pro, celular 128gb, câmera tripla 64mp, tela amoled 6.4 polegadas, bateria 5000mah, smartphone potente, melhor smartphone custo benefício',
    reasoning: 'O título original não destacava os principais diferenciais do produto. Adicionei as informações de tamanho da tela, resolução da câmera e capacidade da bateria, que são fatores decisivos na compra de smartphones. Na descrição, incluí mais detalhes sobre o processador, destaquei benefícios das câmeras e da bateria, e mencionei as cores disponíveis. As palavras-chave foram expandidas para incluir termos de busca mais específicos que os consumidores utilizam.',
    aiRequestId: 5001
  },
  {
    id: 10002,
    productId: 2001,
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    originalTitle: 'Vestido Floral Primavera',
    originalDesc: 'Vestido floral com corte evasê, perfeito para a primavera. Material leve e confortável, disponível nos tamanhos P, M, G.',
    originalKeywords: 'vestido, floral, primavera, feminino',
    suggestedTitle: 'Vestido Floral Evasê Primavera-Verão 2025 - Leve e Confortável',
    suggestedDesc: 'Realce sua feminilidade com nosso Vestido Floral Primavera-Verão 2025! Confeccionado em tecido leve e respirável, possui corte evasê que valoriza todos os tipos de corpo. O padrão floral exclusivo em tons vibrantes traz alegria e elegância para qualquer ocasião. Perfeito para eventos diurnos, passeios ou encontros casuais. Disponível nos tamanhos P, M e G. Combine com sandálias ou tênis para diferentes looks!',
    suggestedKeywords: 'vestido floral feminino, vestido evasê primavera, vestido leve verão 2025, vestido floral festa, vestido casual elegante, vestido florido midi, vestido estampado confortável',
    reasoning: 'O título original era muito genérico e não informava o estilo do vestido nem destacava a temporada da moda. Na versão otimizada, incluí o tipo de corte (evasê) e especifiquei a coleção (Primavera-Verão 2025). Na descrição, adicionei elementos emocionais ("realce sua feminilidade"), benefícios do tecido e do corte, sugestões de uso e combinações. As palavras-chave foram expandidas para capturar diferentes intenções de busca, incluindo termos como "casual elegante" e "vestido florido midi" que são populares nas pesquisas.',
    aiRequestId: 5002
  }
];

// Estatísticas diárias de lojas
export const demoStoreStats = [
  // Estatísticas da loja 1
  {
    id: 501,
    storeId: 101,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    averageCtr: 2.8,
    totalViews: 3421,
    totalSales: 78,
    totalRevenue: 12567.32,
    productCount: 182
  },
  {
    id: 502,
    storeId: 101,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    averageCtr: 3.1,
    totalViews: 4012,
    totalSales: 93,
    totalRevenue: 15234.87,
    productCount: 184
  },
  {
    id: 503,
    storeId: 101,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    averageCtr: 3.3,
    totalViews: 4235,
    totalSales: 102,
    totalRevenue: 17856.45,
    productCount: 185
  },
  {
    id: 504,
    storeId: 101,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    averageCtr: 3.0,
    totalViews: 3987,
    totalSales: 89,
    totalRevenue: 14532.90,
    productCount: 187
  },
  {
    id: 505,
    storeId: 101,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    averageCtr: 3.5,
    totalViews: 4587,
    totalSales: 118,
    totalRevenue: 21345.67,
    productCount: 187
  },
  {
    id: 506,
    storeId: 101,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    averageCtr: 3.7,
    totalViews: 4823,
    totalSales: 127,
    totalRevenue: 23675.45,
    productCount: 187
  },
  // Estatísticas da loja 2
  {
    id: 601,
    storeId: 102,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    averageCtr: 3.9,
    totalViews: 2987,
    totalSales: 94,
    totalRevenue: 9876.32,
    productCount: 305
  },
  {
    id: 602,
    storeId: 102,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    averageCtr: 4.1,
    totalViews: 3154,
    totalSales: 102,
    totalRevenue: 10432.89,
    productCount: 307
  },
  {
    id: 603,
    storeId: 102,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    averageCtr: 4.5,
    totalViews: 3542,
    totalSales: 132,
    totalRevenue: 13876.54,
    productCount: 310
  },
  {
    id: 604,
    storeId: 102,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    averageCtr: 4.2,
    totalViews: 3321,
    totalSales: 118,
    totalRevenue: 12543.21,
    productCount: 310
  },
  {
    id: 605,
    storeId: 102,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    averageCtr: 4.7,
    totalViews: 3765,
    totalSales: 149,
    totalRevenue: 15432.65,
    productCount: 312
  },
  {
    id: 606,
    storeId: 102,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    averageCtr: 5.1,
    totalViews: 4123,
    totalSales: 175,
    totalRevenue: 18765.43,
    productCount: 312
  },
];

// Notificações demo
export const demoNotifications = [
  {
    id: 301,
    userId: 'demo-user-123',
    type: 'optimizationComplete',
    title: 'Otimização Concluída',
    message: 'A otimização do produto "Smartphone XZ Pro 128GB" foi concluída com sucesso.',
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    actionUrl: '/demo/products/1001/optimization'
  },
  {
    id: 302,
    userId: 'demo-user-123',
    type: 'optimizationComplete',
    title: 'Otimização Concluída',
    message: 'A otimização do produto "Vestido Floral Primavera" foi concluída com sucesso.',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    actionUrl: '/demo/products/2001/optimization'
  },
  {
    id: 303,
    userId: 'demo-user-123',
    type: 'lowStock',
    title: 'Estoque Baixo',
    message: 'O produto "Calça Jeans Skinny Premium" está com estoque baixo (78 unidades).',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    actionUrl: '/demo/products/2002'
  },
  {
    id: 304,
    userId: 'demo-user-123',
    type: 'salesIncrease',
    title: 'Aumento nas Vendas',
    message: 'Suas vendas aumentaram 32% nos últimos 7 dias! Confira o relatório completo.',
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    actionUrl: '/demo/analytics'
  },
];