import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  FolderKanban, 
  TrendingUp, 
  Calendar, 
  Euro,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ProjectFormDialog from "./components/ProjectFormDialog";

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  total_cost: number | null;
  is_active: boolean;
  created_at: string;
}

const ProjectsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ExpenseProject | null>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ExpenseProject[];
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.is_active);
    const totalSpent = projects.reduce((sum, p) => sum + (p.total_cost || 0), 0);
    const avgPerProject = projects.length > 0 ? totalSpent / projects.length : 0;
    
    return {
      total: projects.length,
      active: activeProjects.length,
      totalSpent,
      avgPerProject,
    };
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && project.is_active) ||
        (statusFilter === "inactive" && !project.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este projeto?")) return;
    
    const { error } = await supabase
      .from("expense_projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast.error("Erro ao eliminar projeto");
      return;
    }

    toast.success("Projeto eliminado com sucesso");
    refetch();
  };

  const handleEdit = (project: ExpenseProject) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: pt });
  };

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-primary" />
              Projetos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão e métricas dos projetos
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus size={18} />
            Novo Projeto
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{metrics.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projetos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{metrics.active}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Média por Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{formatCurrency(metrics.avgPerProject)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de pesquisa" 
                  : "Comece criando o seu primeiro projeto"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus size={18} className="mr-2" />
                  Criar Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="group hover:shadow-lg transition-all duration-200 border-l-4"
                style={{ borderLeftColor: project.color || "#3878B5" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color || "#3878B5" }}
                      />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(project)}>
                          <Edit size={14} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant={project.is_active ? "default" : "secondary"}>
                        {project.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(project.start_date)}</span>
                      </div>
                      {project.end_date && (
                        <>
                          <span>→</span>
                          <span>{formatDate(project.end_date)}</span>
                        </>
                      )}
                    </div>

                    {/* Total Cost */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Gasto</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(project.total_cost || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <ProjectFormDialog
          open={isFormOpen}
          onOpenChange={handleFormClose}
          project={editingProject}
          onSuccess={() => {
            handleFormClose();
            refetch();
          }}
        />
      </div>
    </div>
  );
};

export default ProjectsPage;
