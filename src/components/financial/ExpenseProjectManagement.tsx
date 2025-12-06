import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ExpenseProjectManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ExpenseProject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3878B5",
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as ExpenseProject[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("expense_projects")
        .insert({
          name: data.name,
          description: data.description || null,
          color: data.color,
          is_active: data.is_active,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-projects"] });
      toast.success("Projeto criado com sucesso");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("expense_projects")
        .update({
          name: data.name,
          description: data.description || null,
          color: data.color,
          is_active: data.is_active,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-projects"] });
      toast.success("Projeto atualizado com sucesso");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar projeto: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_projects")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-projects"] });
      toast.success("Projeto eliminado");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar projeto: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      color: "#3878B5",
      is_active: true,
    });
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3878B5",
      is_active: true,
    });
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (project: ExpenseProject) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      color: project.color,
      is_active: project.is_active,
    });
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerir projetos para atribuição</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  A carregar...
                </TableCell>
              </TableRow>
            ) : projects?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum projeto registado
                </TableCell>
              </TableRow>
            ) : (
              projects?.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-xs text-muted-foreground">{project.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.is_active ? "default" : "secondary"}>
                      {project.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Eliminar projeto?")) {
                            deleteMutation.mutate(project.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Editar Projeto" : "Novo Projeto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do projeto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3878B5"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProject ? "Guardar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
