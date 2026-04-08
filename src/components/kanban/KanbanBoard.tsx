import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { KanbanList as KanbanListType, KanbanCard } from '@/services/kanbanService';
import { KanbanList } from './KanbanList';
import { KanbanCardModal } from './KanbanCardModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  boardId: string;
  lists: KanbanListType[];
  cards: KanbanCard[];
  onAddList: (title: string) => void;
  onAddCard: (listId: string, title: string) => void;
  onUpdateCard: (id: string, updates: Partial<KanbanCard>) => void;
  onDeleteCard: (id: string) => void;
  onDeleteList: (listId: string) => void;
  onEditList: (listId: string, title: string) => void;
  onColorChange: (listId: string, color: string) => void;
  onArchiveList: (listId: string) => void;
  onMoveCard: (cardId: string, targetListId: string, newPosition: number) => void;
  onMoveList: (listId: string, newPosition: number) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  lists,
  cards,
  onAddList,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onDeleteList,
  onEditList,
  onColorChange,
  onArchiveList,
  onMoveCard,
  onMoveList
}) => {
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const handleAddList = () => {
    if (newListTitle.trim()) {
      onAddList(newListTitle);
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle list reordering
    if (type === 'list') {
      onMoveList(draggableId, destination.index);
      return;
    }

    // Handle card movement
    onMoveCard(draggableId, destination.droppableId, destination.index);
  };

  const getListCards = (listId: string) => {
    return cards.filter(card => card.list_id === listId);
  };

  const handleMoveCard = async (cardId: string, newListId: string, newBoardId: string) => {
    // If moving to a different board, navigate there
    if (newBoardId !== boardId) {
      // Get the card's current position in the new list
      const targetListCards = cards.filter(c => c.list_id === newListId);
      const newPosition = targetListCards.length;
      
      await onMoveCard(cardId, newListId, newPosition);
      toast.success('Card moved to another board');
      
      // Close modal and navigate
      setSelectedCard(null);
      window.location.href = `/kanban/${newBoardId}`;
    } else {
      // Moving within the same board
      const targetListCards = cards.filter(c => c.list_id === newListId);
      const newPosition = targetListCards.length;
      await onMoveCard(cardId, newListId, newPosition);
    }
  };


  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-transparent pb-2" style={{ scrollbarGutter: 'stable' }}>
          <Droppable droppableId="all-lists" direction="horizontal" type="list">
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 pb-4 min-w-min"
              >
                {lists.map((list, index) => (
                  <Draggable 
                    key={list.id} 
                    draggableId={list.id} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <KanbanList
                          list={list}
                          index={index}
                          cards={getListCards(list.id)}
                          boardId={boardId}
                          onAddCard={onAddCard}
                          onCardClick={setSelectedCard}
                          onUpdateCard={onUpdateCard}
                          onMoveCard={(cardId, targetListId) => {
                            const targetListCards = cards.filter(c => c.list_id === targetListId);
                            onMoveCard(cardId, targetListId, targetListCards.length);
                          }}
                          onDeleteList={onDeleteList}
                          onEditList={onEditList}
                          onColorChange={onColorChange}
                          onArchiveList={onArchiveList}
                          onDeleteCard={onDeleteCard}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {isAddingList ? (
                  <div className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-3">
                    <Input
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') setIsAddingList(false);
                      }}
                      autoFocus
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddList}>
                        Add List
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsAddingList(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="flex-shrink-0 w-80 h-auto min-h-[100px] border-2 border-dashed"
                    onClick={() => setIsAddingList(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add List
                  </Button>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      {selectedCard && (
        <KanbanCardModal
          card={selectedCard}
          boardId={boardId}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={onUpdateCard}
          onDelete={onDeleteCard}
          onMove={handleMoveCard}
        />
      )}
    </>
  );
};
