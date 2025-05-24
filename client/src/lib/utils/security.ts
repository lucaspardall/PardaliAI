
// Utility for sanitizing data before rendering it to the UI
export class Security {
  /**
   * Sanitize product data to prevent XSS attacks
   */
  static sanitizeProductData(product: any) {
    if (!product) return product;
    
    const sanitized = { ...product };
    
    // Sanitize text fields that might contain user input
    if (typeof sanitized.name === 'string') {
      sanitized.name = this.sanitizeString(sanitized.name);
    }
    
    if (typeof sanitized.description === 'string') {
      sanitized.description = this.sanitizeString(sanitized.description);
    }
    
    // Sanitize URLs in image array
    if (Array.isArray(sanitized.images)) {
      sanitized.images = sanitized.images.map((url: string) => this.sanitizeUrl(url));
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize a string to prevent XSS
   */
  static sanitizeString(str: string): string {
    if (!str) return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Sanitize a URL
   */
  static sanitizeUrl(url: string): string {
    if (!url) return '';
    
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return url;
    } catch (e) {
      // If URL is invalid, return empty string
      return '';
    }
  }
}
