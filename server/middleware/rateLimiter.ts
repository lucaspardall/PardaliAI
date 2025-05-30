
/**
 * Middleware de rate limiting para API Shopee
 */
import rateLimit from 'express-rate-limit';

// Rate limiter para webhooks
export const webhookLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 10, // Máximo 10 webhooks por segundo
  skipSuccessfulRequests: false,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para API calls da Shopee
export const shopeeApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Shopee permite ~100 calls/minuto
  message: {
    error: 'Rate limit exceeded',
    message: 'API rate limit exceeded. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

