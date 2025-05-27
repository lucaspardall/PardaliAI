
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ClerkProvider } from '@clerk/clerk-react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/ErrorBoundary';

// Pages
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignUpPage from "@/pages/signup";
import NotFoundPage from "@/pages/not-found";

// Dashboard Pages
import DashboardHome from "@/pages/dashboard/index";
import Products from "@/pages/dashboard/products";
import Optimizations from "@/pages/dashboard/optimizations";
import Reports from "@/pages/dashboard/reports";
import Profile from "@/pages/dashboard/profile";
import Subscription from "@/pages/dashboard/subscription";
import AiCredits from "@/pages/dashboard/ai-credits";
import BulkOptimize from "@/pages/dashboard/bulk-optimize";
import OptimizePage from "@/pages/dashboard/optimize/[id]";
import ProductPage from "@/pages/dashboard/product/[id]";
import ConnectStorePage from "@/pages/dashboard/store/connect";
import ShopeeConnectPage from "@/pages/shopee-connect";

// Components
import ProtectedRoute from "@/components/ProtectedRoute";

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.")
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
        <p className="text-gray-600 mb-4">Ocorreu um erro inesperado. Tente novamente.</p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error('App Error:', error)}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Switch>
              {/* Public Routes */}
              <Route path="/" component={LandingPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/signup" component={SignUpPage} />
              <Route path="/shopee-connect" component={ShopeeConnectPage} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard">
                <ProtectedRoute>
                  <DashboardHome />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/products">
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/optimizations">
                <ProtectedRoute>
                  <Optimizations />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/reports">
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/profile">
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/subscription">
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/ai-credits">
                <ProtectedRoute>
                  <AiCredits />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/bulk-optimize">
                <ProtectedRoute>
                  <BulkOptimize />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/optimize/:id">
                <ProtectedRoute>
                  <OptimizePage />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/product/:id">
                <ProtectedRoute>
                  <ProductPage />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dashboard/store/connect">
                <ProtectedRoute>
                  <ConnectStorePage />
                </ProtectedRoute>
              </Route>

              {/* 404 Route */}
              <Route component={NotFoundPage} />
            </Switch>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;

              {/* 404 Page */}
              <Route component={NotFoundPage} />
            </Switch>
            
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
