import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Verifica se a aplicação está em modo de demonstração
 * com base na URL atual
 */
export function isDemoMode(): boolean {
  return window.location.pathname.startsWith('/demo');
}
