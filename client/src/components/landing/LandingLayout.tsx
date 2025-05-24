import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/theme-provider";
import { loadIcons } from "@/lib/utils/icons";

function LandingLayout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    loadIcons(); // Carregar os ícones do Remix Icon
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
          isScrolled ? "bg-background/90 backdrop-blur-sm" : "bg-transparent"
        }`}
      >
        <div className="container max-w-screen-xl mx-auto py-4 px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold">
            My App <i className="ri-line-chart-line"></i>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              About
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="space-x-3">
            {isLoading ? (
              <div>Loading...</div>
            ) : user ? (
              <>
                <span>{user.email}</span>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors">
                  Sign In
                </button>
                <button className="px-4 py-2 border border-primary rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-20">
        <div className="container max-w-screen-xl mx-auto px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background mt-12 py-6 border-t">
        <div className="container max-w-screen-xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} My App. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default LandingLayout;