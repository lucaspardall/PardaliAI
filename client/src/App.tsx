import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import { useLocation } from "wouter";
import { useAuth } from "./hooks/useAuth";
import React, { Suspense, useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (useEffect já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/" component={Landing} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/products">
        {() => <ProtectedRoute><Products /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/product/:id">
        {(params) => <ProtectedRoute><ProductDetail id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/optimize/:id">
        {(params) => <ProtectedRoute><OptimizeProduct id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/optimizations">
        {() => <ProtectedRoute><Optimizations /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/reports">
        {() => <ProtectedRoute><Reports /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/store/connect">
        {() => <ProtectedRoute><ConnectStore /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute><Profile /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/subscription">
        {() => <ProtectedRoute><Subscription /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/shopee-connect">
        {() => <ProtectedRoute><ShopeeConnect /></ProtectedRoute>}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;