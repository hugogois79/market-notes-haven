import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ProjectDialog from "./ProjectDialog";

interface ProjectManagementProps {
  companyId: string;
}

export default function ProjectManagement({ companyId }: ProjectManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["financial-projects", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_projects")
        .select("*")
        .eq("company_id", companyId)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_projects")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-projects", companyId] });
      toast.success("Projeto eliminado");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
      on_hold: "outline",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      completed: "Concluído",
      cancelled: "Cancelado",
      on_hold: "Em Pausa",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerir projetos da empresa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="truncate">{project.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProject(project);
                      setDialogOpen(true);
                    }}
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
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.client_name && (
                <div className="text-sm">
                  <span className="font-medium">Cliente:</span> {project.client_name}
                </div>
              )}
              {project.budget && (
                <div className="text-sm">
                  <span className="font-medium">Orçamento:</span> {formatCurrency(Number(project.budget))}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Início:</span>{" "}
                {new Date(project.start_date).toLocaleDateString("pt-PT")}
              </div>
              {project.end_date && (
                <div className="text-sm">
                  <span className="font-medium">Fim:</span>{" "}
                  {new Date(project.end_date).toLocaleDateString("pt-PT")}
                </div>
              )}
              <div>{getStatusBadge(project.status)}</div>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        companyId={companyId}
        project={editingProject}
      />
    </div>
  );
}
