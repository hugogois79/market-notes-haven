import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BankAccountDialog from "./BankAccountDialog";

interface BankAccountManagementProps {
  companyId: string;
}

export default function BankAccountManagement({ companyId }: BankAccountManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery({
    queryKey: ["bank-accounts", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("company_id", companyId)
        .order("account_name");
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", companyId] });
      toast.success("Conta eliminada");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contas Bancárias</h2>
          <p className="text-muted-foreground">Gerir contas da empresa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{account.account_name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingAccount(account);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Eliminar conta?")) {
                        deleteMutation.mutate(account.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {account.bank_name}
              </div>
              <div className="text-sm">
                <span className="font-medium">IBAN:</span> {account.account_number}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo Atual:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(Number(account.current_balance))}
                </span>
              </div>
              <div>
                <Badge variant={account.is_active ? "default" : "secondary"}>
                  {account.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAccount(null);
        }}
        companyId={companyId}
        account={editingAccount}
      />
    </div>
  );
}
