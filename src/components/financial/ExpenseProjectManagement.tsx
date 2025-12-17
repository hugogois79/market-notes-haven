import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCashflowDialog from "./ProjectCashflowDialog";

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  total_cost: number | null;
  has_revenue: boolean;
  created_at: string;
  updated_at: string;
}

export default function ExpenseProjectManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ExpenseProject | null>(null);
  const [cashflowProject, setCashflowProject] = useState<ExpenseProject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3878B5",
    is_active: true,
    has_revenue: false,
    start_date: "",
    end_date: "",
    total_cost: "",
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
          has_revenue: data.has_revenue,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          total_cost: data.total_cost ? parseFloat(data.total_cost) : null,
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
          has_revenue: data.has_revenue,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          total_cost: data.total_cost ? parseFloat(data.total_cost) : null,
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
      has_revenue: false,
      start_date: "",
      end_date: "",
      total_cost: "",
    });
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3878B5",
      is_active: true,
      has_revenue: false,
      start_date: "",
      end_date: "",
      total_cost: "",
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
      has_revenue: project.has_revenue ?? false,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      total_cost: project.total_cost?.toString() || "",
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerir projetos para atribuição</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))
        ) : projects?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum projeto registado
          </div>
        ) : (
          projects?.map((project) => (
            <Card 
              key={project.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setCashflowProject(project)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FolderKanban 
                      className="w-5 h-5" 
                      style={{ color: project.color }}
                    />
                    <span 
                      className="px-2 py-0.5 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.name}
                    </span>
                  </div>
                  <Badge variant={project.is_active ? "default" : "secondary"}>
                    {project.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {project.total_cost !== null ? formatCurrency(project.total_cost) : "Sem custo definido"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || `Gerir despesas do projeto ${project.name}`}
                </p>
                {project.start_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Início: {formatDate(project.start_date)}
                    {project.end_date && ` • Fim: ${formatDate(project.end_date)}`}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4 pb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(project);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Eliminar projeto?")) {
                      deleteMutation.mutate(project.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data Fim</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_cost">Custo Total (€)</Label>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                value={formData.total_cost}
                onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                placeholder="0.00"
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="has_revenue"
                  checked={formData.has_revenue}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_revenue: checked })}
                />
                <Label htmlFor="has_revenue">Gera Receita</Label>
              </div>
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

      <ProjectCashflowDialog
        open={!!cashflowProject}
        onOpenChange={(open) => !open && setCashflowProject(null)}
        project={cashflowProject}
      />
    </div>
  );
}
