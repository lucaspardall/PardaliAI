
/**
 * Sistema de cache para a API Shopee
 * Implementa caching inteligente conforme recomendado na documentação
 */

import NodeCache from 'node-cache';
import { ShopeeAuthTokens } from './types';

// Tempos de expiração em segundos
const CACHE_TTL = {
  // Dados que raramente mudam
  CATEGORIES: 24 * 60 * 60, // 24 horas
  ATTRIBUTES: 12 * 60 * 60, // 12 horas
  
  // Dados que mudam com frequência moderada
  SHOP_INFO: 15 * 60, // 15 minutos
  PRODUCT_LIST: 5 * 60, // 5 minutos
  PRODUCT_DETAIL: 10 * 60, // 10 minutos
  
  // Dados dinâmicos (cache mínimo)
  ORDER_LIST: 60, // 1 minuto
  METRICS: 5 * 60, // 5 minutos
};

// Prefixos para chaves de cache
const CACHE_PREFIX = {
  CATEGORY: 'shopee:category:',
  ATTRIBUTE: 'shopee:attr:',
  SHOP: 'shopee:shop:',
  PRODUCT: 'shopee:product:',
  ORDER: 'shopee:order:',
  MEDIA: 'shopee:media:',
};

// Instância de cache
const cache = new NodeCache({
  stdTTL: 300, // TTL padrão de 5 minutos
  checkperiod: 60, // Verificar expiração a cada 1 minuto
  useClones: false, // Não clonar objetos para melhor performance
});

/**
 * Obtém um item do cache
 * @param key Chave do item
 * @returns Item armazenado ou null se não encontrado ou expirado
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    const value = cache.get<T>(key);
    return value !== undefined ? value : null;
  } catch (error) {
    console.error('Error getting cached item:', error);
    return null;
  }
}

/**
 * Armazena um item no cache
 * @param key Chave do item
 * @param value Valor a ser armazenado
 * @param ttl Tempo de vida em segundos (opcional)
 * @returns true se armazenado com sucesso, false caso contrário
 */
export function setCachedItem<T>(key: string, value: T, ttl?: number): boolean {
  try {
    return cache.set(key, value, ttl);
  } catch (error) {
    console.error('Error setting cached item:', error);
    return false;
  }
}

/**
 * Remove um item do cache
 * @param key Chave do item
 * @returns true se removido com sucesso, false caso contrário
 */
export function removeCachedItem(key: string): boolean {
  try {
    return cache.del(key) > 0;
  } catch (error) {
    console.error('Error removing cached item:', error);
    return false;
  }
}

/**
 * Constrói uma chave de cache para categorias
 * @param shopId ID da loja
 * @param language Código do idioma (opcional)
 */
export function getCategoryCacheKey(shopId: string, language?: string): string {
  return `${CACHE_PREFIX.CATEGORY}${shopId}:${language || 'default'}`;
}

/**
 * Constrói uma chave de cache para atributos de categoria
 * @param shopId ID da loja
 * @param categoryId ID da categoria
 * @param language Código do idioma (opcional)
 */
export function getAttributeCacheKey(shopId: string, categoryId: number, language?: string): string {
  return `${CACHE_PREFIX.ATTRIBUTE}${shopId}:${categoryId}:${language || 'default'}`;
}

/**
 * Constrói uma chave de cache para informações da loja
 * @param shopId ID da loja
 */
export function getShopInfoCacheKey(shopId: string): string {
  return `${CACHE_PREFIX.SHOP}info:${shopId}`;
}

/**
 * Constrói uma chave de cache para listas de produtos
 * @param shopId ID da loja
 * @param filters Filtros aplicados (opcional)
 */
export function getProductListCacheKey(shopId: string, filters?: Record<string, any>): string {
  const filterString = filters ? JSON.stringify(filters) : 'default';
  return `${CACHE_PREFIX.PRODUCT}list:${shopId}:${filterString}`;
}

/**
 * Constrói uma chave de cache para detalhes de produto
 * @param shopId ID da loja
 * @param itemId ID do produto
 */
export function getProductDetailCacheKey(shopId: string, itemId: number): string {
  return `${CACHE_PREFIX.PRODUCT}detail:${shopId}:${itemId}`;
}

/**
 * Limpa o cache relacionado a um produto específico
 * @param shopId ID da loja
 * @param itemId ID do produto
 */
export function invalidateProductCache(shopId: string, itemId: number): void {
  // Remover cache de detalhes do produto
  removeCachedItem(getProductDetailCacheKey(shopId, itemId));
  
  // Remover caches de listas de produtos (todas as variações filtradas)
  const keys = cache.keys().filter(key => 
    key.startsWith(`${CACHE_PREFIX.PRODUCT}list:${shopId}:`)
  );
  
  if (keys.length > 0) {
    cache.del(keys);
  }
}

/**
 * Limpa todos os caches para uma loja específica
 * @param shopId ID da loja
 */
export function invalidateAllShopCache(shopId: string): void {
  const keys = cache.keys().filter(key => key.includes(`:${shopId}:`));
  
  if (keys.length > 0) {
    cache.del(keys);
  }
}

export const ShopeeCache = {
  TTL: CACHE_TTL,
  PREFIX: CACHE_PREFIX,
  get: getCachedItem,
  set: setCachedItem,
  remove: removeCachedItem,
  getCategoryCacheKey,
  getAttributeCacheKey,
  getShopInfoCacheKey,
  getProductListCacheKey,
  getProductDetailCacheKey,
  invalidateProductCache,
  invalidateAllShopCache,
};

/**
 * Obtém cache específico para tokens de autenticação
 */
export function getTokenCache() {
  return {
    getToken: (shopId: string) => getCachedItem<ShopeeAuthTokens>(`${CACHE_PREFIX.SHOP}token:${shopId}`),
    setToken: (shopId: string, tokens: ShopeeAuthTokens) => 
      setCachedItem(`${CACHE_PREFIX.SHOP}token:${shopId}`, tokens, CACHE_TTL.SHOP_INFO),
    removeToken: (shopId: string) => 
      removeCachedItem(`${CACHE_PREFIX.SHOP}token:${shopId}`)
  };
}

export default ShopeeCache;
