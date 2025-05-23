
# CIP Shopee Integration

Esta é uma aplicação para integração com a API da Shopee, permitindo que vendedores conectem suas lojas e gerenciem produtos, pedidos e desempenho.

## Integração com Shopee

A aplicação utiliza a API v2.0 da Shopee Open Platform para integração com as lojas dos vendedores. O fluxo de autorização OAuth 2.0 é implementado para obter permissões de acesso às lojas.

### Fluxo de Autorização

A aplicação implementa três métodos de autorização para garantir compatibilidade com diferentes configurações:

1. **Método Padrão**: Utiliza a URL oficial da API de parceiros (`partner.shopeemobile.com`) para autorização.
2. **Método Alternativo**: Utiliza a URL regional do Seller Center para autorização.
3. **Login Direto**: Conecta diretamente através da página de login de vendedor.

### Configuração

Para configurar a integração, defina as seguintes variáveis de ambiente:

- `SHOPEE_PARTNER_ID`: ID de parceiro obtido no console da Shopee Open Platform
- `SHOPEE_PARTNER_KEY`: Chave de parceiro (secret) obtida no console da Shopee Open Platform
- `SHOPEE_REDIRECT_URL`: URL de redirecionamento cadastrada no console da Shopee Open Platform

### Uso

Para iniciar o fluxo de autorização, redirecione o usuário para:

```
/api/shopee/authorize
```

A aplicação apresentará uma página de diagnóstico com as opções de conexão. Para direcionar automaticamente para um método específico, use:

```
/api/shopee/authorize?direct=true&method=direct
```

Onde `method` pode ser `standard`, `alternative` ou `direct`.

## Desenvolvimento

Para executar o projeto localmente:

```bash
npm install
npm run dev
```

O servidor estará disponível em http://localhost:5000.

