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
import { useEffect, useState } from "react";
import { Paperclip, X, ExternalLink } from "lucide-react";
import { mergePdfs, isPdfFile, isPdfUrl, EncryptedPdfError } from "@/utils/pdfMerger";

// Helper to remove file extension
const removeExtension = (filename: string) => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
};

// Helper to get filename from URL
const getFilenameFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() || 'documento';
    return decodeURIComponent(filename);
  } catch {
    return 'documento anexado';
  }
};

interface DocumentPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowFileId: string;
  fileName: string;
  documentFileUrl: string;
  existingTransaction?: any;
  onDocumentUrlUpdated?: (newUrl: string) => void;
}

export default function DocumentPaymentDialog({
  open,
  onOpenChange,
  workflowFileId,
  fileName,
  documentFileUrl,
  existingTransaction,
  onDocumentUrlUpdated,
}: DocumentPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isEditing = !!existingTransaction;
  
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      bank_account_id: '',
      notes: '',
    }
  });

  // Fetch all bank accounts
  const { data: bankAccounts } = useQuery({
    queryKey: ["all-bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select(`
          *,
          company:companies(id, name)
        `)
        .eq("is_active", true)
        .order("account_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        payment_date: existingTransaction?.date || new Date().toISOString().split('T')[0],
        amount: existingTransaction?.total_amount?.toString() || '',
        bank_account_id: existingTransaction?.bank_account_id || '',
        notes: existingTransaction?.notes || '',
      });
      setAttachmentFile(null);
      // If editing, pre-populate with existing payment attachment URL
      setExistingFileUrl(existingTransaction?.invoice_file_url || null);
    }
  }, [open, existingTransaction, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get bank account details
      const bankAccount = bankAccounts?.find(ba => ba.id === data.bank_account_id);
      if (!bankAccount) throw new Error("Conta bancária não encontrada");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilizador não autenticado");

      // Determine the final file URL
      let invoiceFileUrl: string | null = existingFileUrl; // Keep existing by default
      
      if (attachmentFile) {
        setIsUploading(true);
        
        let fileToUpload: Blob | File = attachmentFile;
        let fileExtension = attachmentFile.name.split('.').pop() || 'pdf';
        let mergeSucceeded = false;
        
        // If both the original document and attachment are PDFs, try to merge them
        if (isPdfUrl(documentFileUrl) && isPdfFile(attachmentFile)) {
          try {
            toast.info("A combinar documentos PDF...");
            fileToUpload = await mergePdfs(documentFileUrl, attachmentFile);
            fileExtension = 'pdf';
            mergeSucceeded = true;
          } catch (mergeError) {
            console.error("PDF merge failed, uploading payment file only:", mergeError);
            // If merge fails, just upload the payment file - DO NOT update workflow_files
            if (mergeError instanceof EncryptedPdfError) {
              toast.warning("O PDF do documento base está protegido. Não foi possível combinar; foi carregado apenas o comprovativo.");
            } else {
              toast.warning("Não foi possível combinar os PDFs, a carregar apenas o comprovativo");
            }
            mergeSucceeded = false;
          }
        }
        
        const filePath = `payment-attachments/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(filePath, fileToUpload);
        
        if (uploadError) throw new Error("Erro ao carregar documento: " + uploadError.message);
        
        const { data: urlData } = supabase.storage
          .from('company-documents')
          .getPublicUrl(filePath);
        
        invoiceFileUrl = urlData.publicUrl;
        setIsUploading(false);
        
        // ONLY update workflow file if merge actually succeeded
        if (mergeSucceeded) {
          const { error: updateDocError } = await supabase
            .from('workflow_files')
            .update({ file_url: invoiceFileUrl })
            .eq('id', workflowFileId);
          
          if (updateDocError) {
            console.error('Failed to update document URL:', updateDocError);
          } else {
            console.log('Document updated with merged PDF URL:', invoiceFileUrl);
            onDocumentUrlUpdated?.(invoiceFileUrl);
            queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
            queryClient.invalidateQueries({ queryKey: ["company-folders"] });
          }
        }
      }

      const transactionData = {
        company_id: bankAccount.company_id,
        type: 'expense' as const,
        category: 'services' as const,
        date: data.payment_date,
        description: `Pagamento: ${removeExtension(fileName)}`,
        entity_name: existingTransaction?.entity_name || 'Fornecedor',
        total_amount: Number(data.amount),
        amount_net: Number(data.amount),
        vat_amount: 0,
        vat_rate: 0,
        payment_method: bankAccount.account_type === 'credit_card' ? 'credit_card' as const : 'bank_transfer' as const,
        bank_account_id: data.bank_account_id,
        notes: data.notes || null,
        invoice_file_url: invoiceFileUrl,
        document_file_id: workflowFileId, // Link to the workflow document
      };

      if (isEditing && existingTransaction?.id) {
        // UPDATE existing transaction
        const { error } = await supabase
          .from("financial_transactions")
          .update(transactionData)
          .eq("id", existingTransaction.id);
        if (error) throw error;
      } else {
        // INSERT new transaction
        const { error } = await supabase
          .from("financial_transactions")
          .insert({
            ...transactionData,
            created_by: userData.user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["file-transaction"] });
      toast.success(isEditing ? "Pagamento atualizado com sucesso" : "Pagamento registado com sucesso");
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const selectedBankAccountId = watch("bank_account_id");
  const selectedBankAccount = bankAccounts?.find(ba => ba.id === selectedBankAccountId);

  const handleRemoveExistingFile = () => {
    setExistingFileUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,42rem)] max-w-none overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Pagamento" : "Registar Pagamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4 min-w-0">
          <div className="min-w-0">
            <Label className="text-xs text-muted-foreground">Documento</Label>
            <p className="text-sm font-medium break-words">{removeExtension(fileName)}</p>
          </div>

          <div>
            <Label>Data do Pagamento *</Label>
            <Input type="date" {...register("payment_date", { required: true })} />
          </div>

          <div>
            <Label>Montante (€) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              {...register("amount", { required: true })} 
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Conta Bancária *</Label>
            <Select
              value={selectedBankAccountId}
              onValueChange={(value) => setValue("bank_account_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar conta..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {account.company?.name}
                      </span>
                      <span>{account.account_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({account.account_type === 'credit_card' ? 'Cartão' : 'Banco'})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBankAccount && (
              <p className="text-xs text-muted-foreground mt-1">
                Saldo: {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(selectedBankAccount.current_balance)}
              </p>
            )}
          </div>

          <div>
            <Label>Documento de Pagamento</Label>
            {attachmentFile ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 min-w-0">
                <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate flex-1 min-w-0">{attachmentFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setAttachmentFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : existingFileUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 min-w-0">
                <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate flex-1 min-w-0">{getFilenameFromUrl(existingFileUrl)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(existingFileUrl, '_blank')}
                  title="Abrir ficheiro"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRemoveExistingFile}
                  title="Remover ficheiro"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachmentFile(file);
                  }}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea {...register("notes")} rows={2} placeholder="Notas sobre o pagamento..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || isUploading}>
              {isUploading 
                ? "A carregar..." 
                : saveMutation.isPending 
                  ? "A guardar..." 
                  : isEditing 
                    ? "Guardar Alterações" 
                    : "Registar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
