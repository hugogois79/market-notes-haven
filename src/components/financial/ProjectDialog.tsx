import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  project?: any;
}

export default function ProjectDialog({
  open,
  onOpenChange,
  companyId,
  project,
}: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (open && !project) {
      reset({
        name: '',
        client_name: '',
        description: '',
        budget: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
      });
      setSelectedCompanies([]);
    } else if (project) {
      reset(project);
      setSelectedCompanies(project.associated_companies || []);
    }
  }, [open, project, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const projectData = {
        ...data,
        company_id: companyId,
        budget: data.budget ? Number(data.budget) : null,
        end_date: data.end_date || null,
        associated_companies: selectedCompanies,
      };

      if (project) {
        const { error } = await supabase
          .from("financial_projects")
          .update(projectData)
          .eq("id", project.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_projects")
          .insert(projectData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-projects", companyId] });
      toast.success(project ? "Projeto atualizado" : "Projeto criado");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Nome do Projeto *</Label>
            <Input {...register("name", { required: true })} />
          </div>

          <div>
            <Label>Cliente</Label>
            <Input {...register("client_name")} placeholder="Nome do cliente" />
          </div>

          <div>
            <Label>Empresas Associadas</Label>
            <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
              {companies?.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company.id}`}
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCompanies([...selectedCompanies, company.id]);
                      } else {
                        setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`company-${company.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {company.name}
                  </label>
                </div>
              ))}
              {(!companies || companies.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
              )}
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea {...register("description")} rows={3} />
          </div>

          <div>
            <Label>Orçamento (€)</Label>
            <Input type="number" step="0.01" {...register("budget")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Input type="date" {...register("start_date", { required: true })} />
            </div>

            <div>
              <Label>Data de Fim</Label>
              <Input type="date" {...register("end_date")} />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select onValueChange={(value) => setValue("status", value)} defaultValue={watch("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="on_hold">Em Pausa</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
