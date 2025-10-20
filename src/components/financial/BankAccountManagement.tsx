import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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
      toast.success("Account deleted");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Accounts</h2>
          <p className="text-muted-foreground">Manage company accounts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>IBAN</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts?.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.account_name}</TableCell>
                <TableCell>{account.bank_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(Number(account.current_balance))}
                </TableCell>
                <TableCell>
                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? "Active" : "Inactive"}
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
                        if (confirm("Delete account?")) {
                          deleteMutation.mutate(account.id);
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
