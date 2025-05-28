import { QueryClient } from "@tanstack/react-query";

async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any
): Promise<Response> {
  const config: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorMessage}`);
  }

  return response;
}

// Função padrão para queries que usam apiRequest
const defaultQueryFn = async ({ queryKey }: { queryKey: any[] }) => {
  const [url] = queryKey;
  if (typeof url === 'string') {
    const response = await apiRequest('GET', url);
    return response.json();
  }
  throw new Error('Query key deve ser uma string com a URL');
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros 401/403
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

export { apiRequest };