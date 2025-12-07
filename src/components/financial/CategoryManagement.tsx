import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Edit, Trash2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import CategoryDialog from "./CategoryDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon_name: string | null;
  is_active: boolean | null;
  user_id: string | null;
  assigned_project_ids?: string[];
  category_type?: string;
}

interface ExpenseProject {
  id: string;
  name: string;
}

export default function CategoryManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["expense_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as ExpenseProject[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const getProjectNames = (projectIds: string[] | undefined) => {
    if (!projectIds || projectIds.length === 0 || !projects) return [];
    return projects.filter(p => projectIds.includes(p.id)).map(p => p.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground">Manage expense categories and assign them to projects</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color || '#3878B5' }}
                  >
                    <Tag className="h-3 w-3 text-white" />
                  </div>
                  {category.name}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCategory(category);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete category?")) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.description && (
                <div className="text-sm text-muted-foreground">
                  {category.description}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Status:</span>
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className={
                  category.category_type === 'revenue' ? 'border-green-500 text-green-600' :
                  category.category_type === 'both' ? 'border-purple-500 text-purple-600' :
                  'border-red-500 text-red-600'
                }>
                  {category.category_type === 'revenue' ? 'Receita' :
                   category.category_type === 'both' ? 'Ambos' : 'Despesa'}
                </Badge>
              </div>
              {category.assigned_project_ids && category.assigned_project_ids.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <FolderKanban className="h-4 w-4" />
                    Projects:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getProjectNames(category.assigned_project_ids).map((name, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!category.assigned_project_ids || category.assigned_project_ids.length === 0) && (
                <div className="text-sm text-muted-foreground italic">
                  No projects assigned
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        projects={projects || []}
      />
    </div>
  );
}
