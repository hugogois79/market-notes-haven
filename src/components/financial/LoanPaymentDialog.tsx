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

interface LoanPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: any;
  payment?: any;
}

export default function LoanPaymentDialog({
  open,
  onOpenChange,
  loan,
  payment,
}: LoanPaymentDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (payment) {
      reset({
        payment_date: payment.payment_date,
        amount: payment.amount,
        notes: payment.notes,
      });
    } else {
      reset({
        payment_date: new Date().toISOString().split('T')[0],
        amount: loan?.monthly_payment || '',
        notes: '',
      });
    }
  }, [payment, loan, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const paymentData = {
        loan_id: loan.id,
        payment_date: data.payment_date,
        amount: Number(data.amount),
        paying_company_id: loan.borrowing_company_id,
        receiving_company_id: loan.lending_company_id,
        notes: data.notes || null,
      };

      if (payment) {
        const { error } = await supabase
          .from("loan_payments")
          .update(paymentData)
          .eq("id", payment.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loan_payments")
          .insert(paymentData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-payments", loan.id] });
      queryClient.invalidateQueries({ queryKey: ["all-loan-payments"] });
      toast.success(payment ? "Pagamento atualizado" : "Pagamento registado");
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
            {payment ? "Editar Pagamento" : "Novo Pagamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Data do Pagamento *</Label>
            <Input type="date" {...register("payment_date", { required: true })} />
          </div>

          <div>
            <Label>Montante (€) *</Label>
            <Input type="number" step="0.01" {...register("amount", { required: true })} />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={3} placeholder="Notas sobre o pagamento..." />
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
