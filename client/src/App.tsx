
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ClerkProvider } from '@clerk/clerk-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkLoader } from '@/components/ClerkLoader';

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

// Detectar se está no Replit
const isReplit = window.location.hostname.includes('replit');

console.log('🔑 Clerk Key detectada:', CLERK_PUBLISHABLE_KEY ? 'OK' : 'MISSING');
console.log('🌍 Hostname:', window.location.hostname);
console.log('🔧 Ambiente Replit:', isReplit);

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY não configurado');
  throw new Error('Clerk key missing');
}

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
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        navigate={(to) => window.location.href = to}
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        signInUrl="/login"
        signUpUrl="/signup"
        {...(isReplit && {
          // Configurações específicas para Replit
          allowedRedirectOrigins: [
            window.location.origin,
            'https://*.replit.dev',
            'https://*.replit.co',
            'https://*.replit.app'
          ],
          // Usar CDN mais estável
          clerkJSUrl: "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js",
          // Configurações de compatibilidade
          isSatellite: false,
          domain: window.location.hostname,
          proxyUrl: undefined,
          telemetry: false
        })}
        appearance={{
          variables: {
            colorPrimary: "#f97316",
            colorBackground: "#ffffff",
            colorText: "#1f2937"
          },
          elements: {
            rootBox: "w-full max-w-md mx-auto",
            card: "bg-white shadow-lg rounded-lg border border-gray-200",
            headerTitle: "text-xl font-bold text-gray-900",
            headerSubtitle: "text-gray-600 text-sm",
            formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white",
            footerActionLink: "text-orange-600 hover:text-orange-700"
          }
        }}
        options={{
          standardBrowser: true,
          touchSession: false
        }}
      >
        <ClerkLoader>
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
        </ClerkLoader>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
