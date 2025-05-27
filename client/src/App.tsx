import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useAuth } from '@/hooks/useAuth';

// Pages
import LandingPage from '@/pages/landing';
import DirectLogin from '@/components/DirectLogin';

// Dashboard pages (lazy loaded)
import { lazy, Suspense, useEffect } from 'react';
import Loading from '@/components/ui/loading';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const DashboardPage = lazy(() => import('@/pages/dashboard/index'));
const ProductsPage = lazy(() => import('@/pages/dashboard/products'));
const OptimizePage = lazy(() => import('@/pages/dashboard/optimize/[id]'));
const ProductPage = lazy(() => import('@/pages/dashboard/product/[id]'));
const SubscriptionPage = lazy(() => import('@/pages/dashboard/subscription'));
const ProfilePage = lazy(() => import('@/pages/dashboard/profile'));
const ReportsPage = lazy(() => import('@/pages/dashboard/reports'));
const OptimizationsPage = lazy(() => import('@/pages/dashboard/optimizations'));
const BulkOptimizePage = lazy(() => import('@/pages/dashboard/bulk-optimize'));
const ConnectStorePage = lazy(() => import('@/pages/dashboard/store/connect'));
const AiCreditsPage = lazy(() => import('@/pages/dashboard/ai-credits'));
const NotFound = lazy(() => import('@/pages/not-found'));
const ShopeeConnectPage = lazy(() => import('@/pages/shopee-connect'));

// Error boundary component
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  console.error('Error caught by boundary:', error);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Algo deu errado!</h2>
        <p className="text-gray-600 mb-4">
          {error?.message || 'Erro desconhecido'}
        </p>
        <div className="space-y-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && location === '/') {
      console.log('Usuário autenticado, redirecionando para dashboard');
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ) : (
          <LandingPage />
        )}
      </Route>
      <Route path="/login">
        <DirectLogin />
      </Route>
      <Route path="/shopee/connect">
        <Suspense fallback={<Loading size="sm" message="Conectando com Shopee..." />}>
          <ShopeeConnectPage />
        </Suspense>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Suspense fallback={<Loading />}>
            <DashboardPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/products">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando produtos..." />}>
            <ProductsPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/optimize/:id">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando otimização..." />}>
            <OptimizePage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/product/:id">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando produto..." />}>
            <ProductPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/subscription">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando assinatura..." />}>
            <SubscriptionPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/profile">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando perfil..." />}>
            <ProfilePage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/reports">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando relatórios..." />}>
            <ReportsPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/optimizations">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando otimizações..." />}>
            <OptimizationsPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/bulk-optimize">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando otimização em lote..." />}>
            <BulkOptimizePage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/store/connect">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Conectando loja..." />}>
            <ConnectStorePage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/ai-credits">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando créditos..." />}>
            <AiCreditsPage />
          </Suspense>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary:', error, errorInfo);
      }}
    >
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="app-theme">
            <div className="min-h-screen bg-background">
              <ErrorBoundary
                FallbackComponent={({ error, resetErrorBoundary }) => (
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-semibold mb-2">Erro na aplicação</h3>
                    <p className="text-sm text-gray-600 mb-4">{error?.message}</p>
                    <button
                      onClick={resetErrorBoundary}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              >
                <AppContent />
              </ErrorBoundary>
              <Toaster />
            </div>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}