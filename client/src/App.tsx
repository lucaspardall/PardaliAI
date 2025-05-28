import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ClerkProvider } from '@clerk/clerk-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';

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

console.log('🔑 Clerk Key detectada:', CLERK_PUBLISHABLE_KEY ? 'OK' : 'MISSING');

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY não configurado nos Secrets');
  throw new Error('Clerk key missing - Configure nos Secrets do Replit');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        if (!url) {
          console.warn('⚠️ Invalid query key:', queryKey);
          throw new Error('Invalid query key');
        }

        // Ignorar queries com null ou undefined
        if (url === null || url === undefined) {
          return null;
        }
        
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <HelmetProvider>
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
            </HelmetProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;