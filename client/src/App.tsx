import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { clerkConfig } from "./lib/clerk";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/dashboard/products";
import ProductDetail from "@/pages/dashboard/product/[id]";
import OptimizeProduct from "@/pages/dashboard/optimize/[id]";
import ConnectStore from "@/pages/dashboard/store/connect";
import ShopeeConnect from "@/pages/shopee-connect";
import Profile from "@/pages/dashboard/profile";
import Subscription from "@/pages/dashboard/subscription";
import Optimizations from "@/pages/dashboard/optimizations";
import Reports from "@/pages/dashboard/reports";
import React, { Suspense, lazy } from 'react';
import { Loading } from "@/components/ui/loading";

const BulkOptimizePage = lazy(() => import('./pages/dashboard/bulk-optimize'));
const AiCreditsPage = lazy(() => import('./pages/dashboard/ai-credits'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
import { HelmetProvider } from 'react-helmet-async';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <SignedIn>
      {children}
    </SignedIn>
  );
}



function Router() {
  return (
    <Switch>
      {/* Página de Login */}
      <Route path="/login">
        <SignedOut>
          <Suspense fallback={<Loading message="Preparando login..." />}>
            <LoginPage />
          </Suspense>
        </SignedOut>
        <SignedIn>
          <Landing />
        </SignedIn>
      </Route>

      {/* Landing Page */}
      <Route path="/">
        <SignedOut>
          <Landing />
        </SignedOut>
        <SignedIn>
          <Dashboard />
        </SignedIn>
      </Route>

      {/* Dashboard Routes - Protegidas */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/product/:id">
        <ProtectedRoute>
          <ProductDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/optimize/:id">
        <ProtectedRoute>
          <OptimizeProduct />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/store/connect">
        <ProtectedRoute>
          <ConnectStore />
        </ProtectedRoute>
      </Route>
      <Route path="/shopee-connect" component={ShopeeConnect} />
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
      <Route path="/dashboard/bulk-optimize">
        <ProtectedRoute>
          <Suspense fallback={<Loading size="sm" message="Carregando otimização..." />}>
            <BulkOptimizePage />
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

function App() {
  if (!clerkConfig.isConfigured) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Configuração Necessária</h1>
          <p className="text-gray-600 mb-4">
            {clerkConfig.errorMessage}
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>1. Vá em Secrets → Add Secret</p>
            <p>2. Nome: VITE_CLERK_PUBLISHABLE_KEY</p>
            <p>3. Valor: sua chave do Clerk Dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkConfig.publishableKey}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider defaultTheme="light" storageKey="cip-shopee-theme">
            <TooltipProvider>
              <Toaster />
              <Suspense fallback={
                <div className="h-screen w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              }>
                <Router />
              </Suspense>
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;