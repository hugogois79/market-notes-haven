import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import TransactionDialog from "./TransactionDialog";
import TransactionTable from "./TransactionTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionManagementProps {
  companyId: string;
}

export default function TransactionManagement({ companyId }: TransactionManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", companyId],
    queryFn: async () => {
      console.log("[TransactionManagement] Fetching transactions for company:", companyId);
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("id, date, type, description, entity_name, category, category_id, project_id, total_amount, amount_net, vat_amount, vat_rate, payment_method, bank_account_id, invoice_number, invoice_file_url, notes, company_id, created_by, created_at, updated_at, subcategory")
        .eq("company_id", companyId)
        .order("date", { ascending: false });
      
      if (error) {
        console.error("[TransactionManagement] Error fetching transactions:", error);
        throw error;
      }
      console.log("[TransactionManagement] Fetched transactions:", data?.length);
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Enrich transactions with category and project names
  const enrichedTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.map((t) => ({
      ...t,
      category_name: categories?.find((c) => c.id === t.category_id)?.name,
      project_name: projects?.find((p) => p.id === t.project_id)?.name,
    }));
  }, [transactions, categories, projects]);

  // Filter transactions by project
  const filteredTransactions = useMemo(() => {
    if (selectedProjectId === "all") return enrichedTransactions;
    if (selectedProjectId === "none") return enrichedTransactions.filter(t => !t.project_id);
    return enrichedTransactions.filter(t => t.project_id === selectedProjectId);
  }, [enrichedTransactions, selectedProjectId]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const safeId = typeof id === "string" && uuidRegex.test(id) ? id : null;
      if (!safeId) throw new Error("ID do movimento inválido");

      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", safeId);
      
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
        <div className="flex items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Movimento
          </Button>
        </div>
      </div>

      <TransactionTable
        transactions={filteredTransactions}
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
