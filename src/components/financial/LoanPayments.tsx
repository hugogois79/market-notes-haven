import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoanPaymentDialog from "./LoanPaymentDialog";

interface LoanPaymentsProps {
  loan: any;
  onBack: () => void;
}

export default function LoanPayments({ loan, onBack }: LoanPaymentsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["loan-payments", loan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_payments")
        .select(`
          *,
          paying_company:companies!loan_payments_paying_company_id_fkey(id, name),
          receiving_company:companies!loan_payments_receiving_company_id_fkey(id, name)
        `)
        .eq("loan_id", loan.id)
        .order("payment_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("loan_payments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-payments", loan.id] });
      toast.success("Pagamento eliminado");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remaining = Number(loan.amount) - totalPaid;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Movimentos do Empréstimo</h2>
          <p className="text-muted-foreground">
            {loan.lending_company?.name} → {loan.borrowing_company?.name}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Montante Total</p>
          <p className="text-2xl font-bold">{formatCurrency(Number(loan.amount))}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Pago</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Valor em Dívida</p>
          <p className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : payments?.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhum pagamento registado
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Recebedor</TableHead>
                <TableHead>Montante</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.payment_date).toLocaleDateString("pt-PT")}
                  </TableCell>
                  <TableCell>{payment.paying_company?.name}</TableCell>
                  <TableCell>{payment.receiving_company?.name}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {payment.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPayment(payment);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Eliminar pagamento?")) {
                            deleteMutation.mutate(payment.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LoanPaymentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPayment(null);
        }}
        loan={loan}
        payment={editingPayment}
      />
    </div>
  );
}
