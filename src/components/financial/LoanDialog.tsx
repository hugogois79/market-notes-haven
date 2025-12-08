import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { useEffect } from "react";

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  loan?: any;
}

export default function LoanDialog({
  open,
  onOpenChange,
  companyId,
  loan,
}: LoanDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

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
    if (loan) {
      reset({
        ...loan,
        lending_company_id: loan.lending_company_id,
        borrowing_company_id: loan.borrowing_company_id,
      });
    } else {
      reset({
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        interest_rate: 0,
        lending_company_id: '',
        borrowing_company_id: '',
      });
    }
  }, [loan, reset, companyId]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const loanData = {
        lending_company_id: data.lending_company_id,
        borrowing_company_id: data.borrowing_company_id,
        amount: Number(data.amount),
        interest_rate: Number(data.interest_rate),
        monthly_payment: data.monthly_payment ? Number(data.monthly_payment) : null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        status: data.status,
        description: data.description || null,
      };

      if (loan) {
        const { error } = await supabase
          .from("company_loans")
          .update(loanData)
          .eq("id", loan.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_loans")
          .insert(loanData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-loans", companyId] });
      toast.success(loan ? "Empréstimo atualizado" : "Empréstimo criado");
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
            {loan ? "Editar Empréstimo" : "Novo Empréstimo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-green-600 font-medium">Quem Empresta *</Label>
              <Select 
                onValueChange={(value) => setValue("lending_company_id", value)}
                value={watch("lending_company_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-orange-600 font-medium">Quem Recebe *</Label>
              <Select 
                onValueChange={(value) => setValue("borrowing_company_id", value)}
                value={watch("borrowing_company_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Montante (€) *</Label>
            <Input type="number" step="0.01" {...register("amount", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Taxa de Juro (%)</Label>
              <Input type="number" step="0.01" {...register("interest_rate")} />
            </div>

            <div>
              <Label>Prestação Mensal (€)</Label>
              <Input type="number" step="0.01" {...register("monthly_payment")} />
            </div>
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
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea {...register("description")} rows={3} />
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
