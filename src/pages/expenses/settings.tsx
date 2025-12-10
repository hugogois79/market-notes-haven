import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, FolderKanban, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { expenseRequesterService, ExpenseRequester } from "@/services/expenseRequesterService";
import { expenseUserService, ExpenseUser } from "@/services/expenseUserService";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ExpenseSettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Requester state
  const [showRequesterDialog, setShowRequesterDialog] = useState(false);
  const [editingRequester, setEditingRequester] = useState<ExpenseRequester | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterSelectedProjectIds, setRequesterSelectedProjectIds] = useState<string[]>([]);
  const [openRequesterProjectSelect, setOpenRequesterProjectSelect] = useState(false);
  
  // User state
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ExpenseUser | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userSelectedProjectIds, setUserSelectedProjectIds] = useState<string[]>([]);
  const [openUserProjectSelect, setOpenUserProjectSelect] = useState(false);

  const { data: requesters = [], isLoading: loadingRequesters } = useQuery({
    queryKey: ["expense-requesters"],
    queryFn: () => expenseRequesterService.getRequesters(true),
  });

  const { data: expenseUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["expense-users"],
    queryFn: () => expenseUserService.getUsers(true),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Requester mutations
  const createRequesterMutation = useMutation({
    mutationFn: expenseRequesterService.createRequester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante criado",
        description: "O requisitante foi criado com sucesso.",
      });
      handleCloseRequesterDialog();
    },
  });

  const updateRequesterMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ExpenseRequester> }) =>
      expenseRequesterService.updateRequester(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante atualizado",
        description: "O requisitante foi atualizado com sucesso.",
      });
      handleCloseRequesterDialog();
    },
  });

  const deleteRequesterMutation = useMutation({
    mutationFn: expenseRequesterService.deleteRequester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante removido",
        description: "O requisitante foi removido com sucesso.",
      });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: expenseUserService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-users"] });
      toast({
        title: "Utilizador criado",
        description: "O utilizador foi criado com sucesso.",
      });
      handleCloseUserDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar utilizador.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ExpenseUser> }) =>
      expenseUserService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-users"] });
      toast({
        title: "Utilizador atualizado",
        description: "O utilizador foi atualizado com sucesso.",
      });
      handleCloseUserDialog();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: expenseUserService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-users"] });
      toast({
        title: "Utilizador removido",
        description: "O utilizador foi removido com sucesso.",
      });
    },
  });

  // Requester handlers
  const handleCloseRequesterDialog = () => {
    setShowRequesterDialog(false);
    setEditingRequester(null);
    setRequesterName("");
    setRequesterEmail("");
    setRequesterSelectedProjectIds([]);
  };

  const handleEditRequester = (requester: ExpenseRequester) => {
    setEditingRequester(requester);
    setRequesterName(requester.name);
    setRequesterEmail(requester.email || "");
    setRequesterSelectedProjectIds(requester.assigned_project_ids || []);
    setShowRequesterDialog(true);
  };

  const handleSubmitRequester = () => {
    if (!requesterName.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingRequester) {
      updateRequesterMutation.mutate({
        id: editingRequester.id,
        updates: { name: requesterName, email: requesterEmail || null, assigned_project_ids: requesterSelectedProjectIds },
      });
    } else {
      createRequesterMutation.mutate({ name: requesterName, email: requesterEmail || null, assigned_project_ids: requesterSelectedProjectIds });
    }
  };

  const handleToggleRequesterActive = (requester: ExpenseRequester) => {
    updateRequesterMutation.mutate({
      id: requester.id,
      updates: { is_active: !requester.is_active },
    });
  };

  // User handlers
  const handleCloseUserDialog = () => {
    setShowUserDialog(false);
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserSelectedProjectIds([]);
  };

  const handleEditUser = (user: ExpenseUser) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email || "");
    setUserSelectedProjectIds(user.assigned_project_ids || []);
    setShowUserDialog(true);
  };

  const handleSubmitUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast({
        title: "Erro",
        description: "O nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        updates: { name: userName, email: userEmail || null, assigned_project_ids: userSelectedProjectIds },
      });
    } else {
      if (!userPassword.trim()) {
        toast({
          title: "Erro",
          description: "A password é obrigatória para novos utilizadores.",
          variant: "destructive",
        });
        return;
      }
      
      createUserMutation.mutate({ 
        name: userName, 
        email: userEmail, 
        password: userPassword,
        assigned_project_ids: userSelectedProjectIds 
      });
    }
  };

  const handleToggleUserActive = (user: ExpenseUser) => {
    updateUserMutation.mutate({
      id: user.id,
      updates: { is_active: !user.is_active },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Definições de Despesas</h1>
          <p className="text-muted-foreground mt-1">
            Gerir requisitantes e utilizadores de despesas
          </p>
        </div>
      </div>

      <Tabs defaultValue="requesters" className="w-full">
        <TabsList>
          <TabsTrigger value="requesters">
            <Users className="h-4 w-4 mr-2" />
            Requisitantes
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilizadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requesters" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Requisitantes</CardTitle>
                <Button onClick={() => setShowRequesterDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Requisitante
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRequesters ? (
                <div className="text-center py-8">Carregando...</div>
              ) : requesters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum requisitante cadastrado. Clique em "Adicionar Requisitante" para começar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Projectos Assignados</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requesters.map((requester) => {
                      const assignedProjects = projects.filter(p => 
                        requester.assigned_project_ids?.includes(p.id)
                      );
                      
                      return (
                        <TableRow key={requester.id}>
                          <TableCell className="font-medium">{requester.name}</TableCell>
                          <TableCell>{requester.email || "-"}</TableCell>
                          <TableCell>
                            {assignedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedProjects.map(project => (
                                  <Badge key={project.id} variant="secondary" className="text-xs">
                                    <FolderKanban className="h-3 w-3 mr-1" />
                                    {project.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={requester.is_active}
                                onCheckedChange={() => handleToggleRequesterActive(requester)}
                              />
                              <span className="text-sm">
                                {requester.is_active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRequester(requester)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja remover este requisitante?")) {
                                    deleteRequesterMutation.mutate(requester.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Utilizadores</CardTitle>
                <Button onClick={() => setShowUserDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Utilizador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">Carregando...</div>
              ) : expenseUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum utilizador cadastrado. Clique em "Adicionar Utilizador" para começar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Projectos Assignados</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseUsers.map((user) => {
                      const assignedProjects = projects.filter(p => 
                        user.assigned_project_ids?.includes(p.id)
                      );
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email || "-"}</TableCell>
                          <TableCell>
                            {assignedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedProjects.map(project => (
                                  <Badge key={project.id} variant="secondary" className="text-xs">
                                    <FolderKanban className="h-3 w-3 mr-1" />
                                    {project.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.is_active}
                                onCheckedChange={() => handleToggleUserActive(user)}
                              />
                              <span className="text-sm">
                                {user.is_active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUser(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja remover este utilizador?")) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Requester Dialog */}
      <Dialog open={showRequesterDialog} onOpenChange={handleCloseRequesterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequester ? "Editar Requisitante" : "Adicionar Requisitante"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="requesterName">Nome *</Label>
              <Input
                id="requesterName"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Nome do requisitante"
              />
            </div>
            <div>
              <Label htmlFor="requesterEmail">Email (opcional)</Label>
              <Input
                id="requesterEmail"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Projectos Assignados</Label>
              <Popover open={openRequesterProjectSelect} onOpenChange={setOpenRequesterProjectSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    {requesterSelectedProjectIds.length === 0
                      ? "Selecionar projectos..."
                      : `${requesterSelectedProjectIds.length} projeto(s) selecionado(s)`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar projecto..." />
                    <CommandEmpty>Nenhum projecto encontrado.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {projects.map((project) => {
                          const isSelected = requesterSelectedProjectIds.includes(project.id);
                          return (
                            <CommandItem
                              key={project.id}
                              onSelect={() => {
                                if (isSelected) {
                                  setRequesterSelectedProjectIds(
                                    requesterSelectedProjectIds.filter((id) => id !== project.id)
                                  );
                                } else {
                                  setRequesterSelectedProjectIds([...requesterSelectedProjectIds, project.id]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {project.name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {requesterSelectedProjectIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {projects
                    .filter((p) => requesterSelectedProjectIds.includes(p.id))
                    .map((project) => (
                      <Badge
                        key={project.id}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() =>
                          setRequesterSelectedProjectIds(
                            requesterSelectedProjectIds.filter((id) => id !== project.id)
                          )
                        }
                      >
                        {project.name} ×
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRequesterDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitRequester}>
              {editingRequester ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={handleCloseUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Utilizador" : "Adicionar Utilizador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userName">Nome *</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nome do utilizador"
              />
            </div>
            <div>
              <Label htmlFor="userEmail">Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            {!editingUser && (
              <div>
                <Label htmlFor="userPassword">Password *</Label>
                <Input
                  id="userPassword"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Password inicial"
                />
              </div>
            )}
            <div>
              <Label>Projectos Assignados</Label>
              <Popover open={openUserProjectSelect} onOpenChange={setOpenUserProjectSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    {userSelectedProjectIds.length === 0
                      ? "Selecionar projectos..."
                      : `${userSelectedProjectIds.length} projeto(s) selecionado(s)`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar projecto..." />
                    <CommandEmpty>Nenhum projecto encontrado.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {projects.map((project) => {
                          const isSelected = userSelectedProjectIds.includes(project.id);
                          return (
                            <CommandItem
                              key={project.id}
                              onSelect={() => {
                                if (isSelected) {
                                  setUserSelectedProjectIds(
                                    userSelectedProjectIds.filter((id) => id !== project.id)
                                  );
                                } else {
                                  setUserSelectedProjectIds([...userSelectedProjectIds, project.id]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {project.name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {userSelectedProjectIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {projects
                    .filter((p) => userSelectedProjectIds.includes(p.id))
                    .map((project) => (
                      <Badge
                        key={project.id}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() =>
                          setUserSelectedProjectIds(
                            userSelectedProjectIds.filter((id) => id !== project.id)
                          )
                        }
                      >
                        {project.name} ×
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUserDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitUser}>
              {editingUser ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseSettingsPage;
