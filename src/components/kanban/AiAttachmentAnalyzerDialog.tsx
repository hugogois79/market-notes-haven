import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { KanbanAttachment } from '@/services/kanbanService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface ExtractedData {
  vendor_name?: string;
  invoice_date?: string;
  total_amount?: number;
  tax_amount?: number;
  subtotal?: number;
  invoice_number?: string;
  line_items_summary?: string;
  category?: string;
  payment_method?: string;
}

interface AiAttachmentAnalyzerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: KanbanAttachment[];
  cardId: string;
  onDescriptionGenerated: (description: string) => void;
}

type DialogPhase = 'select' | 'analyzing' | 'confirm' | 'error';

export const AiAttachmentAnalyzerDialog: React.FC<AiAttachmentAnalyzerDialogProps> = ({
  isOpen,
  onClose,
  attachments,
  cardId,
  onDescriptionGenerated,
}) => {
  const [phase, setPhase] = useState<DialogPhase>('select');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>(
    attachments.length === 1 ? attachments[0].id : ''
  );
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedAttachment = attachments.find(a => a.id === selectedAttachmentId);

  const formatDescriptionFromData = (data: ExtractedData): string => {
    const lines: string[] = [];

    if (data.vendor_name) {
      lines.push(`**Fornecedor:** ${data.vendor_name}`);
    }
    if (data.invoice_date) {
      lines.push(`**Data:** ${data.invoice_date}`);
    }
    if (data.invoice_number) {
      lines.push(`**Nº Fatura:** ${data.invoice_number}`);
    }
    if (data.total_amount !== undefined) {
      lines.push(`**Valor Total:** ${formatCurrency(data.total_amount)}`);
    }
    if (data.subtotal !== undefined && data.subtotal !== data.total_amount) {
      lines.push(`**Subtotal:** ${formatCurrency(data.subtotal)}`);
    }
    if (data.tax_amount !== undefined) {
      lines.push(`**IVA:** ${formatCurrency(data.tax_amount)}`);
    }
    if (data.payment_method) {
      lines.push(`**Método Pagamento:** ${data.payment_method}`);
    }
    if (data.category) {
      lines.push(`**Categoria:** ${data.category}`);
    }
    if (data.line_items_summary) {
      lines.push('');
      lines.push('**Detalhes:**');
      lines.push(data.line_items_summary);
    }

    return lines.join('\n');
  };

  const handleAnalyze = async () => {
    if (!selectedAttachment) {
      toast.error('Selecione um anexo para analisar');
      return;
    }

    setPhase('analyzing');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-kanban-attachment', {
        body: {
          fileUrl: selectedAttachment.file_url,
          fileName: selectedAttachment.filename,
          mimeType: selectedAttachment.file_type || 'application/octet-stream',
          cardId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.message || data.error || 'Erro ao analisar documento');
      }

      const extracted = data.data;
      
      // Check if we got any meaningful data
      if (!extracted || (!extracted.vendor_name && !extracted.total_amount && !extracted.invoice_date)) {
        setPhase('error');
        setErrorMessage('Não foi possível extrair informação do documento. Verifique se o ficheiro é uma fatura ou documento legível.');
        return;
      }

      setExtractedData(extracted);
      const description = formatDescriptionFromData(extracted);
      setGeneratedDescription(description);
      setPhase('confirm');

    } catch (error) {
      console.error('Error analyzing attachment:', error);
      setPhase('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao analisar documento');
    }
  };

  const handleApply = () => {
    onDescriptionGenerated(generatedDescription);
    toast.success('Descrição actualizada com sucesso!');
    handleClose();
  };

  const handleClose = () => {
    setPhase('select');
    setSelectedAttachmentId(attachments.length === 1 ? attachments[0].id : '');
    setExtractedData(null);
    setGeneratedDescription('');
    setErrorMessage('');
    onClose();
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    return '📎';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analisar Anexo com AI
          </DialogTitle>
          <DialogDescription>
            {phase === 'select' && 'Selecione o anexo que pretende analisar.'}
            {phase === 'analyzing' && 'A analisar documento...'}
            {phase === 'confirm' && 'Reveja a informação extraída.'}
            {phase === 'error' && 'Ocorreu um erro durante a análise.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {phase === 'select' && (
            <RadioGroup
              value={selectedAttachmentId}
              onValueChange={setSelectedAttachmentId}
              className="space-y-2"
            >
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={attachment.id} id={attachment.id} />
                  <Label
                    htmlFor={attachment.id}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <span className="text-lg">{getFileIcon(attachment.filename)}</span>
                    <span className="truncate">{attachment.filename}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {phase === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">A processar documento...</p>
              <p className="text-xs text-muted-foreground">
                Isto pode demorar alguns segundos.
              </p>
            </div>
          )}

          {phase === 'confirm' && extractedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informação Extraída
                </h4>
                <div className="space-y-2 text-sm">
                  {extractedData.vendor_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fornecedor:</span>
                      <span className="font-medium">{extractedData.vendor_name}</span>
                    </div>
                  )}
                  {extractedData.invoice_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span>{extractedData.invoice_date}</span>
                    </div>
                  )}
                  {extractedData.invoice_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nº Fatura:</span>
                      <span>{extractedData.invoice_number}</span>
                    </div>
                  )}
                  {extractedData.total_amount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(extractedData.total_amount)}
                      </span>
                    </div>
                  )}
                  {extractedData.tax_amount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA:</span>
                      <span>{formatCurrency(extractedData.tax_amount)}</span>
                    </div>
                  )}
                  {extractedData.category && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <span>{extractedData.category}</span>
                    </div>
                  )}
                  {extractedData.line_items_summary && (
                    <div className="pt-2 border-t mt-2">
                      <span className="text-muted-foreground block mb-1">Detalhes:</span>
                      <p className="text-xs whitespace-pre-wrap">
                        {extractedData.line_items_summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === 'select' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleAnalyze} disabled={!selectedAttachmentId}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar
              </Button>
            </>
          )}

          {phase === 'analyzing' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {phase === 'confirm' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleApply}>
                Aplicar à Descrição
              </Button>
            </>
          )}

          {phase === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setPhase('select')}>
                Tentar Novamente
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
