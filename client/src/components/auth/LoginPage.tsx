
import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <i className="ri-shopping-bag-3-line text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CIP Shopee</h1>
          <p className="text-gray-600">Otimização Inteligente para Lojas Shopee</p>
        </div>

        {/* Card do Login */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre ou crie uma conta para começar a otimizar sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <SignIn 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white border-gray-200 hover:bg-gray-50 text-gray-700",
                      formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      footerActionLink: "text-blue-600 hover:text-blue-700"
                    }
                  }}
                  redirectUrl="/dashboard"
                  signUpUrl="#"
                />
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <SignUp 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white border-gray-200 hover:bg-gray-50 text-gray-700",
                      formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                      footerActionLink: "text-blue-600 hover:text-blue-700"
                    }
                  }}
                  redirectUrl="/dashboard"
                  signInUrl="#"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features em destaque */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Recursos inclusos:</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-600">
            <div className="flex items-center">
              <i className="ri-ai-generate mr-1 text-blue-600"></i>
              IA Avançada
            </div>
            <div className="flex items-center">
              <i className="ri-line-chart-line mr-1 text-green-600"></i>
              Relatórios
            </div>
            <div className="flex items-center">
              <i className="ri-shield-check-line mr-1 text-purple-600"></i>
              Seguro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
