/**
 * Format number as currency
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('pt-BR').format(numValue);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0%';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0%';

  return `${numValue.toFixed(1)}%`;
};

/**
 * Format CTR (click-through rate)
 */
export const formatCTR = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0,00%';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0,00%';

  return `${numValue.toFixed(2).replace('.', ',')}%`;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Data não disponível';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data inválida';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return 'Data inválida';
  }
};

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR');
}

/**
 * Format relative time (e.g., "há 2 dias")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return 'U';
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}` || firstName?.charAt(0).toUpperCase() || 'U';
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format plan name
 */
export function formatPlanName(plan: string): string {
  switch (plan.toLowerCase()) {
    case 'free': return 'Gratuito';
    case 'starter': return 'Starter';
    case 'pro': return 'Pro';
    case 'enterprise': return 'Enterprise';
    default: return plan;
  }
}

/**
 * Format change with arrow (increase/decrease)
 */
export function formatChange(value: number): { text: string, isPositive: boolean } {
  const isPositive = value >= 0;
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
  return { text: formatted, isPositive };
}