import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BankAccountDialog from "./BankAccountDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        .select("*, companies(name)")
        .eq("company_id", companyId)
        .order("account_type")
        .order("account_name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Conta eliminada");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const bankAccounts = accounts?.filter(a => a.account_type === 'bank_account' || !a.account_type) || [];
  const creditCards = accounts?.filter(a => a.account_type === 'credit_card') || [];

  const renderAccountTable = (accountsList: any[], isCreditCard: boolean) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isCreditCard ? "Nome do Cartão" : "Nome da Conta"}</TableHead>
            <TableHead>{isCreditCard ? "Emissor" : "Banco"}</TableHead>
            <TableHead>{isCreditCard ? "Últimos Dígitos" : "IBAN"}</TableHead>
            <TableHead className="text-right">{isCreditCard ? "Saldo" : "Saldo Atual"}</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {isCreditCard ? "Nenhum cartão de crédito registado" : "Nenhuma conta bancária registada"}
              </TableCell>
            </TableRow>
          ) : (
            accountsList.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {isCreditCard ? (
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    {account.account_name}
                  </div>
                </TableCell>
                <TableCell>{account.bank_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(Number(account.current_balance))}
                </TableCell>
                <TableCell>
                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Bank Accounts Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Contas Bancárias
            </h2>
            <p className="text-muted-foreground">Gerir contas bancárias da empresa</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
        {renderAccountTable(bankAccounts, false)}
      </div>

      {/* Credit Cards Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Cartões de Crédito
            </h2>
            <p className="text-muted-foreground">Gerir cartões de crédito da empresa</p>
          </div>
        </div>
        {renderAccountTable(creditCards, true)}
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
