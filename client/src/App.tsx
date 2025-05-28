import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';

// Pages
import LandingPage from "@/pages/landing";
import ReplitLoginPage from "@/pages/replit-login";
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

console.log('🌍 Hostname:', window.location.hostname);
console.log('🔧 Ambiente Replit:', true);
console.log('🔐 Usando Replit Auth nativo');

// Create a new React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 2,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HelmetProvider>
            <Switch>
              {/* Public Routes */}
              <Route path="/" component={LandingPage} />
              <Route path="/login" component={ReplitLoginPage} />
              <Route path="/signup" component={ReplitLoginPage} />
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
          </HelmetProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;