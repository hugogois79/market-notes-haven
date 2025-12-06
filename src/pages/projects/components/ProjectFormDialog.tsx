import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  total_cost: number | null;
  is_active: boolean;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ExpenseProject | null;
  onSuccess: () => void;
}

const COLORS = [
  "#3878B5", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

const ProjectFormDialog = ({ 
  open, 
  onOpenChange, 
  project, 
  onSuccess 
}: ProjectFormDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color || COLORS[0]);
      setStartDate(project.start_date || "");
      setEndDate(project.end_date || "");
      setIsActive(project.is_active);
    } else {
      resetForm();
    }
  }, [project, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setStartDate("");
    setEndDate("");
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("O nome do projeto é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: isActive,
      };

      if (project) {
        // Update existing project
        const { error } = await supabase
          .from("expense_projects")
          .update(projectData)
          .eq("id", project.id);

        if (error) throw error;
        toast.success("Projeto atualizado com sucesso");
      } else {
        // Create new project
        const { error } = await supabase
          .from("expense_projects")
          .insert(projectData);

        if (error) throw error;
        toast.success("Projeto criado com sucesso");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Erro ao guardar projeto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do projeto"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do projeto"
              rows={3}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c 
                      ? "ring-2 ring-offset-2 ring-primary scale-110" 
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Projeto Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Projetos inativos não aparecem nas seleções
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar..." : project ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
