import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ui/theme-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils/formatters";

interface SidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  user?: any;
  stores?: any[];
  notifications?: any[];
  demoMode?: boolean;
}

// Componente de navegação para evitar aninhamento de <a>
const NavItem = ({ href, icon, label, isActive }: { href: string; icon: string; label: string; isActive: boolean }) => {
  return (
    <div className="nav-item">
      <Link href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
        <i className={`${icon} mr-3 text-lg`}></i>
        {label}
      </Link>
    </div>
  );
};

export default function SidebarLayout({ children, title = "Dashboard", user, stores, notifications, demoMode = false }: SidebarLayoutProps) {
  const [location] = useLocation();
  const authContext = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Use user from props if provided (demo mode), otherwise from auth context
  const authUser = demoMode ? user : authContext?.user;

  // Fetch notifications if not provided via props (non-demo mode)
  const { data: fetchedNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
    enabled: !demoMode
  });

  // Use notifications from props if provided (demo mode), otherwise from API
  const userNotifications = demoMode ? notifications : fetchedNotifications;

  // Get unread notifications count
  const unreadCount = userNotifications?.filter((n: any) => !n.isRead).length || 0;

  // Base paths for links based on mode
  const basePath = demoMode ? "/demo" : "/dashboard";

  const navItems = [
    { href: `${basePath}`, icon: "ri-dashboard-line", label: "Dashboard" },
    { href: `${basePath}/products`, icon: "ri-shopping-bag-3-line", label: "Produtos" },
    { href: demoMode ? `${basePath}/dashboard` : "/dashboard/store/connect", icon: "ri-store-2-line", label: "Minha Loja" },
    { href: `${basePath}/optimizations`, icon: "ri-ai-generate", label: "Otimizações" },
    { href: `${basePath}/reports`, icon: "ri-line-chart-line", label: "Relatórios" },
  ];

  const settingsItems = [
    { href: demoMode ? `${basePath}/dashboard` : "/dashboard/profile", icon: "ri-user-settings-line", label: "Perfil" },
    { href: demoMode ? `${basePath}/dashboard` : "/dashboard/subscription", icon: "ri-vip-crown-line", label: "Assinatura" },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 bg-secondary border-r border-border h-full flex-col flex-shrink-0">
        <div className="p-4 border-b border-sidebar-border flex items-center">
          <i className="ri-bird-fill text-primary text-2xl mr-2"></i>
          <h1 className="text-xl font-bold text-white font-heading">CIP Shopee</h1>
        </div>

        <div className="px-3 py-4 flex-1 overflow-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={location === item.href}
              />
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Configurações
            </h3>
            <div className="mt-2 space-y-1">
              {settingsItems.map((item) => (
                <NavItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={location === item.href}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              {authUser?.profileImageUrl ? (
                <AvatarImage src={authUser.profileImageUrl} alt={authUser.firstName || "User"} />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(authUser?.firstName, authUser?.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}` : authUser?.email || 'Usuário'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                Plano {authUser?.plan === 'free' ? 'Gratuito' : authUser?.plan === 'starter' ? 'Starter' : authUser?.plan === 'pro' ? 'Pro' : 'Enterprise'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="ml-auto text-gray-400 hover:text-white"
              onClick={() => {
                window.location.href = demoMode ? '/demo/logout' : '/api/logout';
              }} 
            >
              <i className="ri-logout-box-r-line"></i>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-secondary border-r border-sidebar-border z-30 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out md:hidden`}>
        <div className="p-4 border-b border-sidebar-border flex items-center">
          <i className="ri-bird-fill text-primary text-2xl mr-2"></i>
          <h1 className="text-xl font-bold text-white font-heading">CIP Shopee</h1>
          <button 
            className="ml-auto text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-3 py-4 h-[calc(100%-64px-72px)] overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={location === item.href}
              />
            ))}
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Configurações
            </h3>
            <div className="mt-2 space-y-1">
              {settingsItems.map((item) => (
                <NavItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={location === item.href}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 w-full border-t border-sidebar-border p-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              {authUser?.profileImageUrl ? (
                <AvatarImage src={authUser.profileImageUrl} alt={authUser.firstName || "User"} />
              ) : (
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(authUser?.firstName, authUser?.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}` : authUser?.email || 'Usuário'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                Plano {authUser?.plan === 'free' ? 'Gratuito' : authUser?.plan === 'starter' ? 'Starter' : authUser?.plan === 'pro' ? 'Pro' : 'Enterprise'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="ml-auto text-gray-400 hover:text-white"
              onClick={() => {
                window.location.href = demoMode ? '/demo/logout' : '/api/logout';
              }} 
            >
              <i className="ri-logout-box-r-line"></i>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {/* Top Bar */}
        <div className="bg-card shadow-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 text-muted-foreground"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <i className="ri-notification-3-line text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications?.length > 0 ? (
                  notifications.slice(0, 5).map((notification: any) => (
                    <DropdownMenuItem key={notification.id} className="cursor-pointer p-3 focus:bg-accent">
                      <div className={`${!notification.isRead ? 'font-medium' : ''}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{notification.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-2 px-3 text-center text-muted-foreground text-sm">
                    Nenhuma notificação
                  </div>
                )}
                {notifications?.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-center text-sm text-primary">
                      Ver todas as notificações
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {theme === 'light' || theme === 'system' ? (
                    <i className="ri-moon-line text-xl"></i>
                  ) : (
                    <i className="ri-sun-line text-xl"></i>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <i className="ri-sun-line mr-2"></i>
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <i className="ri-moon-line mr-2"></i>
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <i className="ri-computer-line mr-2"></i>
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}