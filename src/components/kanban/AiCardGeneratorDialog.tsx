import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedCard {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  selected: boolean;
}

interface AiCardGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCardsCreated: (cards: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }>) => void;
}

export const AiCardGeneratorDialog: React.FC<AiCardGeneratorDialogProps> = ({
  isOpen,
  onClose,
  onCardsCreated,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedCards, setExtractedCards] = useState<ExtractedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCards = async () => {
    if (inputText.length < 50) {
      toast.error('O texto deve ter pelo menos 50 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('generate-tasks-from-text', {
        body: { text: inputText }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const cards: ExtractedCard[] = (data.tasks || []).map((t: any) => ({
        ...t,
        selected: true
      }));

      if (cards.length === 0) {
        setError('Não foram encontrados cards acionáveis no texto.');
      } else {
        setExtractedCards(cards);
      }
    } catch (err) {
      console.error('Error generating cards:', err);
      const message = err instanceof Error ? err.message : 'Erro ao gerar cards';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardSelection = (index: number) => {
    setExtractedCards(prev => 
      prev.map((card, i) => 
        i === index ? { ...card, selected: !card.selected } : card
      )
    );
  };

  const handleCreateCards = () => {
    const selectedCards = extractedCards.filter(c => c.selected);
    if (selectedCards.length === 0) {
      toast.error('Selecione pelo menos um card');
      return;
    }

    onCardsCreated(selectedCards.map(({ title, description, priority }) => ({
      title,
      description,
      priority
    })));

    handleClose();
  };

  const handleClose = () => {
    setInputText('');
    setExtractedCards([]);
    setError(null);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return '';
    }
  };

  const selectedCount = extractedCards.filter(c => c.selected).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Cards com AI
          </DialogTitle>
        </DialogHeader>

        {extractedCards.length === 0 ? (
          // Input phase
          <div className="space-y-4">
            <div>
              <Label>Cole o texto para extrair cards</Label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui um relatório, email ou qualquer texto do qual pretende extrair cards..."
                rows={12}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 50 caracteres ({inputText.length}/50)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerateCards}
                disabled={isLoading || inputText.length < 50}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Cards
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Results phase
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {extractedCards.length} card(s) encontrado(s). Selecione os que pretende criar:
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {extractedCards.map((card, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    card.selected ? 'bg-accent/50 border-accent' : 'bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={card.selected}
                    onCheckedChange={() => toggleCardSelection(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{card.title}</span>
                      <Badge variant="outline" className={getPriorityColor(card.priority)}>
                        {card.priority}
                      </Badge>
                    </div>
                    <div
                      className="text-sm text-muted-foreground mt-1 line-clamp-2 prose prose-sm dark:prose-invert max-w-none [&>*]:m-0 [&>*]:text-sm"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(card.description || ''),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setExtractedCards([])}>
                Voltar
              </Button>
              <Button 
                onClick={handleCreateCards}
                disabled={selectedCount === 0}
              >
                Criar {selectedCount} Card{selectedCount !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
