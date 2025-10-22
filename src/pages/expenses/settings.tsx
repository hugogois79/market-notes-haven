import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
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
import { financialProjectService, FinancialProject } from "@/services/financialProjectService";
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

const ExpenseSettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRequester, setEditingRequester] = useState<ExpenseRequester | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [openProjectSelect, setOpenProjectSelect] = useState(false);

  const { data: requesters = [], isLoading } = useQuery({
    queryKey: ["expense-requesters"],
    queryFn: () => expenseRequesterService.getRequesters(true),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["financial-projects"],
    queryFn: () => financialProjectService.getProjects(),
  });

  const createMutation = useMutation({
    mutationFn: expenseRequesterService.createRequester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante criado",
        description: "O requisitante foi criado com sucesso.",
      });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ExpenseRequester> }) =>
      expenseRequesterService.updateRequester(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante atualizado",
        description: "O requisitante foi atualizado com sucesso.",
      });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expenseRequesterService.deleteRequester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requesters"] });
      toast({
        title: "Requisitante removido",
        description: "O requisitante foi removido com sucesso.",
      });
    },
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRequester(null);
    setName("");
    setEmail("");
    setSelectedProjectIds([]);
  };

  const handleEdit = (requester: ExpenseRequester) => {
    setEditingRequester(requester);
    setName(requester.name);
    setEmail(requester.email || "");
    setSelectedProjectIds(requester.assigned_project_ids || []);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingRequester) {
      updateMutation.mutate({
        id: editingRequester.id,
        updates: { name, email: email || null, assigned_project_ids: selectedProjectIds },
      });
    } else {
      createMutation.mutate({ name, email: email || null, assigned_project_ids: selectedProjectIds });
    }
  };

  const handleToggleActive = (requester: ExpenseRequester) => {
    updateMutation.mutate({
      id: requester.id,
      updates: { is_active: !requester.is_active },
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
            Gerir requisitantes de despesas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Requisitantes</CardTitle>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Requisitante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                          onCheckedChange={() => handleToggleActive(requester)}
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
                          onClick={() => handleEdit(requester)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este requisitante?")) {
                              deleteMutation.mutate(requester.id);
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

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequester ? "Editar Requisitante" : "Adicionar Requisitante"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do requisitante"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Projectos Assignados</Label>
              <Popover open={openProjectSelect} onOpenChange={setOpenProjectSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start"
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    {selectedProjectIds.length === 0
                      ? "Selecionar projectos..."
                      : `${selectedProjectIds.length} projeto(s) selecionado(s)`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Procurar projecto..." />
                    <CommandEmpty>Nenhum projecto encontrado.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {projects.map((project) => {
                          const isSelected = selectedProjectIds.includes(project.id);
                          return (
                            <CommandItem
                              key={project.id}
                              onSelect={() => {
                                if (isSelected) {
                                  setSelectedProjectIds(
                                    selectedProjectIds.filter((id) => id !== project.id)
                                  );
                                } else {
                                  setSelectedProjectIds([...selectedProjectIds, project.id]);
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
              {selectedProjectIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {projects
                    .filter((p) => selectedProjectIds.includes(p.id))
                    .map((project) => (
                      <Badge
                        key={project.id}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() =>
                          setSelectedProjectIds(
                            selectedProjectIds.filter((id) => id !== project.id)
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
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingRequester ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseSettingsPage;
