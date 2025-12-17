import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { X, Check, ChevronsUpDown, FileText, Sparkles, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkflowExpensePanelProps {
  file: {
    id: string;
    file_name: string;
    file_url: string;
    mime_type: string | null;
  };
  onClose: () => void;
  onSaved?: () => void;
}

export function WorkflowExpensePanel({ file, onClose, onSaved }: WorkflowExpensePanelProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      company_id: "",
      project_id: "",
      category_id: "",
      description: "",
      entity_name: "",
      total_amount: "",
      vat_rate: "23",
      payment_method: "bank_transfer",
      bank_account_id: "",
      invoice_number: "",
      notes: "",
    },
  });

  const [projectOpen, setProjectOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // PDF text extraction function
  const extractPdfText = async (url: string): Promise<string> => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      return "";
    }
  };

  // AI document analysis function
  const analyzeDocument = useCallback(async () => {
    if (hasAnalyzed || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      let content = "";
      
      // Extract content based on file type
      if (file.mime_type === "application/pdf" || file.file_name.toLowerCase().endsWith(".pdf")) {
        content = await extractPdfText(file.file_url);
      } else {
        // For non-PDF files, use the file URL and name as context
        content = `[File: ${file.file_name}, URL: ${file.file_url}]`;
      }
      
      if (!content || content.length < 20) {
        console.log("Not enough content to analyze");
        setHasAnalyzed(true);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { fileContent: content, fileName: file.file_name }
      });
      
      if (error) throw error;
      
      console.log("AI Analysis result:", data);
      
      // Auto-fill form with extracted data
      if (data?.extractedData) {
        const extracted = data.extractedData;
        
        if (extracted.date) {
          setValue("date", extracted.date);
        }
        if (extracted.amount) {
          setValue("total_amount", extracted.amount.toString());
        }
        if (extracted.entityName) {
          setValue("entity_name", extracted.entityName);
        }
        if (extracted.description) {
          setValue("description", extracted.description);
        }
        if (extracted.invoiceNumber) {
          setValue("invoice_number", extracted.invoiceNumber);
        }
        if (extracted.transactionType) {
          setValue("type", extracted.transactionType);
        }
        
        toast.success("Dados extraídos com IA", {
          description: `Fornecedor: ${extracted.entityName || "N/A"}, Total: ${extracted.amount || "N/A"}€`
        });
      }
      
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Erro ao analisar documento");
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, hasAnalyzed, isAnalyzing, setValue]);

  // Auto-analyze when panel opens
  useEffect(() => {
    if (!hasAnalyzed && !isAnalyzing) {
      analyzeDocument();
    }
  }, [analyzeDocument, hasAnalyzed, isAnalyzing]);

  // Fetch companies
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

  const selectedCompanyId = watch("company_id");

  // Fetch bank accounts
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

  // Fetch projects
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

  // Fetch categories
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

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("entity_name")
        .not("entity_name", "is", null);
      if (error) throw error;
      const uniqueSuppliers = [...new Set(data.map((d) => d.entity_name).filter(Boolean))];
      return uniqueSuppliers.sort();
    },
  });

  // Filter categories by selected project
  const selectedProjectId = watch("project_id");
  const filteredCategories = useMemo(() => {
    if (!expenseCategories) return [];
    if (!selectedProjectId) return expenseCategories.filter((c) => c.category_type !== "receita");
    
    const selectedProject = expenseProjects?.find((p) => p.id === selectedProjectId);
    if (!selectedProject) return expenseCategories.filter((c) => c.category_type !== "receita");
    
    return expenseCategories.filter((c) => {
      const isExpenseType = c.category_type !== "receita";
      const isAssignedToProject = c.assigned_project_ids?.includes(selectedProjectId);
      return isExpenseType && isAssignedToProject;
    });
  }, [expenseCategories, selectedProjectId, expenseProjects]);

  // Filter bank accounts by payment method
  const paymentMethod = watch("payment_method");
  const filteredBankAccounts = useMemo(() => {
    if (!allBankAccounts) return [];
    if (paymentMethod === "credit_card") {
      return allBankAccounts.filter((ba) => ba.account_type === "credit_card");
    }
    return allBankAccounts.filter((ba) => ba.account_type === "bank_account");
  }, [allBankAccounts, paymentMethod]);

  // Calculate VAT
  const totalAmount = parseFloat(watch("total_amount") || "0");
  const vatRate = parseFloat(watch("vat_rate") || "0");
  const vatAmount = totalAmount - totalAmount / (1 + vatRate / 100);
  const netAmount = totalAmount - vatAmount;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilizador não autenticado");

      const toUuidOrNull = (value: unknown): string | null => {
        if (typeof value !== "string" || value === "") return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value) ? value : null;
      };

      const transactionData = {
        company_id: data.company_id,
        type: data.type,
        date: data.date,
        description: data.description,
        entity_name: data.entity_name,
        total_amount: parseFloat(data.total_amount) || 0,
        amount_net: netAmount,
        vat_amount: vatAmount,
        vat_rate: parseFloat(data.vat_rate) || 0,
        created_by: userData.user.id,
        payment_method: data.payment_method,
        invoice_number: data.invoice_number || null,
        notes: data.notes || null,
        project_id: toUuidOrNull(data.project_id),
        category_id: toUuidOrNull(data.category_id),
        bank_account_id: toUuidOrNull(data.bank_account_id),
        invoice_file_url: file.file_url,
        category: "other" as const,
      };

      const { error } = await supabase
        .from("financial_transactions")
        .insert(transactionData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard"] });
      toast.success("Movimento criado com sucesso");
      reset();
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <div className="h-full flex flex-col border-l bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Novo Movimento</h3>
          {isAnalyzing && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>A analisar...</span>
            </div>
          )}
          {hasAnalyzed && !isAnalyzing && (
            <Sparkles className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="p-4 space-y-4">
          {/* Date & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" {...register("date", { required: true })} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tipo *</Label>
              <Select onValueChange={(value) => setValue("type", value)} defaultValue="expense">
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company & Project */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Empresa *</Label>
              <Select onValueChange={(value) => setValue("company_id", value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
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
              <Label className="text-xs">Projeto</Label>
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal h-9 text-sm"
                  >
                    <span className="truncate">
                      {watch("project_id")
                        ? expenseProjects?.find((p) => p.id === watch("project_id"))?.name
                        : "Sem projeto"}
                    </span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Pesquisar..."
                      value={projectSearch}
                      onValueChange={setProjectSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum projeto.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setValue("project_id", "");
                            setValue("category_id", "");
                            setProjectOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !watch("project_id") ? "opacity-100" : "opacity-0")} />
                          Sem projeto
                        </CommandItem>
                        {expenseProjects
                          ?.filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                          .map((project) => (
                            <CommandItem
                              key={project.id}
                              onSelect={() => {
                                setValue("project_id", project.id);
                                setValue("category_id", "");
                                setProjectOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", watch("project_id") === project.id ? "opacity-100" : "opacity-0")} />
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

          {/* Category */}
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select onValueChange={(value) => setValue("category_id", value)} value={watch("category_id")}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Descrição *</Label>
            <Input {...register("description", { required: true })} className="h-9 text-sm" placeholder="Descrição do movimento" />
          </div>

          {/* Supplier */}
          <div>
            <Label className="text-xs">Fornecedor/Cliente *</Label>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal h-9 text-sm"
                >
                  <span className="truncate">{watch("entity_name") || "Selecione ou digite..."}</span>
                  <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Pesquisar ou criar..."
                    value={supplierSearch}
                    onValueChange={setSupplierSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setValue("entity_name", supplierSearch);
                          setSupplierOpen(false);
                        }}
                      >
                        Criar "{supplierSearch}"
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {suppliers
                        ?.filter((s) => s.toLowerCase().includes(supplierSearch.toLowerCase()))
                        .slice(0, 10)
                        .map((supplier) => (
                          <CommandItem
                            key={supplier}
                            onSelect={() => {
                              setValue("entity_name", supplier);
                              setSupplierOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", watch("entity_name") === supplier ? "opacity-100" : "opacity-0")} />
                            {supplier}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Total with VAT */}
          <div>
            <Label className="text-xs">Total (c/ IVA) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("total_amount", { required: true })}
              className="h-9 text-sm font-medium"
              placeholder="0.00"
            />
          </div>

          {/* VAT fields */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Taxa IVA (%)</Label>
              <Input type="number" {...register("vat_rate")} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">IVA (€)</Label>
              <Input value={vatAmount.toFixed(2)} readOnly className="h-9 text-sm bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Valor (s/ IVA)</Label>
              <Input value={netAmount.toFixed(2)} readOnly className="h-9 text-sm bg-muted" />
            </div>
          </div>

          {/* Payment method & Bank account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Método Pagamento</Label>
              <Select onValueChange={(value) => setValue("payment_method", value)} defaultValue="bank_transfer">
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{paymentMethod === "credit_card" ? "Cartão" : "Conta"}</Label>
              <Select onValueChange={(value) => setValue("bank_account_id", value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice number */}
          <div>
            <Label className="text-xs">Nº Fatura/Recibo</Label>
            <Input {...register("invoice_number")} className="h-9 text-sm" placeholder="Ex: FT 2024/001" />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea {...register("notes")} className="text-sm min-h-[60px]" placeholder="Notas adicionais..." />
          </div>

          {/* Attached file indicator */}
          <div>
            <Label className="text-xs">Anexo</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate flex-1 text-xs">{file.file_name}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 h-9 text-sm"
            >
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
