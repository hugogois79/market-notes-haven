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
import { useEffect, useState, useRef } from "react";
import { Check, ChevronsUpDown, X, Paperclip, Download } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  transaction?: any;
}

export default function TransactionDialog({
  open,
  onOpenChange,
  companyId,
  transaction,
}: TransactionDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all companies for selection
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

  const selectedCompanyId = watch("company_id") || companyId;

  // Fetch all bank accounts from all companies
  const { data: allBankAccounts } = useQuery({
    queryKey: ["bank-accounts-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*, companies(name)")
        .eq("is_active", true)
        .order("company_id");
      
      if (error) throw error;
      return data;
    },
  });

  // Use expense_projects instead of financial_projects (same as expenses module)
  const { data: expenseProjects } = useQuery({
    queryKey: ["expense-projects-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Get expense categories (same as expenses module)
  const { data: expenseCategories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Get suppliers (same as expenses module)
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const transactionType = watch("type");
  const paymentMethod = watch("payment_method");

  // Filter accounts based on payment method - credit card shows only credit cards, others show bank accounts
  const filteredBankAccounts = allBankAccounts?.filter(account => {
    if (paymentMethod === 'credit_card') {
      return account.account_type === 'credit_card';
    }
    return account.account_type === 'bank_account';
  });

  useEffect(() => {
    if (transaction) {
      reset({
        ...transaction,
        company_id: transaction.company_id || companyId,
        category_id: transaction.category_id || "",
      });
      setExistingAttachment(transaction.invoice_file_url || null);
      setNewFiles([]);
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'other',
        category_id: "",
        payment_method: 'bank_transfer',
        vat_rate: 23,
        company_id: companyId,
      });
      setExistingAttachment(null);
      setNewFiles([]);
    }
  }, [transaction, reset, companyId]);

  const totalAmount = watch("total_amount");
  const vatRate = watch("vat_rate");

  // Calculate net amount and VAT from total
  useEffect(() => {
    if (totalAmount && vatRate !== undefined) {
      const total = Number(totalAmount);
      const rate = Number(vatRate);
      
      if (!isNaN(total) && !isNaN(rate)) {
        // Reverse calculation: net = total / (1 + rate/100)
        const net = total / (1 + rate / 100);
        const vatAmount = total - net;
        
        setValue("amount_net", net.toFixed(2));
        setValue("vat_amount", vatAmount.toFixed(2));
      }
    }
  }, [totalAmount, vatRate, setValue]);

  // Clear bank account when company changes
  useEffect(() => {
    if (selectedCompanyId !== companyId && !transaction) {
      setValue("bank_account_id", "");
    }
  }, [selectedCompanyId, companyId, setValue, transaction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewFiles(Array.from(files));
    }
  };

  const removeExistingAttachment = () => {
    setExistingAttachment(null);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return "ficheiro";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      let fileUrl = existingAttachment;

      // Upload new file if any
      if (newFiles.length > 0) {
        const file = newFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `transactions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
      }

      // Remove client-side enriched properties that don't exist in the database
      const { category_name, project_name, ...cleanData } = data;
      
      const transactionData = {
        ...cleanData,
        company_id: cleanData.company_id || companyId,
        created_by: user?.id,
        amount_net: Number(cleanData.amount_net),
        vat_rate: Number(cleanData.vat_rate),
        vat_amount: Number(cleanData.vat_amount),
        total_amount: Number(cleanData.total_amount),
        project_id: cleanData.project_id || null,
        category_id: cleanData.category_id || null,
        bank_account_id: cleanData.bank_account_id || null,
        invoice_file_url: fileUrl,
        // Keep default category for the enum field (required)
        category: 'other',
      };

      if (transaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", transaction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_transactions")
          .insert(transactionData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts-dashboard"] });
      toast.success(transaction ? "Movimento atualizado" : "Movimento criado");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Movimento" : "Novo Movimento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data *</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select onValueChange={(value) => setValue("type", value)} defaultValue={watch("type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Empresa *</Label>
              <Select 
                onValueChange={(value) => setValue("company_id", value)} 
                value={selectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa..." />
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
              <Label>Projeto</Label>
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={projectOpen}
                    className="w-full justify-between font-normal"
                  >
                    {watch("project_id")
                      ? expenseProjects?.find((p) => p.id === watch("project_id"))?.name
                      : "Sem projeto"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Pesquisar projeto..." 
                      value={projectSearch}
                      onValueChange={setProjectSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setValue("project_id", null);
                            setValue("category_id", "");
                            setProjectSearch("");
                            setProjectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !watch("project_id") ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Sem projeto
                        </CommandItem>
                        {expenseProjects
                          ?.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                          .map((project) => (
                            <CommandItem
                              key={project.id}
                              value={project.name}
                              onSelect={() => {
                                setValue("project_id", project.id);
                                setValue("category_id", "");
                                setProjectSearch("");
                                setProjectOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watch("project_id") === project.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {project.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Categoria *</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full justify-between font-normal"
                >
                  {watch("category_id")
                    ? expenseCategories?.find((cat) => cat.id === watch("category_id"))?.name
                    : "Selecione..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar categoria..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                    <CommandGroup>
                      {expenseCategories
                        ?.filter(cat => {
                          // Filter by transaction type
                          const typeMatch = transactionType === 'income'
                            ? (cat.category_type === 'receita' || cat.category_type === 'income' || cat.category_type === 'ambos' || cat.category_type === 'both')
                            : (cat.category_type === 'despesa' || cat.category_type === 'expense' || cat.category_type === 'ambos' || cat.category_type === 'both' || !cat.category_type);
                          
                          if (!typeMatch) return false;
                          
                          // Filter by project if one is selected
                          const selectedProjectId = watch("project_id");
                          if (selectedProjectId && selectedProjectId !== "none") {
                            return cat.assigned_project_ids?.includes(selectedProjectId);
                          }
                          
                          return true;
                        })
                        .map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => {
                              setValue("category_id", category.id);
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch("category_id") === category.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Descrição *</Label>
            <Input {...register("description", { required: true })} />
          </div>

          <div>
            <Label>Fornecedor/Cliente *</Label>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={supplierOpen}
                  className="w-full justify-between font-normal"
                >
                  {watch("entity_name") || "Selecione..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Pesquisar ou adicionar fornecedor..." 
                    value={supplierSearch}
                    onValueChange={setSupplierSearch}
                  />
                  <CommandList>
                    <CommandGroup>
                      {suppliers
                        ?.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                        .map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={supplier.name}
                            onSelect={() => {
                              setValue("entity_name", supplier.name);
                              setSupplierSearch("");
                              setSupplierOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch("entity_name") === supplier.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supplier.name}
                          </CommandItem>
                        ))}
                      {supplierSearch.trim() && 
                        !suppliers?.some(s => s.name.toLowerCase() === supplierSearch.trim().toLowerCase()) && (
                        <CommandItem
                          value={`add-${supplierSearch}`}
                          onSelect={async () => {
                            const trimmedName = supplierSearch.trim();
                            const { error } = await supabase
                              .from("suppliers")
                              .insert({ name: trimmedName });
                            
                            if (error) {
                              toast.error("Erro ao adicionar fornecedor");
                              return;
                            }
                            
                            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
                            setValue("entity_name", trimmedName);
                            setSupplierSearch("");
                            setSupplierOpen(false);
                            toast.success(`Fornecedor "${trimmedName}" adicionado`);
                          }}
                          className="cursor-pointer"
                        >
                          <span className="text-primary">+ Adicionar "{supplierSearch.trim()}"</span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                    {!supplierSearch && suppliers?.length === 0 && (
                      <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Total (c/ IVA) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              {...register("total_amount", { required: true })} 
              className="font-bold text-lg"
              placeholder="Introduza o valor total..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Taxa IVA (%)</Label>
              <Input type="number" step="0.01" {...register("vat_rate")} />
            </div>

            <div>
              <Label>IVA (€)</Label>
              <Input 
                type="number" 
                step="0.01" 
                {...register("vat_amount")} 
                readOnly 
                className="bg-muted"
              />
            </div>

            <div>
              <Label>Valor (s/ IVA)</Label>
              <Input 
                type="number" 
                step="0.01" 
                {...register("amount_net")} 
                readOnly 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Método de Pagamento *</Label>
              <Select 
                onValueChange={(value) => {
                  setValue("payment_method", value);
                  // Clear bank account when payment method changes
                  setValue("bank_account_id", null);
                }} 
                value={paymentMethod || "bank_transfer"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="mbway">MBWay</SelectItem>
                  <SelectItem value="multibanco">Multibanco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Conta Bancária'}</Label>
              <Select 
                onValueChange={(value) => setValue("bank_account_id", value === "none" ? null : value)} 
                value={watch("bank_account_id") || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{paymentMethod === 'credit_card' ? 'Sem cartão' : 'Sem conta'}</SelectItem>
                  {filteredBankAccounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {(account as any).companies?.name || account.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nº Fatura/Recibo</Label>
            <Input {...register("invoice_number")} placeholder="FT 2024/001" />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea {...register("notes")} rows={3} />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <Label>Anexo</Label>
            
            {existingAttachment && (
              <div className="text-sm text-muted-foreground mb-2">
                <span>Anexo existente: </span>
                <span className="inline-flex items-center gap-1">
                  <span className="truncate max-w-[200px] inline-block align-middle">
                    {getFileName(existingAttachment)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-primary hover:text-primary/80"
                    onClick={async () => {
                      try {
                        const response = await fetch(existingAttachment);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = getFileName(existingAttachment);
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Error downloading file:', error);
                        toast.error('Erro ao descarregar ficheiro');
                      }
                    }}
                    title="Descarregar ficheiro"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                    onClick={removeExistingAttachment}
                    title="Remover anexo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              </div>
            )}

            {newFiles.length > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                <span>Novo ficheiro: </span>
                {newFiles.map((file, index) => (
                  <span key={index} className="inline-flex items-center gap-1">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeNewFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceites: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || isUploading}>
              {saveMutation.isPending || isUploading ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
