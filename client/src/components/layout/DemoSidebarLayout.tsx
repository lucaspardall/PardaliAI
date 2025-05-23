import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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

interface DemoSidebarLayoutProps {
  children: React.ReactNode;
  title?: string;
  demoData: any;
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

export default function DemoSidebarLayout({ children, title = "Dashboard", demoData }: DemoSidebarLayoutProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, stores, notifications } = demoData;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Unread notifications count
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  // Links da barra lateral
  const sidebarLinks = [
    { href: "/demo/dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { href: "/demo/products", icon: "ri-shopping-bag-line", label: "Produtos" },
    { href: "/demo/optimizations", icon: "ri-rocket-line", label: "Otimizações" },
    { href: "/demo/analytics", icon: "ri-bar-chart-box-line", label: "Analytics" },
    { href: "/demo/settings", icon: "ri-settings-line", label: "Configurações" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`sidebar ${isMobileSidebarOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'}`}
      >
        <div className="sidebar-header">
          <Link href="/demo/dashboard" className="flex items-center space-x-2">
            <i className="ri-bird-fill text-primary text-2xl"></i>
            <span className="font-bold text-lg hidden md:inline">CIP Shopee</span>
          </Link>
          <button 
            className="sidebar-close md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="sidebar-stores">
          <h3 className="sidebar-heading">Lojas</h3>
          <div className="space-y-1">
            {stores?.map((store: any) => (
              <div 
                key={store.id}
                className="store-item"
              >
                <span className="flex-1 truncate">{store.shopName}</span>
                <span className={`status-dot ${store.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              <i className="ri-add-line mr-1"></i> Adicionar Loja Shopee
            </Button>
          </div>
        </div>

        <div className="sidebar-links">
          <h3 className="sidebar-heading">Menu</h3>
          <div className="space-y-1">
            {sidebarLinks.map(link => (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="user-profile-button">
                <Avatar className="h-8 w-8">
                  {user?.profileImageUrl ? (
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                  ) : (
                    <AvatarFallback>{getInitials(`${user?.firstName} ${user?.lastName}`)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="user-info">
                  <p className="user-name">{user?.firstName} {user?.lastName}</p>
                  <p className="user-plan">
                    <span className={`plan-badge ${user?.plan === 'pro' ? 'plan-pro' : 'plan-free'}`}>
                      {user?.plan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/demo/profile" className="cursor-pointer">
                  <i className="ri-user-line mr-2"></i> Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo/subscription" className="cursor-pointer">
                  <i className="ri-vip-crown-line mr-2"></i> Assinatura
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <i className={`${theme === "dark" ? "ri-sun-line" : "ri-moon-line"} mr-2`}></i>
                {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/" className="cursor-pointer">
                  <i className="ri-logout-box-line mr-2"></i> Voltar para Home
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-h-screen max-h-screen overflow-auto">
        <header className="dashboard-header">
          <div className="flex gap-4 items-center">
            <button
              className="text-2xl md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <i className="ri-menu-line"></i>
            </button>
            <h1 className="text-xl font-semibold hidden md:block">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="top-nav-button">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative">
                    <i className="ri-notification-3-line text-xl"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notificações</span>
                    <Button variant="ghost" size="sm" className="h-auto py-0 px-2 text-xs">
                      Marcar todas como lidas
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-auto">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification: any) => (
                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-2 cursor-pointer">
                          <div className="flex items-start gap-2 w-full">
                            <div className={`p-2 rounded-full text-white ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-primary'}`}>
                              <i className={`${notification.type === 'success' ? 'ri-check-line' : notification.type === 'warning' ? 'ri-error-warning-line' : 'ri-information-line'} text-sm`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-muted-foreground text-xs truncate">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <i className="ri-notification-off-line text-3xl mb-2"></i>
                        <p>Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/demo/notifications" className="cursor-pointer justify-center">
                      Ver todas as notificações
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {user?.profileImageUrl ? (
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                  ) : (
                    <AvatarFallback>{getInitials(`${user?.firstName} ${user?.lastName}`)}</AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/demo/profile" className="cursor-pointer">
                    <i className="ri-user-line mr-2"></i> Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/demo/subscription" className="cursor-pointer">
                    <i className="ri-vip-crown-line mr-2"></i> Assinatura
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  <i className={`${theme === "dark" ? "ri-sun-line" : "ri-moon-line"} mr-2`}></i>
                  {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/" className="cursor-pointer">
                    <i className="ri-logout-box-line mr-2"></i> Voltar para Home
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}