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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  account?: any;
}

export default function BankAccountDialog({
  open,
  onOpenChange,
  companyId,
  account,
}: BankAccountDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [selectedCompany, setSelectedCompany] = useState(companyId || "");

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
    if (account) {
      reset(account);
      setSelectedCompany(account.company_id);
    } else {
      reset({
        currency: "EUR",
        is_active: true,
        initial_balance: 0,
      });
      setSelectedCompany(companyId || "");
    }
  }, [account, companyId, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedCompany) {
        throw new Error("Please select a company");
      }

      const accountData = {
        ...data,
        company_id: selectedCompany,
        initial_balance: Number(data.initial_balance),
        current_balance: account ? Number(data.current_balance) : Number(data.initial_balance),
      };

      if (account) {
        const { error } = await supabase
          .from("bank_accounts")
          .update(accountData)
          .eq("id", account.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert(accountData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts", selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success(account ? "Account updated" : "Account created");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {account ? "Edit Account" : "New Bank Account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label>Company *</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
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
            <Label>Account Name *</Label>
            <Input {...register("account_name", { required: true })} placeholder="Main Account" />
          </div>

          <div>
            <Label>Bank</Label>
            <Input {...register("bank_name")} placeholder="Ex: Millennium BCP" />
          </div>

          <div>
            <Label>IBAN / Account Number *</Label>
            <Input {...register("account_number", { required: true })} placeholder="PT50..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Initial Balance</Label>
              <Input type="number" step="0.01" {...register("initial_balance")} />
            </div>

            <div>
              <Label>Currency</Label>
              <Input {...register("currency")} disabled />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Active account
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || !selectedCompany}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
