import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MoveRight, X } from 'lucide-react';
import { KanbanService, KanbanList, KanbanBoard } from '@/services/kanbanService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface CompleteCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: () => void;
  onMove: (listId: string) => void;
  cardTitle: string;
  currentListId: string;
  boardId: string;
}

export const CompleteCardDialog: React.FC<CompleteCardDialogProps> = ({
  isOpen,
  onClose,
  onConfirmComplete,
  onMove,
  cardTitle,
  currentListId,
  boardId,
}) => {
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [lists, setLists] = useState<KanbanList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && showMoveOptions) {
      loadLists();
    }
  }, [isOpen, showMoveOptions, boardId]);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const boardLists = await KanbanService.getLists(boardId);
      // Filter out current list
      const otherLists = boardLists.filter(list => list.id !== currentListId);
      setLists(otherLists);
      if (otherLists.length > 0) {
        setSelectedListId(otherLists[0].id);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveClick = () => {
    setShowMoveOptions(true);
  };

  const handleConfirmMove = () => {
    if (selectedListId) {
      onMove(selectedListId);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowMoveOptions(false);
    setSelectedListId('');
    onClose();
  };

  const handleConfirmComplete = () => {
    onConfirmComplete();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Concluir tarefa
          </DialogTitle>
          <DialogDescription>
            Tens a certeza que queres concluir "{cardTitle}"?
          </DialogDescription>
        </DialogHeader>

        {showMoveOptions ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecionar lista de destino</Label>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">A carregar listas...</p>
              ) : lists.length === 0 ? (
                <p className="text-sm text-muted-foreground">Não existem outras listas neste board.</p>
              ) : (
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowMoveOptions(false)}>
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmMove} 
                disabled={!selectedListId || lists.length === 0}
              >
                <MoveRight className="h-4 w-4 mr-2" />
                Mover
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              onClick={handleConfirmComplete} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Sim, concluir
            </Button>
            <Button 
              variant="outline" 
              onClick={handleMoveClick}
              className="w-full"
            >
              <MoveRight className="h-4 w-4 mr-2" />
              Mover para outra lista
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleClose}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
