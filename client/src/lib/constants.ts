// Plan details
export const PLANS = {
  free: {
    name: "Gratuito",
    price: "R$0",
    period: "/mês",
    features: [
      "1 loja conectada",
      "10 otimizações com IA",
      "Dashboard básico",
      "Análise de performance"
    ],
    popular: false,
    ctaText: "Começar Grátis"
  },
  starter: {
    name: "Starter",
    price: "R$39",
    period: "/mês",
    features: [
      "1 loja conectada",
      "100 otimizações com IA/mês",
      "Dashboard avançado",
      "Alertas personalizados",
      "Otimização ativa"
    ],
    popular: true,
    ctaText: "Assinar Agora",
    highlight: "Mais Popular"
  },
  pro: {
    name: "Pro",
    price: "R$97",
    period: "/mês",
    features: [
      "3 lojas conectadas",
      "Otimizações ilimitadas",
      "Dashboard premium",
      "Relatórios avançados",
      "Prioridade no suporte"
    ],
    popular: false,
    ctaText: "Assinar Pro"
  },
  enterprise: {
    name: "Enterprise",
    price: "R$197",
    period: "/mês",
    features: [
      "Lojas ilimitadas",
      "Otimizações ilimitadas",
      "Recursos customizados",
      "API exclusiva",
      "Suporte dedicado",
      "Onboarding personalizado"
    ],
    popular: false,
    ctaText: "Contato"
  }
};

// Status labels
export const STATUS_LABELS = {
  active: { label: "Ativo", color: "green" },
  inactive: { label: "Inativo", color: "gray" },
  deleted: { label: "Excluído", color: "red" },
  pending: { label: "Pendente", color: "yellow" },
  applied: { label: "Aplicado", color: "green" },
  ignored: { label: "Ignorado", color: "red" },
  processing: { label: "Processando", color: "blue" },
  completed: { label: "Concluído", color: "green" },
  failed: { label: "Falhou", color: "red" }
};

// Demo data
export const FEATURES = [
  {
    icon: "ri-line-chart-line",
    title: "Análise de performance",
    description: "Visualize métricas em tempo real e identifique oportunidades de melhoria com dashboards intuitivos."
  },
  {
    icon: "ri-ai-generate",
    title: "Otimização por IA",
    description: "Melhore títulos, descrições e palavras-chave automaticamente com nossa tecnologia de IA especializada."
  },
  {
    icon: "ri-store-2-line",
    title: "Integração completa",
    description: "Conecte sua loja da Shopee com apenas alguns cliques e sincronize automaticamente todos os seus produtos."
  },
  {
    icon: "ri-notification-3-line",
    title: "Alertas inteligentes",
    description: "Receba notificações quando produtos apresentarem baixa performance ou oportunidades de otimização."
  },
  {
    icon: "ri-bar-chart-grouped-line",
    title: "Relatórios detalhados",
    description: "Acompanhe a evolução das métricas ao longo do tempo com relatórios visuais personalizáveis."
  },
  {
    icon: "ri-rocket-line",
    title: "Implementação rápida",
    description: "Aplique as otimizações diretamente na Shopee com um clique e acompanhe os resultados em tempo real."
  }
];

// Empty states
export const EMPTY_STATES = {
  products: {
    icon: "ri-shopping-bag-3-line",
    title: "Nenhum produto encontrado",
    description: "Conecte sua loja Shopee para visualizar seus produtos."
  },
  optimizations: {
    icon: "ri-ai-generate",
    title: "Nenhuma otimização encontrada",
    description: "Seus produtos ainda não foram otimizados."
  },
  stores: {
    icon: "ri-store-2-line",
    title: "Nenhuma loja conectada",
    description: "Conecte sua loja Shopee para começar."
  }
};
