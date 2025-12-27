import { useState, useEffect, useMemo, useRef } from "react";
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
import { X, Check, ChevronsUpDown, FileText, ExternalLink, Trash2, Upload, Wand2 } from "lucide-react";
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
  existingTransaction?: {
    id: string;
    date: string;
    type: string;
    company_id?: string;
    project_id?: string | null;
    category_id?: string | null;
    description?: string;
    entity_name?: string;
    total_amount?: number;
    vat_rate?: number | null;
    payment_method?: string;
    bank_account_id?: string | null;
    invoice_number?: string | null;
    notes?: string | null;
    // Loan-specific fields
    lending_company_id?: string;
    borrowing_company_id?: string;
    interest_rate?: number;
    monthly_payment?: number | null;
    end_date?: string | null;
    loan_status?: string;
    _isLoan?: boolean;
  } | null;
  onClose: () => void;
  onSaved?: (payload?: { fileName?: string; fileUrl?: string | null; pendingLoanData?: any }) => void;
}

export function WorkflowExpensePanel({ file, existingTransaction, onClose, onSaved }: WorkflowExpensePanelProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!existingTransaction;
  
  // Determine if this is an existing registered loan (real UUID vs "pending")
  const isExistingRegisteredLoan = existingTransaction?._isLoan && existingTransaction.id !== "pending";
  const isPendingLoan = existingTransaction?._isLoan && existingTransaction.id === "pending";
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(file.file_url);
  const [attachmentName, setAttachmentName] = useState<string>(file.file_name);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm({
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
      // Loan-specific fields
      lending_company_id: "",
      borrowing_company_id: "",
      interest_rate: "0",
      monthly_payment: "",
      end_date: "",
      loan_status: "active",
      // Document-specific fields
      target_folder_id: "",
    },
  });

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

  // Fetch bank accounts (moved here so useEffect can depend on it)
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

  // Reset form when existingTransaction changes - wait for all dropdown data to load first
  useEffect(() => {
    if (existingTransaction && companies && expenseCategories && allBankAccounts) {
      // Check if this is a loan transaction
      const isLoanTransaction = existingTransaction.type === "loan" || existingTransaction._isLoan;
      
      if (isLoanTransaction) {
        reset({
          date: existingTransaction.date || new Date().toISOString().split("T")[0],
          type: "loan",
          company_id: "",
          project_id: "",
          category_id: "",
          description: existingTransaction.description || "",
          entity_name: "",
          total_amount: existingTransaction.total_amount?.toString() || "",
          vat_rate: "0",
          payment_method: "bank_transfer",
          bank_account_id: "",
          invoice_number: "",
          notes: existingTransaction.notes || "",
          lending_company_id: existingTransaction.lending_company_id || "",
          borrowing_company_id: existingTransaction.borrowing_company_id || "",
          interest_rate: existingTransaction.interest_rate?.toString() || "0",
          monthly_payment: existingTransaction.monthly_payment?.toString() || "",
          end_date: existingTransaction.end_date || "",
          loan_status: existingTransaction.loan_status || "active",
        });
      } else {
        reset({
          date: existingTransaction.date || new Date().toISOString().split("T")[0],
          type: existingTransaction.type || "expense",
          company_id: existingTransaction.company_id || "",
          project_id: existingTransaction.project_id || "",
          category_id: existingTransaction.category_id || "",
          description: existingTransaction.description || "",
          entity_name: existingTransaction.entity_name || "",
          total_amount: existingTransaction.total_amount?.toString() || "",
          vat_rate: existingTransaction.vat_rate?.toString() || "23",
          payment_method: existingTransaction.payment_method || "bank_transfer",
          bank_account_id: existingTransaction.bank_account_id || "",
          invoice_number: existingTransaction.invoice_number || "",
          notes: existingTransaction.notes || "",
          lending_company_id: "",
          borrowing_company_id: "",
          interest_rate: "0",
          monthly_payment: "",
          end_date: "",
          loan_status: "active",
        });
      }
    }
  }, [existingTransaction, reset, companies, expenseCategories, allBankAccounts]);

  const [projectOpen, setProjectOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const selectedCompanyId = watch("company_id");
  const transactionType = watch("type");
  const isLoan = transactionType === "loan";
  const isDocument = transactionType === "document";

  // Fetch folders for the selected company (for document type)
  const { data: companyFolders } = useQuery({
    queryKey: ["company-folders", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const { data, error } = await supabase
        .from("company_folders")
        .select("id, name, parent_folder_id")
        .eq("company_id", selectedCompanyId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompanyId && isDocument,
  });

  // Note: We no longer clear bank_account_id when company changes
  // because we allow cross-company payments (which auto-create loans)

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


  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("entity_name")
        .not("entity_name", "is", null);
      if (error) throw error;
      const uniqueSuppliers = [...new Set(data.map((d) => d.entity_name).filter((s): s is string => typeof s === 'string' && s.length > 0))];
      return uniqueSuppliers.sort();
    },
  });

  // Filter categories by selected project and transaction type
  const selectedProjectId = watch("project_id");
  
  const filteredCategories = useMemo(() => {
    if (!expenseCategories) return [];
    
    // For income and receipt types, show revenue categories; for expenses show expense categories
    const isRevenueType = transactionType === "income" || transactionType === "receipt";
    
    if (!selectedProjectId) {
      return expenseCategories.filter((c) => 
        isRevenueType ? c.category_type === "receita" : c.category_type !== "receita"
      );
    }
    
    const selectedProject = expenseProjects?.find((p) => p.id === selectedProjectId);
    if (!selectedProject) {
      return expenseCategories.filter((c) => 
        isRevenueType ? c.category_type === "receita" : c.category_type !== "receita"
      );
    }
    
    return expenseCategories.filter((c) => {
      const matchesType = isRevenueType ? c.category_type === "receita" : c.category_type !== "receita";
      const isAssignedToProject = c.assigned_project_ids?.includes(selectedProjectId);
      return matchesType && isAssignedToProject;
    });
  }, [expenseCategories, selectedProjectId, expenseProjects, transactionType]);

  // Filter bank accounts by payment method and company
  const paymentMethod = watch("payment_method");

  // Since we allow cross-company payments, always show both payment methods
  const availablePaymentMethods: Array<"bank_transfer" | "credit_card"> = ["bank_transfer", "credit_card"];

  const filteredBankAccounts = useMemo(() => {
    if (!allBankAccounts) return [];
    return allBankAccounts.filter((ba) => {
      // Show ALL accounts regardless of company (cross-company payment creates loan automatically)
      if (paymentMethod === "credit_card") {
        return ba.account_type === "credit_card";
      }
      return ba.account_type === "bank_account";
    });
  }, [allBankAccounts, paymentMethod]);

  // Calculate VAT
  const totalAmount = parseFloat(watch("total_amount") || "0");
  const vatRate = parseFloat(watch("vat_rate") || "0");
  const vatAmount = totalAmount - totalAmount / (1 + vatRate / 100);
  const netAmount = totalAmount - vatAmount;

  // Get lending and borrowing company IDs for loan filtering
  const lendingCompanyId = watch("lending_company_id");
  const borrowingCompanyId = watch("borrowing_company_id");

  // Filter companies for borrowing (exclude lending company)
  const borrowingCompanyOptions = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => c.id !== lendingCompanyId);
  }, [companies, lendingCompanyId]);

  // Filter companies for lending (exclude borrowing company)
  const lendingCompanyOptions = useMemo(() => {
    if (!companies) return [];
    return companies.filter((c) => c.id !== borrowingCompanyId);
  }, [companies, borrowingCompanyId]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilizador não autenticado");

      const toUuidOrNull = (value: unknown): string | null => {
        if (typeof value !== "string" || value === "") return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value) ? value : null;
      };

      // Handle loan type
      if (data.type === "loan") {
        // Get company names for auto-generated description
        const lendingCompanyName = companies?.find(c => c.id === data.lending_company_id)?.name || "Empresa";
        const borrowingCompanyName = companies?.find(c => c.id === data.borrowing_company_id)?.name || "Empresa";
        
        // Format date as DD-MM-YYYY
        const descDate = new Date(data.date);
        const formattedDescDate = `${String(descDate.getDate()).padStart(2, '0')}-${String(descDate.getMonth() + 1).padStart(2, '0')}-${descDate.getFullYear()}`;
        
        // Format amount with thousands separator
        const formattedAmount = Number(data.total_amount || 0).toLocaleString('pt-PT', { maximumFractionDigits: 0 });
        
        // Auto-generate description
        const autoDescription = `Transferência de ${lendingCompanyName} para ${borrowingCompanyName} com (${formattedDescDate}) e ${formattedAmount}€`;
        
        // If this is an existing registered loan, update it in the database
        if (isExistingRegisteredLoan && existingTransaction?.id) {
          const loanUpdateData = {
            lending_company_id: data.lending_company_id,
            borrowing_company_id: data.borrowing_company_id,
            amount: parseFloat(data.total_amount) || 0,
            interest_rate: parseFloat(data.interest_rate) || 0,
            monthly_payment: data.monthly_payment ? parseFloat(data.monthly_payment) : null,
            start_date: data.date,
            end_date: data.end_date || null,
            status: data.loan_status || "active",
            description: autoDescription,
            updated_at: new Date().toISOString(),
          };

          const { error: loanUpdateError } = await supabase
            .from("company_loans")
            .update(loanUpdateData)
            .eq("id", existingTransaction.id);
          
          if (loanUpdateError) throw loanUpdateError;

          // Update workflow_files with the new filename if it changed
          if (attachmentName !== file.file_name) {
            const { error: fileUpdateError } = await supabase
              .from("workflow_files")
              .update({ file_name: attachmentName })
              .eq("id", file.id);
            if (fileUpdateError) throw fileUpdateError;
          }

          // Invalidate queries and notify success
          queryClient.invalidateQueries({ queryKey: ["company-loans"] });
          queryClient.invalidateQueries({ queryKey: ["file-transaction"] });
          toast.success("Empréstimo atualizado com sucesso");
          onSaved?.({ fileName: attachmentName, fileUrl: attachmentUrl });
          return;
        }
        
        // Otherwise, save as pending loan (not yet registered in DB)
        const pendingLoanData = {
          lending_company_id: data.lending_company_id,
          borrowing_company_id: data.borrowing_company_id,
          amount: parseFloat(data.total_amount) || 0,
          interest_rate: parseFloat(data.interest_rate) || 0,
          monthly_payment: data.monthly_payment ? parseFloat(data.monthly_payment) : null,
          start_date: data.date,
          end_date: data.end_date || null,
          status: data.loan_status || "active",
          description: autoDescription,
          lending_company_name: lendingCompanyName,
          borrowing_company_name: borrowingCompanyName,
        };

        // Update workflow_files with the new filename if it changed
        if (attachmentName !== file.file_name) {
          const { error: fileUpdateError } = await supabase
            .from("workflow_files")
            .update({ file_name: attachmentName })
            .eq("id", file.id);
          if (fileUpdateError) throw fileUpdateError;
        }

        // Pass pending loan data via callback - will be created when confirming file send
        onSaved?.({ fileName: attachmentName, fileUrl: attachmentUrl, pendingLoanData });
        return; // Exit without creating DB records
      }

      // Handle document type - copy file to company_documents
      if (data.type === "document") {
        // Create a document entry in the company_documents table
        const documentData = {
          company_id: data.company_id,
          folder_id: data.target_folder_id || null,
          name: attachmentName || file.file_name,
          file_url: attachmentUrl || file.file_url,
          document_type: "arquivo",
          notes: data.notes || null,
          uploaded_by: userData.user.id,
        };

        const { error: docError } = await supabase
          .from("company_documents")
          .insert(documentData);
        
        if (docError) throw docError;

        // Update workflow_files with the new filename if it changed
        if (attachmentName !== file.file_name) {
          const { error: fileUpdateError } = await supabase
            .from("workflow_files")
            .update({ file_name: attachmentName })
            .eq("id", file.id);
          if (fileUpdateError) throw fileUpdateError;
        }

        queryClient.invalidateQueries({ queryKey: ["company-documents"] });
        toast.success("Documento guardado com sucesso");
        onSaved?.({ fileName: attachmentName, fileUrl: attachmentUrl });
        return;
      }

      const isNotification = data.type === "notification";
      
      const transactionData = {
        company_id: data.company_id,
        type: data.type,
        date: data.date,
        description: data.description,
        entity_name: data.entity_name,
        total_amount: isNotification ? 0 : (parseFloat(data.total_amount) || 0),
        amount_net: isNotification ? 0 : netAmount,
        vat_amount: isNotification ? 0 : vatAmount,
        vat_rate: isNotification ? 0 : (parseFloat(data.vat_rate) || 0),
        payment_method: data.payment_method,
        invoice_number: data.invoice_number || null,
        notes: data.notes || null,
        project_id: toUuidOrNull(data.project_id),
        category_id: toUuidOrNull(data.category_id),
        bank_account_id: isNotification ? null : toUuidOrNull(data.bank_account_id),
        invoice_file_url: attachmentUrl,
        document_file_id: file.id, // Link to the workflow document
        category: "other" as const,
      };

      if (isEditMode && existingTransaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", existingTransaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("financial_transactions")
          .insert({ ...transactionData, created_by: userData.user.id });
        if (error) throw error;
      }

      // Update workflow_files with the new filename if it changed
      if (attachmentName !== file.file_name) {
        const { error: fileUpdateError } = await supabase
          .from("workflow_files")
          .update({ file_name: attachmentName })
          .eq("id", file.id);
        if (fileUpdateError) throw fileUpdateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-linked-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["file-transaction"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
      queryClient.invalidateQueries({ queryKey: ["company-loans"] });
      queryClient.invalidateQueries({ queryKey: ["company-documents"] });
      toast.success(isLoan ? "Empréstimo criado com sucesso" : (isEditMode ? "Movimento atualizado com sucesso" : "Movimento criado com sucesso"));
      if (!isEditMode) reset();
      onSaved?.({ fileName: attachmentName, fileUrl: attachmentUrl });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <div className="h-full flex flex-col border-l bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-base">
          {isExistingRegisteredLoan 
            ? "Editar Empréstimo" 
            : isPendingLoan 
              ? "Editar Empréstimo (pendente)" 
              : isEditMode 
                ? "Editar Movimento" 
                : "Novo Movimento"}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit((data) => {
          // Validação de data
          const date = new Date(data.date);
          const year = date.getFullYear();
          const today = new Date();
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(today.getFullYear() + 1);
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(today.getFullYear() - 5);

          if (year < 2000 || year > 2100) {
            toast.error(`Ano inválido: ${year}. Por favor verifique a data.`);
            return;
          }
          if (date > oneYearFromNow) {
            toast.error("A data não pode ser mais de 1 ano no futuro");
            return;
          }
          if (date < fiveYearsAgo) {
            toast.error("A data não pode ser mais de 5 anos no passado");
            return;
          }

          // Validation for document type
          if (data.type === "document") {
            if (!data.company_id) {
              toast.error("Selecione a empresa");
              return;
            }
            if (!data.target_folder_id) {
              toast.error("Selecione a pasta de destino");
              return;
            }
          }

          // Validation for loan type
          if (data.type === "loan") {
            if (!data.lending_company_id) {
              toast.error("Selecione a empresa que empresta");
              return;
            }
            if (!data.borrowing_company_id) {
              toast.error("Selecione a empresa que recebe");
              return;
            }
            if (!data.total_amount || parseFloat(data.total_amount) <= 0) {
              toast.error("Introduza o montante do empréstimo");
              return;
            }
          }

          saveMutation.mutate(data);
        })} className="p-4 space-y-4">
          {/* Date & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" {...register("date", { required: true })} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tipo *</Label>
              <Select onValueChange={(value) => setValue("type", value)} value={watch("type")}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="receipt">Recibo</SelectItem>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DOCUMENT-SPECIFIC FIELDS */}
          {isDocument ? (
            <>
              {/* Company */}
              <div>
                <Label className="text-xs">Empresa *</Label>
                <Select onValueChange={(value) => {
                  setValue("company_id", value);
                  setValue("target_folder_id", ""); // Reset folder when company changes
                }} value={watch("company_id")}>
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

              {/* Target Folder */}
              {selectedCompanyId && (
                <div>
                  <Label className="text-xs">Pasta de Destino *</Label>
                  <Select onValueChange={(value) => setValue("target_folder_id", value)} value={watch("target_folder_id")}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione uma pasta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companyFolders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input {...register("description")} className="h-9 text-sm" placeholder="Descrição do documento" />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notas</Label>
                <Textarea {...register("notes")} className="text-sm min-h-[60px]" placeholder="Notas adicionais..." />
              </div>
            </>
          ) : isLoan ? (
            <>
              {/* Lending Company */}
              <div>
                <Label className="text-xs text-green-600 font-medium">Quem Empresta *</Label>
                <Select onValueChange={(value) => setValue("lending_company_id", value)} value={watch("lending_company_id")}>
                  <SelectTrigger className="h-9 text-sm border-green-300 focus:ring-green-500">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lendingCompanyOptions?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Borrowing Company */}
              <div>
                <Label className="text-xs text-orange-600 font-medium">Quem Recebe *</Label>
                <Select onValueChange={(value) => setValue("borrowing_company_id", value)} value={watch("borrowing_company_id")}>
                  <SelectTrigger className="h-9 text-sm border-orange-300 focus:ring-orange-500">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {borrowingCompanyOptions?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loan Amount */}
              <div>
                <Label className="text-xs">Montante (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("total_amount", { required: true })}
                  className="h-9 text-sm font-medium"
                  placeholder="0.00"
                />
              </div>

              {/* Interest Rate & Monthly Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Taxa de Juro (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("interest_rate")}
                    className="h-9 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Prestação Mensal (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("monthly_payment")}
                    className="h-9 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* End Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Data de Fim</Label>
                  <Input type="date" {...register("end_date")} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <Select onValueChange={(value) => setValue("loan_status", value)} value={watch("loan_status")}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Em Atraso</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea {...register("description")} className="text-sm min-h-[60px]" placeholder="Descrição do empréstimo..." />
              </div>
            </>
          ) : (
            <>
              {/* REGULAR TRANSACTION FIELDS */}
              {/* Company & Project */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Empresa *</Label>
                  <Select onValueChange={(value) => setValue("company_id", value)} value={watch("company_id")}>
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
                              ?.filter((p) => p.name?.toLowerCase().includes(projectSearch.toLowerCase()))
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

              {/* Category - hide for receipts since they are payment proofs, not new transactions */}
              {transactionType !== "receipt" && (
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select onValueChange={(value) => setValue("category_id", value)} value={watch("category_id")}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-xs">Descrição *</Label>
                <Input {...register("description", { required: !isLoan })} className="h-9 text-sm" placeholder="Descrição do movimento" />
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
                            ?.filter((s) => typeof s === 'string' && s.toLowerCase().includes(supplierSearch.toLowerCase()))
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

              {/* Total with VAT - Hidden for notifications */}
              {watch("type") !== "notification" && (
                <>
                  <div>
                    <Label className="text-xs">Total (c/ IVA) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("total_amount", { required: watch("type") !== "notification" })}
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
                      <Select onValueChange={(value) => setValue("payment_method", value)} value={watch("payment_method")}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePaymentMethods.includes("bank_transfer") && (
                            <SelectItem value="bank_transfer">Transferência</SelectItem>
                          )}
                          {availablePaymentMethods.includes("credit_card") && (
                            <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{paymentMethod === "credit_card" ? "Cartão" : "Conta"}</Label>
                      <Select onValueChange={(value) => setValue("bank_account_id", value)} value={watch("bank_account_id")}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id} className="text-xs">
                              {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

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
            </>
          )}

          {/* Attached file indicator */}
          <div>
            <Label className="text-xs">Anexo</Label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={async (e) => {
                const newFile = e.target.files?.[0];
                if (!newFile) return;
                setIsUploadingAttachment(true);
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  if (!userData.user) throw new Error("Utilizador não autenticado");
                  
                  const fileExt = newFile.name.split('.').pop();
                  const safeFileName = `${newFile.name.replace(/\.[^/.]+$/, '').replace(/[^\w-]/g, '_')}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                  
                  const { error } = await supabase.storage
                    .from('attachments')
                    .upload(`transactions/${userData.user.id}/${safeFileName}`, newFile);
                  
                  if (error) throw error;
                  
                  const { data: urlData } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(`transactions/${userData.user.id}/${safeFileName}`);
                  
                  setAttachmentUrl(urlData.publicUrl);
                  setAttachmentName(newFile.name);
                  toast.success("Ficheiro carregado com sucesso");
                } catch (err: any) {
                  toast.error("Erro ao carregar ficheiro: " + err.message);
                } finally {
                  setIsUploadingAttachment(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
            {attachmentUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate flex-1 text-xs">{attachmentName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                  onClick={() => {
                    const values = getValues();
                    const dateValue = values.date;

                    // Format date to DD-MM-YYYY
                    let formattedDate = "";
                    if (dateValue) {
                      const d = new Date(dateValue);
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const year = d.getFullYear();
                      formattedDate = `${day}-${month}-${year}`;
                    } else {
                      const d = new Date();
                      formattedDate = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                    }

                    // Get extension from current file
                    const extension = attachmentName.split(".").pop() || "pdf";

                    // Handle loan type differently
                    if (isLoan) {
                      const lendingId = values.lending_company_id;
                      const borrowingId = values.borrowing_company_id;

                      const lendingCompanyName = companies?.find((c) => c.id === lendingId)?.name || "Empresa";
                      const borrowingCompanyName = companies?.find((c) => c.id === borrowingId)?.name || "Empresa";

                      const cleanBorrowing = borrowingCompanyName.replace(/[<>:"/\\|?*,]/g, "").trim();
                      const cleanLending = lendingCompanyName.replace(/[<>:"/\\|?*,]/g, "").trim();

                      // Get and format the loan amount with thousands separator
                      const loanAmount = values.total_amount;
                      const amountNumber = Number(loanAmount || 0);
                      const formattedAmount = amountNumber.toLocaleString('pt-PT', { maximumFractionDigits: 0 });

                      // Build name: [Quem Recebe] (Data) [Montante]€ [Quem Empresta]
                      const newName = `${cleanBorrowing} (${formattedDate}) ${formattedAmount}€ ${cleanLending}.${extension}`;

                      setAttachmentName(newName);
                      toast.success(`Ficheiro renomeado para: ${newName}`);
                      return;
                    }

                    // Handle document type - Descrição (Data) Empresa
                    if (values.type === "document") {
                      const description = values.description || "Documento";
                      const companyId = values.company_id;
                      
                      // Get company name
                      const companyName = companies?.find((c) => c.id === companyId)?.name || "Empresa";
                      
                      // Clean names (remove invalid characters)
                      const cleanDescription = description.replace(/[<>:"/\\|?*,]/g, "").trim();
                      const cleanCompany = companyName.replace(/[<>:"/\\|?*,]/g, "").trim();
                      
                      // Build name: Descrição (Data) Empresa.ext
                      const newName = `${cleanDescription} (${formattedDate}) ${cleanCompany}.${extension}`;
                      
                      setAttachmentName(newName);
                      toast.success(`Ficheiro renomeado para: ${newName}`);
                      return;
                    }

                    // Regular transaction naming
                    const supplierName = values.entity_name || "Fornecedor";
                    const totalValue = values.total_amount;
                    const companyId = values.company_id;
                    const bankAccountId = values.bank_account_id;
                    const projectId = values.project_id;

                    // Format amount
                    const formattedValue = Number(totalValue || 0).toFixed(2);

                    // Get company name (empresa receptora)
                    const companyName = companies?.find((c) => c.id === companyId)?.name || "";

                    // Get bank account name (conta)
                    const bankAccountName =
                      allBankAccounts?.find((ba) => ba.id === bankAccountId)?.account_name || "";

                    // Get project name
                    const projectName = expenseProjects?.find((p) => p.id === projectId)?.name || "";

                    // Clean names (remove invalid characters including commas)
                    const cleanSupplier = supplierName.replace(/[<>:"/\\|?*,]/g, "").trim();
                    const cleanCompany = companyName.replace(/[<>:"/\\|?*,]/g, "").trim();
                    const cleanBankAccount = bankAccountName.replace(/[<>:"/\\|?*,]/g, "").trim();
                    const cleanProject = projectName.replace(/[<>:"/\\|?*,]/g, "").trim().toUpperCase();

                    // Build the new name with all components
                    let newName = `${cleanSupplier} (${formattedDate}) ${formattedValue}€`;

                    // Add company name if available
                    if (cleanCompany) {
                      newName += ` (${cleanCompany})`;
                    }

                    // Add bank account name if available
                    if (cleanBankAccount) {
                      newName += ` (${cleanBankAccount})`;
                    }

                    // Add project name in brackets if available
                    if (cleanProject) {
                      newName += ` [${cleanProject}]`;
                    }

                    // Add notes in brackets if available (only for Notificação type)
                    const transactionTypeVal = values.type;
                    const notesValue = values.notes || "";
                    const cleanNotes = notesValue.replace(/[<>:"/\\|?*]/g, "").trim().toUpperCase();
                    if (transactionTypeVal === "notification" && cleanNotes) {
                      newName += ` [${cleanNotes}]`;
                    }

                    // Add extension
                    newName += `.${extension}`;

                    setAttachmentName(newName);
                    toast.success(`Ficheiro renomeado para: ${newName}`);
                  }}
                  title="Renomear ficheiro automaticamente"
                >
                  <Wand2 className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(attachmentUrl, '_blank')}
                  title="Abrir ficheiro"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    setAttachmentUrl(null);
                    setAttachmentName("");
                  }}
                  title="Remover anexo"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-sm gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAttachment}
              >
                <Upload className="h-4 w-4" />
                {isUploadingAttachment ? "A carregar..." : "Carregar ficheiro"}
              </Button>
            )}
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
              {saveMutation.isPending ? "A guardar..." : isEditMode ? "Atualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
