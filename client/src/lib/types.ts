/**
 * User
 */
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  planStatus: 'active' | 'canceled' | 'past_due';
  planExpiresAt?: string;
  aiCreditsLeft: number;
  storeLimit: number;
}

/**
 * Shopee Store
 */
export interface ShopeeStore {
  id: number;
  userId: string;
  shopId: string;
  shopName: string;
  shopLogo?: string;
  shopRegion: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  isActive: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  totalProducts: number;
  averageCtr?: number;
  monthlyRevenue?: number;
}

/**
 * Product
 */
export interface Product {
  id: number;
  storeId: number;
  productId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
  status: 'active' | 'inactive' | 'deleted';
  ctr?: number;
  views?: number;
  sales?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

/**
 * Product Optimization
 */
export interface ProductOptimization {
  id: number;
  productId: number;
  originalTitle?: string;
  originalDesc?: string;
  originalKeywords?: string;
  suggestedTitle?: string;
  suggestedDesc?: string;
  suggestedKeywords?: string;
  reasoningNotes?: string;
  status: 'pending' | 'applied' | 'ignored';
  appliedAt?: string;
  feedbackRating?: number;
  createdAt: string;
  aiRequestId?: number;
}

/**
 * Store Metric
 */
export interface StoreMetric {
  id: number;
  storeId: number;
  date: string;
  totalViews?: number;
  totalSales?: number;
  totalRevenue?: number;
  averageCtr?: number;
  productCount?: number;
  createdAt: string;
}

/**
 * AI Request
 */
export interface AIRequest {
  id: number;
  userId: string;
  type: 'product_optimization' | 'product_creation' | 'store_diagnosis';
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Notification
 */
export interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  date: string;
  views?: number;
  sales?: number;
  ctr?: number;
  revenue?: number;
}

/**
 * Stat Card Data
 */
export interface StatCardData {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: string;
}

/**
 * Optimization Result
 */
export interface OptimizationResult {
  optimization: ProductOptimization;
  request: AIRequest;
  creditsLeft: number;
}

/**
 * Plan
 */
export interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  ctaText: string;
  highlight?: string;
}
