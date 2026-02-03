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
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, AlertCircle, Tag, CheckSquare, CalendarDays, Euro, Flag } from 'lucide-react';
import { KanbanAttachment } from '@/services/kanbanService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// New interface matching Kanban card fields
export interface ExtractedKanbanData {
  description?: string;
  value?: number;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  suggested_tags?: string[];
  suggested_tasks?: string[];
  summary?: string; // fallback from n8n
}

interface AiAttachmentAnalyzerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: KanbanAttachment[];
  cardId: string;
  onDataExtracted: (data: ExtractedKanbanData) => void;
}

type DialogPhase = 'select' | 'analyzing' | 'confirm' | 'error';

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
};

export const AiAttachmentAnalyzerDialog: React.FC<AiAttachmentAnalyzerDialogProps> = ({
  isOpen,
  onClose,
  attachments,
  cardId,
  onDataExtracted,
}) => {
  const [phase, setPhase] = useState<DialogPhase>('select');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>(
    attachments.length === 1 ? attachments[0].id : ''
  );
  const [extractedData, setExtractedData] = useState<ExtractedKanbanData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedAttachment = attachments.find(a => a.id === selectedAttachmentId);

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

      const extracted = data.data as ExtractedKanbanData;
      
      // Check if we got any meaningful data (using new Kanban fields)
      if (!extracted || (!extracted.description && !extracted.value && !extracted.summary)) {
        setPhase('error');
        setErrorMessage('Não foi possível extrair informação do documento. Verifique se o ficheiro é um documento legível.');
        return;
      }

      setExtractedData(extracted);
      setPhase('confirm');

    } catch (error) {
      console.error('Error analyzing attachment:', error);
      setPhase('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao analisar documento');
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      toast.success('Dados aplicados com sucesso!');
    }
    handleClose();
  };

  const handleClose = () => {
    setPhase('select');
    setSelectedAttachmentId(attachments.length === 1 ? attachments[0].id : '');
    setExtractedData(null);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analisar Anexo com AI
          </DialogTitle>
          <DialogDescription>
            {phase === 'select' && 'Selecione o anexo que pretende analisar.'}
            {phase === 'analyzing' && 'A analisar documento...'}
            {phase === 'confirm' && 'Reveja os dados extraídos para o card.'}
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
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dados Extraídos para o Card
                </h4>
                
                <div className="space-y-4">
                  {/* Description */}
                  {(extractedData.description || extractedData.summary) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Descrição
                      </div>
                      <p className="text-sm bg-background p-3 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {extractedData.description || extractedData.summary}
                      </p>
                    </div>
                  )}

                  {/* Value */}
                  {extractedData.value !== undefined && extractedData.value > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Euro className="h-3.5 w-3.5" />
                        Valor
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(extractedData.value)}
                      </span>
                    </div>
                  )}

                  {/* Due Date */}
                  {extractedData.due_date && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Data de Entrega
                      </div>
                      <span className="text-sm">{extractedData.due_date}</span>
                    </div>
                  )}

                  {/* Priority */}
                  {extractedData.priority && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Flag className="h-3.5 w-3.5" />
                        Prioridade
                      </div>
                      <Badge className={priorityLabels[extractedData.priority]?.color || ''}>
                        {priorityLabels[extractedData.priority]?.label || extractedData.priority}
                      </Badge>
                    </div>
                  )}

                  {/* Tags */}
                  {extractedData.suggested_tags && extractedData.suggested_tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-3.5 w-3.5" />
                        Tags Sugeridas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.suggested_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {extractedData.suggested_tasks && extractedData.suggested_tasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Tarefas Sugeridas
                      </div>
                      <ul className="space-y-1.5">
                        {extractedData.suggested_tasks.map((task, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
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
                Aplicar ao Card
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
