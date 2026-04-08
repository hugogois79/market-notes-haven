import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, AlertCircle, Tag, CheckSquare, CalendarDays, Euro, Flag, X } from 'lucide-react';
import { KanbanAttachment, KanbanService } from '@/services/kanbanService';
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
  /** Direct save: pass current card data so we can persist immediately */
  currentCard?: {
    title: string;
    description: string;
    priority: string;
    value: number;
    starting_date?: string;
    due_date?: string;
    tasks: any[];
    tags: string[];
    assigned_to: string[];
    assigned_external: string[];
    supervisor_id: string | null;
  };
  /** Called after direct DB save succeeds to refresh parent state */
  onSaved?: () => void;
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
  currentCard,
  onSaved,
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
          storagePath: (selectedAttachment as any).storage_path,
          fileName: selectedAttachment.filename,
          mimeType: selectedAttachment.file_type || 'application/octet-stream',
          cardId,
          attachmentId: selectedAttachment.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Handle file not found (orphan cleaned)
      if (!data.success && data.error === 'file_not_found') {
        setPhase('error');
        setErrorMessage('O ficheiro não existe no storage. ' + 
          (data.orphanCleaned 
            ? 'O registo órfão foi removido. Por favor, recarregue os anexos e faça upload novamente.' 
            : 'Verifique se o ficheiro foi eliminado.')
        );
        return;
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

  const [isSaving, setIsSaving] = useState(false);

  const handleApply = async () => {
    if (!extractedData) return;

    setIsSaving(true);
    try {
      // Build merged update from extracted data
      const newDescription = extractedData.description || extractedData.summary || currentCard?.description || '';
      const newValue = (extractedData.value !== undefined && extractedData.value > 0) ? extractedData.value : (currentCard?.value || 0);
      const newPriority = extractedData.priority || currentCard?.priority || 'medium';

      let newDueDate = currentCard?.due_date;
      if (extractedData.due_date) {
        const parsedDate = new Date(extractedData.due_date);
        if (!isNaN(parsedDate.getTime())) {
          newDueDate = extractedData.due_date;
        }
      }

      const existingTags = currentCard?.tags || [];
      let newTags = [...existingTags];
      if (extractedData.suggested_tags && extractedData.suggested_tags.length > 0) {
        const additionalTags = extractedData.suggested_tags.filter(t => !existingTags.includes(t));
        if (additionalTags.length > 0) {
          newTags = [...existingTags, ...additionalTags];
        }
      }

      const existingTasks = currentCard?.tasks || [];
      let newTasks = [...existingTasks];
      if (extractedData.suggested_tasks && extractedData.suggested_tasks.length > 0) {
        const additionalTasks = extractedData.suggested_tasks.map(taskText => ({
          id: crypto.randomUUID(),
          text: taskText,
          completed: false
        }));
        newTasks = [...existingTasks, ...additionalTasks];
      }

      // Save directly to database - bypasses any dialog/state issues
      await KanbanService.updateCard(cardId, {
        description: newDescription,
        priority: newPriority as any,
        value: newValue,
        due_date: newDueDate || undefined,
        tasks: newTasks as any,
        tags: newTags as any,
      });

      // Also notify parent to update local state
      onDataExtracted(extractedData);
      onSaved?.();

      toast.success('Dados aplicados e gravados com sucesso!');
      handleClose();
    } catch (error) {
      console.error('Error saving card data:', error);
      toast.error('Erro ao gravar dados no card. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  // Render via portal to avoid Radix Dialog focus trap conflicts
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal content */}
      <div
        className="relative bg-background border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Analisar Anexo com AI
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {phase === 'select' && 'Selecione o anexo que pretende analisar.'}
              {phase === 'analyzing' && 'A analisar documento...'}
              {phase === 'confirm' && 'Reveja os dados extraídos para o card.'}
              {phase === 'error' && 'Ocorreu um erro durante a análise.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {phase === 'select' && (
            <RadioGroup
              value={selectedAttachmentId}
              onValueChange={setSelectedAttachmentId}
              className="space-y-2"
            >
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={attachment.id} id={`ai-att-${attachment.id}`} className="mt-1 shrink-0" />
                  <Label
                    htmlFor={`ai-att-${attachment.id}`}
                    className="flex items-start gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="text-lg shrink-0">{getFileIcon(attachment.filename)}</span>
                    <span className="break-words text-sm">{attachment.filename}</span>
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

                  {extractedData.due_date && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Data de Entrega
                      </div>
                      <span className="text-sm">{extractedData.due_date}</span>
                    </div>
                  )}

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

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 pt-4 border-t">
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
              <Button variant="outline" onClick={handleClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleApply} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A gravar...
                  </>
                ) : (
                  'Aplicar ao Card'
                )}
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
        </div>
      </div>
    </div>,
    document.body
  );
};
