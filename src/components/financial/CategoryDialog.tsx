import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategory | null;
  projects: ExpenseProject[];
}

const colorOptions = [
  { value: "#3878B5", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

export default function CategoryDialog({
  open,
  onOpenChange,
  category,
  projects,
}: CategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3878B5",
    is_active: true,
    category_type: "expense" as string,
    assigned_project_ids: [] as string[],
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color || "#3878B5",
        is_active: category.is_active ?? true,
        category_type: category.category_type || "expense",
        assigned_project_ids: category.assigned_project_ids || [],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3878B5",
        is_active: true,
        category_type: "expense",
        assigned_project_ids: [],
      });
    }
  }, [category, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (category) {
        const { error } = await supabase
          .from("expense_categories")
          .update({
            name: data.name,
            description: data.description || null,
            color: data.color,
            is_active: data.is_active,
            category_type: data.category_type,
            assigned_project_ids: data.assigned_project_ids,
          })
          .eq("id", category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("expense_categories")
          .insert({
            name: data.name,
            description: data.description || null,
            color: data.color,
            is_active: data.is_active,
            category_type: data.category_type,
            user_id: userData.user?.id,
            assigned_project_ids: data.assigned_project_ids,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      toast.success(category ? "Category updated" : "Category created");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    mutation.mutate(formData);
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_project_ids: prev.assigned_project_ids.includes(projectId)
        ? prev.assigned_project_ids.filter(id => id !== projectId)
        : [...prev.assigned_project_ids, projectId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    formData.color === color.value 
                      ? "border-foreground scale-110" 
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_type">Tipo de Categoria</Label>
            <Select
              value={formData.category_type}
              onValueChange={(value) => setFormData({ ...formData, category_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned Projects</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects available</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={formData.assigned_project_ids.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <Label 
                      htmlFor={`project-${project.id}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {project.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
