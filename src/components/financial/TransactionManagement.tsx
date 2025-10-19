import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import TransactionDialog from "./TransactionDialog";
import TransactionTable from "./TransactionTable";

interface TransactionManagementProps {
  companyId: string;
}

export default function TransactionManagement({ companyId }: TransactionManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select(`
          *,
          bank_accounts(account_name),
          financial_projects(name)
        `)
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", companyId] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard", companyId] });
      toast.success("Movimento eliminado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar movimento: " + error.message);
    },
  });

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem a certeza que deseja eliminar este movimento?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Movimentos Financeiros</h2>
          <p className="text-muted-foreground">
            Gerir receitas e despesas da empresa
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Movimento
        </Button>
      </div>

      <TransactionTable
        transactions={transactions || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        companyId={companyId}
        transaction={editingTransaction}
      />
    </div>
  );
}
