
// Cache simples em memória
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos padrão
  }

  set(key, value, ttl = this.ttl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Limpar cache expirado a cada 10 minutos
  startCleanup() {
    setInterval(() => {
      for (const [key, item] of this.cache.entries()) {
        if (Date.now() > item.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }
}

const cache = new SimpleCache();
cache.startCleanup();

module.exports = cache;
