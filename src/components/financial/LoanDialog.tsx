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
import { useEffect, useRef, useState } from "react";
import { Upload, Paperclip, X, Loader2, Download } from "lucide-react";

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  loan?: any;
}

export default function LoanDialog({
  open,
  onOpenChange,
  companyId,
  loan,
}: LoanDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (loan) {
      reset({
        ...loan,
        lending_company_id: loan.lending_company_id,
        borrowing_company_id: loan.borrowing_company_id,
      });
      setAttachmentUrl(loan.attachment_url || null);
    } else {
      reset({
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        interest_rate: 0,
        lending_company_id: '',
        borrowing_company_id: '',
      });
      setAttachmentUrl(null);
    }
  }, [loan, reset, companyId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `loans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setAttachmentUrl(publicUrl);
      toast.success("Ficheiro carregado com sucesso");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao carregar ficheiro");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
  };

  const handleDownloadAttachment = async () => {
    if (!attachmentUrl) return;
    
    try {
      // Extract file path from the public URL
      const urlParts = attachmentUrl.split('/attachments/');
      if (urlParts.length < 2) {
        window.open(attachmentUrl, '_blank');
        return;
      }
      
      const filePath = urlParts[1];
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(filePath);
      
      if (error) throw error;
      
      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to direct link
      window.open(attachmentUrl, '_blank');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const loanData = {
        lending_company_id: data.lending_company_id,
        borrowing_company_id: data.borrowing_company_id,
        amount: Number(data.amount),
        interest_rate: Number(data.interest_rate),
        monthly_payment: data.monthly_payment ? Number(data.monthly_payment) : null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        status: data.status,
        description: data.description || null,
        attachment_url: attachmentUrl,
      };

      if (loan) {
        const { error } = await supabase
          .from("company_loans")
          .update(loanData)
          .eq("id", loan.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_loans")
          .insert(loanData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-loans", companyId] });
      queryClient.invalidateQueries({ queryKey: ["all-loans"] });
      toast.success(loan ? "Empréstimo atualizado" : "Empréstimo criado");
      onOpenChange(false);
      reset();
      setAttachmentUrl(null);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {loan ? "Editar Empréstimo" : "Novo Empréstimo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-green-600 font-medium">Quem Empresta *</Label>
              <Select 
                onValueChange={(value) => setValue("lending_company_id", value)}
                value={watch("lending_company_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
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
              <Label className="text-orange-600 font-medium">Quem Recebe *</Label>
              <Select 
                onValueChange={(value) => setValue("borrowing_company_id", value)}
                value={watch("borrowing_company_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
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
          </div>

          <div>
            <Label>Montante (€) *</Label>
            <Input type="number" step="0.01" {...register("amount", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Taxa de Juro (%)</Label>
              <Input type="number" step="0.01" {...register("interest_rate")} />
            </div>

            <div>
              <Label>Prestação Mensal (€)</Label>
              <Input type="number" step="0.01" {...register("monthly_payment")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Input type="date" {...register("start_date", { required: true })} />
            </div>

            <div>
              <Label>Data de Fim</Label>
              <Input type="date" {...register("end_date")} />
            </div>
          </div>

          <div>
            <Label>Estado</Label>
            <Select onValueChange={(value) => setValue("status", value)} defaultValue={watch("status")}>
              <SelectTrigger>
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

          <div>
            <Label>Descrição</Label>
            <Textarea {...register("description")} rows={3} />
          </div>

          <div>
            <Label>Anexo</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            {attachmentUrl ? (
              <div className="border rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="h-4 w-4 flex-shrink-0" />
                  <button 
                    type="button"
                    onClick={handleDownloadAttachment}
                    className="text-sm truncate text-blue-600 hover:underline text-left"
                  >
                    {attachmentUrl.split('/').pop()}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={handleDownloadAttachment}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                type="button"
                variant="outline" 
                className="w-full flex items-center justify-center gap-2" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A carregar...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Carregar Ficheiro
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
