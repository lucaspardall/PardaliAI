import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatPlanName, getInitials } from "@/lib/utils/formatters";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

export default function Profile() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // Fetch user's stores
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["/api/stores"],
  });
  
  // Fetch user's notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  // Fetch user's AI requests
  const { data: aiRequests, isLoading: aiRequestsLoading } = useQuery({
    queryKey: ["/api/ai-requests"],
    enabled: false, // Disable for MVP since this endpoint isn't implemented yet
  });
  
  // Mark notification as read
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string }) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  // Update photo mutation
  const updatePhotoMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      return apiRequest("PUT", "/api/profile-image", { profileImageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setPhotoModalOpen(false);
      setPhotoUrl('');
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a foto.",
        variant: "destructive",
      });
    },
  });

  // Get plan expiration message
  const getPlanExpirationMessage = () => {
    if (!user || !user.planExpiresAt || user.plan === 'free') return null;
    
    const expiresAt = new Date(user.planExpiresAt);
    const today = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return {
        message: "Seu plano expirou",
        variant: "destructive" as const
      };
    } else if (daysLeft <= 7) {
      return {
        message: `Seu plano expira em ${daysLeft} dias`,
        variant: "warning" as const
      };
    } else {
      return {
        message: `Plano ativo até ${formatDate(user.planExpiresAt)}`,
        variant: "outline" as const
      };
    }
  };
  
  const planExpiration = getPlanExpirationMessage();

  // Open edit modal and populate form
  const openEditModal = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setEditModalOpen(true);
  };

  // Handle form submission
  const handleUpdateProfile = () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(editForm);
  };

  // Handle photo update
  const handleUpdatePhoto = () => {
    if (!photoUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL da imagem é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    // Validar se é uma URL válida
    try {
      new URL(photoUrl);
    } catch {
      toast({
        title: "Erro",
        description: "URL da imagem inválida.",
        variant: "destructive",
      });
      return;
    }

    updatePhotoMutation.mutate(photoUrl);
  };

  // Remove photo
  const handleRemovePhoto = () => {
    updatePhotoMutation.mutate('');
  };

  if (userLoading) {
    return (
      <SidebarLayout title="Perfil">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Perfil">
      <Helmet>
        <title>Perfil | CIP Shopee</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais e configurações da conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  {user?.profileImageUrl ? (
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Overlay com botões ao passar o mouse */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setPhotoModalOpen(true)}
                      title="Alterar foto"
                    >
                      <i className="ri-camera-line text-sm"></i>
                    </Button>
                    {user?.profileImageUrl && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={handleRemovePhoto}
                        title="Remover foto"
                        disabled={updatePhotoMutation.isPending}
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl font-bold">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Usuário'}
                </h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center md:justify-start">
                  <Badge variant="outline">ID: {user?.id}</Badge>
                  <Badge variant="secondary">
                    Plano {formatPlanName(user?.plan || 'free')}
                  </Badge>
                  {planExpiration && (
                    <Badge variant={planExpiration.variant}>
                      {planExpiration.message}
                    </Badge>
                  )}
                </div>
                
                {/* Botão mobile para alterar foto */}
                <div className="md:hidden mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPhotoModalOpen(true)}
                  >
                    <i className="ri-camera-line mr-2"></i>
                    Alterar Foto
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-muted/40 p-4 rounded-lg">
                <h4 className="font-medium flex items-center text-sm mb-1">
                  <i className="ri-vip-crown-line mr-2 text-primary"></i>
                  Plano Atual
                </h4>
                <p className="text-2xl font-bold">
                  {formatPlanName(user?.plan || 'free')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.plan === 'free' 
                    ? 'Plano gratuito' 
                    : `Plano pago • ${user?.planStatus}`}
                </p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg">
                <h4 className="font-medium flex items-center text-sm mb-1">
                  <i className="ri-ai-generate mr-2 text-primary"></i>
                  Créditos de IA
                </h4>
                <p className="text-2xl font-bold">
                  {user?.plan !== 'free' ? 'Ilimitado' : user?.aiCreditsLeft}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.plan === 'free' 
                    ? 'Disponíveis para uso' 
                    : 'Otimizações ilimitadas no seu plano'}
                </p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg">
                <h4 className="font-medium flex items-center text-sm mb-1">
                  <i className="ri-store-2-line mr-2 text-primary"></i>
                  Lojas Conectadas
                </h4>
                <p className="text-2xl font-bold">
                  {storesLoading ? '...' : stores?.length || 0}/{user?.storeLimit || 1}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.plan === 'free' 
                    ? 'Limite do plano gratuito' 
                    : user?.plan === 'starter'
                    ? 'Limite do plano Starter'
                    : user?.plan === 'pro'
                    ? 'Limite do plano Pro'
                    : 'Limite do plano Enterprise'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={openEditModal}>
              <i className="ri-edit-line mr-2"></i>
              Editar Perfil
            </Button>
            
            <Button asChild variant="default">
              <a href="/dashboard/subscription">
                <i className="ri-upgrade-line mr-2"></i>
                {user?.plan === 'free' ? 'Fazer Upgrade' : 'Gerenciar Assinatura'}
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Activity Tabs */}
        <Tabs defaultValue="notifications">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex sm:space-x-2">
            <TabsTrigger value="notifications">
              Notificações
              {notifications && notifications.filter((n: any) => !n.isRead).length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  {notifications.filter((n: any) => !n.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="stores">
              Lojas
              {stores && (
                <Badge className="ml-2" variant="outline">
                  {stores.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">
              Atividade
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Suas notificações e alertas recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <i className="ri-notification-3-line text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-lg font-medium">Nenhuma notificação</p>
                    <p className="text-muted-foreground mt-1">
                      Você não possui notificações no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border ${notification.isRead ? 'bg-background' : 'bg-muted/30 border-primary/20'}`}
                      >
                        <div className="flex justify-between">
                          <div className="flex items-start">
                            <div className={`mt-0.5 mr-3 text-xl ${
                              notification.type === 'success' 
                                ? 'text-green-500' 
                                : notification.type === 'warning'
                                ? 'text-amber-500'
                                : notification.type === 'error'
                                ? 'text-red-500'
                                : 'text-blue-500'
                            }`}>
                              <i className={
                                notification.type === 'success' 
                                  ? 'ri-check-line' 
                                  : notification.type === 'warning'
                                  ? 'ri-alert-line'
                                  : notification.type === 'error'
                                  ? 'ri-error-warning-line'
                                  : 'ri-information-line'
                              }></i>
                            </div>
                            <div>
                              <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mt-1">
                                {notification.message}
                              </p>
                              <div className="text-xs text-muted-foreground mt-2">
                                {formatDate(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markNotificationReadMutation.mutate(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stores" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lojas Conectadas</CardTitle>
                <CardDescription>
                  Suas lojas Shopee conectadas ao CIP
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storesLoading ? (
                  <div className="space-y-4">
                    {Array(2).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : !stores || stores.length === 0 ? (
                  <div className="py-12 text-center">
                    <i className="ri-store-2-line text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-lg font-medium">Nenhuma loja conectada</p>
                    <p className="text-muted-foreground mt-1">
                      Você ainda não conectou nenhuma loja Shopee.
                    </p>
                    <Button asChild className="mt-4">
                      <a href="/dashboard/store/connect">Conectar Loja</a>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loja</TableHead>
                          <TableHead>ID da Loja</TableHead>
                          <TableHead>Região</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead>Conectada em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stores.map((store: any) => (
                          <TableRow key={store.id}>
                            <TableCell className="font-medium">{store.shopName}</TableCell>
                            <TableCell>{store.shopId}</TableCell>
                            <TableCell>{store.shopRegion}</TableCell>
                            <TableCell>
                              <Badge variant={store.isActive ? 'success' : 'secondary'}>
                                {store.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>{store.totalProducts}</TableCell>
                            <TableCell>{formatDate(store.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button asChild>
                  <a href="/dashboard/store/connect">
                    <i className="ri-add-line mr-2"></i>
                    {stores && stores.length > 0 ? 'Gerenciar Lojas' : 'Conectar Loja'}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atividades</CardTitle>
                <CardDescription>
                  Suas ações recentes na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiRequestsLoading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !aiRequests || aiRequests.length === 0 ? (
                  <div className="py-12 text-center">
                    <i className="ri-history-line text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-lg font-medium">Nenhuma atividade registrada</p>
                    <p className="text-muted-foreground mt-1">
                      Seu histórico de atividades aparecerá aqui.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Tempo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiRequests.map((request: any) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.type === 'product_optimization' 
                                ? 'Otimização de Produto' 
                                : request.type === 'product_creation'
                                ? 'Criação de Produto'
                                : 'Diagnóstico de Loja'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                request.status === 'completed' 
                                  ? 'success' 
                                  : request.status === 'failed'
                                  ? 'destructive'
                                  : request.status === 'processing'
                                  ? 'secondary'
                                  : 'outline'
                              }>
                                {request.status === 'completed' 
                                  ? 'Concluído' 
                                  : request.status === 'failed'
                                  ? 'Falhou'
                                  : request.status === 'processing'
                                  ? 'Processando'
                                  : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(request.createdAt)}</TableCell>
                            <TableCell>
                              {request.processingTime 
                                ? `${(request.processingTime / 1000).toFixed(1)}s` 
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Account Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <h4 className="font-medium text-destructive">Excluir Conta</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta ação excluirá permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" size="sm" className="mt-4" disabled>
                  Excluir minha conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Atualize suas informações pessoais aqui.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  Nome
                </Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="col-span-3"
                  placeholder="Seu nome"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Sobrenome
                </Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="col-span-3"
                  placeholder="Seu sobrenome"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditModalOpen(false)}
                disabled={updateProfileMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <i className="ri-loader-2-line animate-spin mr-2"></i>
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Update Modal */}
        <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Alterar Foto de Perfil</DialogTitle>
              <DialogDescription>
                Cole a URL de uma imagem para usar como foto de perfil.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="photoUrl">URL da Imagem</Label>
                <Input
                  id="photoUrl"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Use uma URL pública de uma imagem (JPG, PNG, GIF). Recomendamos imagens quadradas.
                </p>
              </div>
              
              {/* Preview da imagem */}
              {photoUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={photoUrl} 
                        alt="Preview"
                        onError={() => {
                          toast({
                            title: "Erro",
                            description: "Não foi possível carregar a imagem desta URL.",
                            variant: "destructive",
                          });
                        }}
                      />
                      <AvatarFallback>
                        <i className="ri-image-line text-2xl text-muted-foreground"></i>
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2">
                      <Badge variant="secondary" className="text-xs">
                        Preview
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">💡 Dicas para uma boa foto:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use uma imagem quadrada (1:1)</li>
                  <li>Tamanho recomendado: 400x400px ou maior</li>
                  <li>Certifique-se que a URL é pública</li>
                  <li>Formatos suportados: JPG, PNG, GIF</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPhotoModalOpen(false);
                  setPhotoUrl('');
                }}
                disabled={updatePhotoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdatePhoto}
                disabled={updatePhotoMutation.isPending || !photoUrl.trim()}
              >
                {updatePhotoMutation.isPending ? (
                  <>
                    <i className="ri-loader-2-line animate-spin mr-2"></i>
                    Salvando...
                  </>
                ) : (
                  'Salvar Foto'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
