# PRD - CIP Shopee MVP

## 📊 Visão Geral do Produto

O **CIP Shopee** é um SaaS que integra dados da Shopee e aplica IA para otimizar produtos e melhorar a performance de lojas. O MVP foca nas funcionalidades essenciais com design moderno e experiência visual.

## 🛠️ Stack Tecnológica

* **Frontend**: Next.js + React + Tailwind CSS + shadcn/ui
* **Backend**: Node.js + Express
* **Database**: MongoDB com Prisma ORM
* **Autenticação**: Replit Auth nativo
* **Gráficos**: Recharts

## 🎨 Design e UI

* **Tema Principal**: Moderno com cores laranja (#ff5722), azul escuro (#1e293b)
* **Estilo de Interface**: Clean, visual, com cards elevados e componentes shadcn/ui
* **Responsividade**: Otimizado para desktop, com suporte básico a mobile
* **Temas**: Light/Dark mode

## 🎯 Funcionalidades do MVP

### 1. Landing Page e Autenticação
* Landing page moderna com:
  - Hero section explicativa com CTA
  - 3-4 cards de benefícios com ícones
  - Seção de planos e preços
  - Footer com informações básicas
* Autenticação via Replit Auth:
  - Login/registro simples
  - Perfil de usuário básico
  - Middleware para rotas protegidas

### 2. Dashboard Principal
* Layout com sidebar de navegação e área principal
* Cards principais de métricas:
  - CTR médio da loja
  - Total de produtos
  - Vendas (simulado)
  - Visualizações (simulado)
* Gráfico de linha para tendências de 7 dias
* Lista dos 5 produtos com melhor e pior desempenho
* Alertas visuais para produtos com problemas

### 3. Integração com Shopee
* Página de conexão com a Shopee:
  - Botão para iniciar OAuth
  - Exibição de status da conexão
  - Informações da loja conectada
* Funções de API essenciais:
  - Autenticação OAuth
  - Gestão de tokens
  - Busca de produtos básicos
  - Armazenamento de dados no MongoDB

### 4. Visualização de Produtos
* Tabela/grid de produtos com:
  - Imagem do produto
  - Nome, preço, estoque
  - Métricas básicas (CTR, visualizações)
  - Indicador visual de performance
* Página de detalhes do produto:
  - Informações completas
  - Miniatura das imagens
  - Métricas em cards visuais
  - Botão para iniciar otimização

### 5. Otimização com IA (Simulada)
* Interface de otimização:
  - Visão lado a lado (antes/depois)
  - Sugestões para título e descrição
  - Explicação das melhorias
* Sistema simulado de IA:
  - Endpoint que simula processamento
  - Resultados pré-definidos de otimização
  - Delay simulado para parecer processamento real

### 6. Planos e Limites
* Página de planos com tabela comparativa:
  - Starter: R$39/mês (1 loja, 10 otimizações)
  - Pro: R$97/mês (3 lojas, otimizações ilimitadas)
  - Enterprise: R$197/mês (lojas ilimitadas)
* Interface simples na área do usuário:
  - Plano atual
  - Uso de recursos (créditos, lojas)
  - Botão para upgrade (simulado)

## 🧠 Regras de Negócio Essenciais
* Limite de 1 loja no plano gratuito
* 10 créditos de IA para otimização no plano inicial
* Sincronização básica de produtos a cada login
* Simulação de métricas para produtos sem dados reais
* Todos os planos são simulados, sem integração real de pagamentos

## 🧪 Dados Simulados para Demonstração
* Todos os usuários começam com plano gratuito
* Produtos demo são criados se nenhuma loja for conectada
* Métricas simuladas para CTR, visualizações e vendas
* Otimizações predefinidas para exemplos

## 🔄 Fluxo Principal do Usuário
1. Usuário se registra via Replit Auth
2. Conecta loja Shopee via OAuth ou usa demo
3. Visualiza dashboard com métricas
4. Navega para lista de produtos
5. Seleciona produto para otimizar
6. Visualiza sugestões da IA simulada
7. Aplica ou ignora otimizações
8. Verifica uso de recursos no perfil
