/**
 * Load Remix Icons from CDN
 */
export function loadIcons(): void {
  // Check if the remixicon stylesheet already exists
  if (document.querySelector('link[href*="remixicon"]')) {
    return;
  }
  
  // Create a link element
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
  
  // Append to head
  document.head.appendChild(link);
}

/**
 * Get icon for status
 */
export function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'applied':
    case 'completed':
      return 'ri-check-line';
    case 'inactive':
    case 'ignored':
      return 'ri-close-line';
    case 'pending':
      return 'ri-time-line';
    case 'processing':
      return 'ri-loader-3-line';
    case 'failed':
      return 'ri-error-warning-line';
    default:
      return 'ri-question-line';
  }
}

/**
 * Get icon color class for status
 */
export function getStatusColorClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'applied':
    case 'completed':
      return 'text-green-500';
    case 'inactive':
    case 'ignored':
      return 'text-gray-500';
    case 'pending':
      return 'text-yellow-500';
    case 'processing':
      return 'text-blue-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get icon for metric
 */
export function getMetricIcon(metricName: string): string {
  switch (metricName.toLowerCase()) {
    case 'ctr':
    case 'average-ctr':
      return 'ri-percentage-line';
    case 'views':
    case 'visualizações':
      return 'ri-eye-line';
    case 'sales':
    case 'vendas':
      return 'ri-shopping-cart-line';
    case 'revenue':
    case 'receita':
      return 'ri-money-dollar-circle-line';
    case 'products':
    case 'produtos':
      return 'ri-shopping-bag-line';
    default:
      return 'ri-bar-chart-line';
  }
}

/**
 * Get icon for plan
 */
export function getPlanIcon(plan: string): string {
  switch (plan.toLowerCase()) {
    case 'free':
      return 'ri-gift-line';
    case 'starter':
      return 'ri-rocket-line';
    case 'pro':
      return 'ri-vip-crown-line';
    case 'enterprise':
      return 'ri-building-line';
    default:
      return 'ri-price-tag-3-line';
  }
}
