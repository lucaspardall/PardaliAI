import { Switch, Route } from "wouter";
import { useEffect } from "react";
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
import { useAuth } from "./hooks/useAuth";
import { loadIcons } from "@/lib/utils/icons";

// Importar páginas do modo de demonstração
import DemoLogin from "@/pages/demo/login";
import DemoDashboard from "@/pages/demo/dashboard";
import DemoProducts from "@/pages/demo/products";
import DemoOptimizations from "@/pages/demo/optimizations";
import DemoReports from "@/pages/demo/reports";
import DemoStore from "@/pages/demo/store";
import DemoProfile from "@/pages/demo/profile";
import DemoSubscription from "@/pages/demo/subscription";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = "/api/login";
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/" component={Landing} />

      {/* Demo mode routes */}
      <Route path="/demo/login" component={DemoLogin} />
      <Route path="/demo/dashboard" component={DemoDashboard} />
      <Route path="/demo/products" component={DemoProducts} />
      <Route path="/demo/optimizations" component={DemoOptimizations} />
      <Route path="/demo/reports" component={DemoReports} />
      <Route path="/demo/store" component={DemoStore} />
      <Route path="/demo/profile" component={DemoProfile} />
      <Route path="/demo/subscription" component={DemoSubscription} />
      <Route path="/demo/stores/:id" component={DemoStore} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard/products">
        {() => <ProtectedRoute component={Products} />}
      </Route>
      <Route path="/dashboard/product/:id">
        {(params) => <ProtectedRoute component={ProductDetail} id={params.id} />}
      </Route>
      <Route path="/dashboard/optimize/:id">
        {(params) => <ProtectedRoute component={OptimizeProduct} id={params.id} />}
      </Route>
      <Route path="/dashboard/store/connect">
        {() => <ProtectedRoute component={ConnectStore} />}
      </Route>
      <Route path="/dashboard/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/dashboard/subscription">
        {() => <ProtectedRoute component={Subscription} />}
      </Route>
      <Route path="/dashboard/shopee-connect">
        {() => <ProtectedRoute component={ShopeeConnect} />}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Carregar ícones do Remix Icon ao iniciar o aplicativo
  useEffect(() => {
    loadIcons();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cip-shopee-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;