import { useState, useEffect } from 'react';
import { createHmac } from 'crypto';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShopeeConnectPage = () => {
  // Estado para armazenar os parâmetros da URL
  const [partnerId, setPartnerId] = useState('1279702'); // Partner ID de teste padrão
  const [partnerKey, setPartnerKey] = useState('71707a74654a474644465746576b515048717161415178526a7a534677484943'); // Chave de teste padrão
  const [redirectUrl, setRedirectUrl] = useState('https://cipshopee.replit.app');
  const [region, setRegion] = useState('BR');
  const [authUrl, setAuthUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('teste');

  // Quando mudar a aba, atualizar o Partner ID e Key
  useEffect(() => {
    if (currentTab === 'teste') {
      setPartnerId('1279702');
      setPartnerKey('71707a74654a474644465746576b515048717161415178526a7a534677484943');
    } else if (currentTab === 'producao') {
      setPartnerId('2011285');
      setPartnerKey('477a724873627457486972644a704f756948624776754646544170674a515a64');
    }
  }, [currentTab]);

  // Função para gerar a assinatura HMAC-SHA256 no lado do cliente
  const generateSignature = async (message: string, key: string) => {
    try {
      // No navegador, usar a Web Crypto API
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);
      const keyBuffer = encoder.encode(key);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        messageBuffer
      );
      
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Erro ao gerar assinatura:', error);
      return '';
    }
  };

  // Função para gerar a URL de autorização
  const generateAuthUrl = async () => {
    setLoading(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Formato base string para assinatura
      const baseString = `${partnerId}/api/v2/shop/auth_partner${timestamp}`;
      
      // Gerar assinatura
      const signature = await generateSignature(baseString, partnerKey);
      
      // Construir URL
      const url = `https://partner.shopeemobile.com/api/v2/shop/auth_partner?` +
        `partner_id=${partnerId}&` +
        `timestamp=${timestamp}&` +
        `sign=${signature}&` +
        `redirect=${encodeURIComponent(redirectUrl)}&` +
        `region=${region}&` +
        `state=cipshopee&` +
        `is_auth_shop=true&` +
        `login_type=seller`;
      
      setAuthUrl(url);
    } catch (error) {
      console.error('Erro ao gerar URL:', error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar o componente
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Conectar Loja Shopee</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configuração da Conexão Shopee</CardTitle>
          <CardDescription>
            Selecione o ambiente e ajuste as configurações para conectar sua loja Shopee.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teste">Ambiente de Teste</TabsTrigger>
              <TabsTrigger value="producao">Ambiente de Produção</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teste">
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  O ambiente de teste é utilizado para desenvolvimento e testes sem afetar dados reais.
                </p>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">Partner ID de Teste:</p>
                  <code className="bg-muted px-2 py-1 rounded">{partnerId}</code>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="producao">
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  O ambiente de produção conecta com lojas reais e afeta dados reais da Shopee.
                </p>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">Partner ID de Produção:</p>
                  <code className="bg-muted px-2 py-1 rounded">{partnerId}</code>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="redirect">URL de Redirecionamento</Label>
              <Input 
                id="redirect" 
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deve corresponder EXATAMENTE à URL configurada no console da Shopee
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="region">Região</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">Brasil (BR)</SelectItem>
                  <SelectItem value="SG">Singapura (SG)</SelectItem>
                  <SelectItem value="MY">Malásia (MY)</SelectItem>
                  <SelectItem value="TH">Tailândia (TH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={generateAuthUrl}
            disabled={loading}
          >
            {loading ? "Gerando..." : "Gerar URL de Autorização"}
          </Button>
        </CardFooter>
      </Card>
      
      {authUrl && (
        <Card>
          <CardHeader>
            <CardTitle>URL de Autorização Gerada</CardTitle>
            <CardDescription>
              Clique no botão abaixo para iniciar o processo de autorização.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="p-3 bg-muted rounded-md overflow-x-auto">
              <pre className="text-xs">{authUrl}</pre>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(authUrl)}
            >
              Copiar Link
            </Button>
            <Button 
              as="a" 
              href={authUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Conectar Loja Shopee
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="mt-8 border rounded-lg p-6 bg-slate-50">
        <h2 className="text-xl font-semibold mb-4">Informações Importantes</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Requisitos para Integração:</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>O aplicativo deve estar ativo no console de desenvolvedor da Shopee</li>
              <li>A URL de redirecionamento no console deve corresponder exatamente à usada aqui</li>
              <li>O Partner ID e Partner Key devem estar corretos</li>
              <li>O aplicativo deve ter as permissões necessárias configuradas</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium">Solução de Problemas:</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>invalid_partner_id</strong>: Verifique se o ID do parceiro está correto e ativo</li>
              <li><strong>invalid_signature</strong>: A assinatura não está sendo calculada corretamente</li>
              <li><strong>redirect_uri_mismatch</strong>: A URL de redirecionamento não corresponde à configurada</li>
              <li><strong>client_not_found</strong>: O aplicativo não está registrado ou ativo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopeeConnectPage;