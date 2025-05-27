
import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'wouter';

export default function SignUpPage() {
  const { isAuthenticated } = useAuth();

  // Se já estiver autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <i className="ri-shopping-bag-3-line text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CIP Shopee</h1>
          <p className="text-gray-600">Centro de Inteligência Pardal</p>
          <p className="text-gray-500 text-sm">Crie sua conta e comece a otimizar</p>
        </div>

        {/* Clerk SignUp Component */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "bg-white border-gray-200 hover:bg-gray-50 text-gray-700",
                formButtonPrimary: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                footerActionLink: "text-orange-600 hover:text-orange-700",
                identityPreviewEditButton: "text-orange-600 hover:text-orange-700",
                formFieldInput: "border-gray-300 focus:border-orange-500 focus:ring-orange-500",
                formFieldLabel: "text-gray-700",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500"
              },
              layout: {
                socialButtonsPlacement: "top"
              }
            }}
            redirectUrl="/dashboard"
            signInUrl="/login"
          />
        </div>

        {/* Benefícios */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Ao se cadastrar, você ganha:</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <i className="ri-gift-line mr-2 text-orange-600"></i>
              7 dias de teste grátis
            </div>
            <div className="flex items-center justify-center">
              <i className="ri-cpu-line mr-2 text-green-600"></i>
              10 créditos de IA gratuitos
            </div>
            <div className="flex items-center justify-center">
              <i className="ri-store-2-line mr-2 text-red-600"></i>
              Conecte 1 loja Shopee
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
