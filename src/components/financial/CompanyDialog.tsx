import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { useEffect } from "react";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: any;
}

export default function CompanyDialog({
  open,
  onOpenChange,
  company,
}: CompanyDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (company) {
      reset(company);
    } else {
      reset({});
    }
  }, [company, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const companyData = {
        ...data,
        owner_id: user?.id,
      };

      if (company) {
        const { data: result, error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", company.id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from("companies")
          .insert(companyData)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(company ? "Empresa atualizada com sucesso" : "Empresa criada com sucesso");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      console.error("Erro ao guardar empresa:", error);
      console.error("Código do erro:", error.code);
      console.error("Detalhes do erro:", error.details);
      
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.message?.includes("tax_id") || error.detail?.includes("tax_id")) {
          toast.error("Este NIF já está registado no sistema. Por favor, verifique o NIF e tente novamente.");
        } else {
          toast.error("Já existe uma empresa com estes dados no sistema.");
        }
      } else if (error.code === "PGRST116") {
        // No rows returned (shouldn't happen with insert/update)
        toast.error("Erro ao processar dados. Por favor, tente novamente.");
      } else {
        toast.error("Erro ao guardar empresa: " + (error.message || "Erro desconhecido"));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {company ? "Editar Empresa" : "Nova Empresa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Nome da Empresa *</Label>
            <Input {...register("name", { required: true })} />
          </div>

          <div>
            <Label>NIF *</Label>
            <Input {...register("tax_id", { required: true })} maxLength={9} />
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
          </div>

          <div>
            <Label>Telefone</Label>
            <Input {...register("phone")} />
          </div>

          <div>
            <Label>Morada</Label>
            <Textarea {...register("address")} rows={3} />
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
