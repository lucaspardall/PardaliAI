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
import React, { Suspense, lazy, ErrorInfo, Component } from 'react';

const BulkOptimizePage = lazy(() => import('./pages/dashboard/bulk-optimize'));
const AiCreditsPage = lazy(() => import('./pages/dashboard/ai-credits'));
import { HelmetProvider } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Componente de Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<{
    isChecking: boolean;
    isAuthed: boolean;
  }>({
    isChecking: true,
    isAuthed: false
  });

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          setAuthState({ isChecking: false, isAuthed: true });
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        window.location.href = '/';
      }
    };

    checkAuth();
  }, []);

  if (authState.isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return authState.isAuthed ? <>{children}</> : null;
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
      <Route path="/dashboard/bulk-optimize">
        {() => <ProtectedRoute><BulkOptimizePage /></ProtectedRoute>}
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
      <Route path="/dashboard/ai-credits">
        {() => <ProtectedRoute><AiCreditsPage /></ProtectedRoute>}
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;