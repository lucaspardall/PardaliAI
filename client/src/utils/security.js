
// Utilitários de segurança para o frontend
export const Security = {
  // Escapar HTML para prevenir XSS
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return String(text).replace(/[&<>"'/]/g, char => map[char]);
  },

  // Validar URL antes de usar
  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Sanitizar dados antes de exibir
  sanitizeProductData(product) {
    return {
      ...product,
      name: this.escapeHtml(product.name || ''),
      description: this.escapeHtml(product.description || ''),
      price: Math.abs(Number(product.price) || 0),
      stock: Math.abs(Math.floor(Number(product.stock) || 0))
    };
  },

  // Validar arquivo antes de upload
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    } = options;

    // Verificar tamanho
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
    }

    // Verificar tipo MIME
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido');
    }

    // Verificar extensão
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Extensão de arquivo não permitida');
    }

    return true;
  },

  // Gerar ID único seguro
  generateSecureId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Em TODOS os componentes que exibem dados, use:
// import { Security } from '@/utils/security';
// E sanitize antes de exibir: Security.sanitizeProductData(product)
