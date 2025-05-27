import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-gray-400 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <i className="ri-bird-fill text-primary text-2xl mr-2"></i>
              <h2 className="text-xl font-bold text-white">CIP Shopee</h2>
            </div>
            <p className="max-w-xs">Otimização inteligente para lojas Shopee com tecnologia de IA.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features">Funcionalidades</Link></li>
                <li><Link href="/pricing">Preços</Link></li>
                <li><Link href="/integrations">Integrações</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">Sobre nós</Link></li>
                <li><Link href="/careers">Carreiras</Link></li>
                <li><Link href="/contact">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help">Central de ajuda</Link></li>
                <li><Link href="/docs">Documentação</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacidade</Link></li>
                <li><Link href="/terms">Termos</Link></li>
                <li><Link href="/cookies">Cookies</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} CIP Shopee. Todos os direitos reservados.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition"><i className="ri-twitter-x-line"></i></a>
            <a href="#" className="hover:text-white transition"><i className="ri-instagram-line"></i></a>
            <a href="#" className="hover:text-white transition"><i className="ri-linkedin-box-line"></i></a>
          </div>
        </div>
      </div>
    </footer>
  );
}