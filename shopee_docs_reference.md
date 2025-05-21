
# Documentação de Referência da API Shopee

## Fluxo de Autorização

### Criação da URL de Autorização
- **Host**: `https://partner.shopeemobile.com` (ambiente de produção)
- **Path**: `/api/v2/shop/auth_partner`
- **Parâmetros necessários**:
  - `partner_id`: ID do seu aplicativo Shopee
  - `timestamp`: Timestamp UNIX atual (válido por 5 minutos)
  - `redirect`: URL de redirecionamento após autorização
  - `sign`: Assinatura HMAC-SHA256 baseada em `partner_id + path + timestamp`

### Geração do Sign
- String base: `[partner_id][path][timestamp]`
- Exemplo: `2011285/api/v2/shop/auth_partner1659992253`
- Criptografar usando HMAC-SHA256 com a partner_key como chave

### Obtenção de Tokens
- **Endpoint**: `/api/v2/auth/token/get`
- **Método**: POST
- **Parâmetros**:
  - `code`: Código obtido após autorização (válido por 10 minutos)
  - `shop_id`: ID da loja que autorizou
  - `partner_id`: ID do seu aplicativo

### Refresh de Tokens
- **Endpoint**: `/api/v2/auth/access_token/get`
- **Método**: POST
- **Parâmetros**:
  - `refresh_token`: Token de refresh (uso único, válido por 30 dias)
  - `shop_id`: ID da loja
  - `partner_id`: ID do seu aplicativo

## Erros Comuns
- **Invalid code**: O código já foi usado ou expirou
- **Invalid timestamp**: Timestamp expirou (validade de 5 minutos)
- **Wrong sign**: Assinatura incorreta, verificar string base
- **TokenNotFound**: Código de autorização inválido ou expirado
