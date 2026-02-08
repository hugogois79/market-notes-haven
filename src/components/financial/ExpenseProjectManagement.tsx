import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, FolderKanban, Search, FileText, FolderOpen, HardDrive, FolderSearch } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectCashflowDialog from "./ProjectCashflowDialog";
import FolderBrowser from "@/components/ui/FolderBrowser";

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
  folder_path: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectStorageLocation {
  id: string;
  project_id: string;
  folder_path: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function ExpenseProjectManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ExpenseProject | null>(null);
  const [cashflowProject, setCashflowProject] = useState<ExpenseProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Storage locations state
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [storageForm, setStorageForm] = useState({
    project_id: "",
    folder_path: "",
    description: "",
  });
  const [folderBrowserOpen, setFolderBrowserOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Fetch notes count per project
  const { data: notesCounts } = useQuery({
    queryKey: ["notes-count-by-project"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("project_id")
        .not("project_id", "is", null);
      
      if (error) throw error;
      
      // Count notes per project
      const counts: Record<string, number> = {};
      data?.forEach((note) => {
        if (note.project_id) {
          counts[note.project_id] = (counts[note.project_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Fetch project storage locations
  const { data: storageLocations, isLoading: storageLoading } = useQuery({
    queryKey: ["project-storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_storage_locations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ProjectStorageLocation[];
    },
  });

  // Storage location mutations
  const createStorageMutation = useMutation({
    mutationFn: async (data: typeof storageForm) => {
      const { error } = await supabase
        .from("project_storage_locations")
        .insert({
          project_id: data.project_id,
          folder_path: data.folder_path,
          description: data.description || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-storage-locations"] });
      toast.success("Localização adicionada com sucesso");
      handleCloseStorageDialog();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar localização: " + error.message);
    },
  });

  const updateStorageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof storageForm }) => {
      const { error } = await supabase
        .from("project_storage_locations")
        .update({
          project_id: data.project_id,
          folder_path: data.folder_path,
          description: data.description || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-storage-locations"] });
      toast.success("Localização actualizada com sucesso");
      handleCloseStorageDialog();
    },
    onError: (error) => {
      toast.error("Erro ao actualizar localização: " + error.message);
    },
  });

  const deleteStorageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_storage_locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-storage-locations"] });
      toast.success("Localização eliminada");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar localização: " + error.message);
    },
  });

  const handleCloseStorageDialog = () => {
    setStorageDialogOpen(false);
    setEditingStorageId(null);
    setStorageForm({ project_id: "", folder_path: "", description: "" });
  };

  const handleOpenCreateStorage = () => {
    setStorageForm({ project_id: "", folder_path: "", description: "" });
    setEditingStorageId(null);
    setStorageDialogOpen(true);
  };

  const handleOpenEditStorage = (location: ProjectStorageLocation) => {
    setStorageForm({
      project_id: location.project_id,
      folder_path: location.folder_path,
      description: location.description || "",
    });
    setEditingStorageId(location.id);
    setStorageDialogOpen(true);
  };

  const handleSubmitStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageForm.project_id) {
      toast.error("Seleccione um projecto");
      return;
    }
    if (!storageForm.folder_path.trim()) {
      toast.error("Caminho da pasta é obrigatório");
      return;
    }
    if (editingStorageId) {
      updateStorageMutation.mutate({ id: editingStorageId, data: storageForm });
    } else {
      createStorageMutation.mutate(storageForm);
    }
  };

  // Projects that don't have a storage location yet (for the "add" dropdown)
  const projectsWithoutStorage = useMemo(() => {
    if (!projects || !storageLocations) return projects || [];
    const usedIds = new Set(storageLocations.map((s) => s.project_id));
    // When editing, include the current project
    if (editingStorageId) {
      const editingLoc = storageLocations.find((s) => s.id === editingStorageId);
      if (editingLoc) usedIds.delete(editingLoc.project_id);
    }
    return projects.filter((p) => !usedIds.has(p.id));
  }, [projects, storageLocations, editingStorageId]);

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

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerir projetos para atribuição</p>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="bg-transparent border-b border-slate-200 rounded-none h-auto p-0 w-full justify-start">
          <TabsTrigger
            value="projects"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2"
          >
            <FolderKanban className="h-4 w-4 mr-2" />
            Projetos
          </TabsTrigger>
          <TabsTrigger
            value="storage"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 pt-2"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Pastas no Servidor
          </TabsTrigger>
        </TabsList>

        {/* === TAB: Projetos === */}
        <TabsContent value="projects" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {searchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto registado"}
              </div>
            ) : (
              filteredProjects.map((project) => (
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
                    <div className="flex items-center gap-4 mt-2">
                      {project.start_date && (
                        <p className="text-xs text-muted-foreground">
                          Início: {formatDate(project.start_date)}
                          {project.end_date && ` • Fim: ${formatDate(project.end_date)}`}
                        </p>
                      )}
                      {(notesCounts?.[project.id] ?? 0) > 0 && (
                        <div 
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/notes?project=${project.id}`);
                          }}
                          title="Ver notas deste projeto"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{notesCounts[project.id]} {notesCounts[project.id] === 1 ? 'nota' : 'notas'}</span>
                        </div>
                      )}
                    </div>
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
        </TabsContent>

        {/* === TAB: Pastas no Servidor === */}
        <TabsContent value="storage" className="mt-6">
          <div className="border border-slate-200 rounded-lg bg-white p-6 w-full">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-800">Pastas no Servidor</h3>
              </div>
              <Button 
                size="sm" 
                onClick={handleOpenCreateStorage}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Pasta
              </Button>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Associe cada projecto ao caminho da pasta correspondente neste servidor.
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-medium text-slate-600">Projecto</TableHead>
                    <TableHead className="text-xs font-medium text-slate-600">Caminho da Pasta</TableHead>
                    <TableHead className="text-xs font-medium text-slate-600">Descrição</TableHead>
                    <TableHead className="text-xs font-medium text-slate-600 w-20">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                        A carregar localizações...
                      </TableCell>
                    </TableRow>
                  ) : !storageLocations || storageLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                        Nenhuma pasta configurada. Clique em "Adicionar Pasta" para criar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    storageLocations.map((location) => {
                      const project = projects?.find((p) => p.id === location.project_id);
                      return (
                        <TableRow key={location.id}>
                          <TableCell className="text-sm font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              {project?.color && (
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                              )}
                              <span>{project?.name || "Desconhecido"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 font-mono">
                            <div className="flex items-center gap-1.5">
                              <FolderOpen className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              {location.folder_path}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{location.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleOpenEditStorage(location)}
                              >
                                <Edit className="h-3.5 w-3.5 text-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Eliminar esta localização?")) {
                                    deleteStorageMutation.mutate(location.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Criar/Editar Projeto */}
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

      {/* Dialog: Adicionar/Editar Pasta no Servidor */}
      <Dialog open={storageDialogOpen} onOpenChange={(open) => !open && handleCloseStorageDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStorageId ? "Editar Localização" : "Adicionar Pasta"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitStorage} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Projecto *</Label>
              <Select
                value={storageForm.project_id}
                onValueChange={(value) => setStorageForm({ ...storageForm, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione um projecto" />
                </SelectTrigger>
                <SelectContent>
                  {(editingStorageId ? projects : projectsWithoutStorage)?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Caminho da Pasta *</Label>
              <div className="flex gap-2">
                <Input
                  value={storageForm.folder_path}
                  onChange={(e) => setStorageForm({ ...storageForm, folder_path: e.target.value })}
                  placeholder="ex: /root/Robsonway-Research/PROJECTS/1. PedroCosta"
                  className="font-mono text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-10"
                  onClick={() => setFolderBrowserOpen(true)}
                >
                  <FolderSearch className="h-4 w-4 mr-1" />
                  Procurar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Caminho absoluto da pasta neste servidor</p>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={storageForm.description}
                onChange={(e) => setStorageForm({ ...storageForm, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseStorageDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createStorageMutation.isPending || updateStorageMutation.isPending}
              >
                {editingStorageId ? "Guardar" : "Adicionar"}
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

      <FolderBrowser
        open={folderBrowserOpen}
        onOpenChange={setFolderBrowserOpen}
        onSelect={(path) => setStorageForm({ ...storageForm, folder_path: path })}
        initialPath={storageForm.folder_path || "/root/Robsonway-Research"}
      />
    </div>
  );
}
