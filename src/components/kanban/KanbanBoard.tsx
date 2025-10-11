import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { KanbanList as KanbanListType, KanbanCard } from '@/services/kanbanService';
import { KanbanList } from './KanbanList';
import { KanbanCardModal } from './KanbanCardModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  lists: KanbanListType[];
  cards: KanbanCard[];
  onAddList: (title: string) => void;
  onAddCard: (listId: string, title: string) => void;
  onUpdateCard: (id: string, updates: Partial<KanbanCard>) => void;
  onDeleteCard: (id: string) => void;
  onDeleteList: (listId: string) => void;
  onEditList: (listId: string, title: string) => void;
  onMoveCard: (cardId: string, targetListId: string, newPosition: number) => void;
  onMoveList: (listId: string, newPosition: number) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lists,
  cards,
  onAddList,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onDeleteList,
  onEditList,
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

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board-lists" direction="horizontal" type="list">
          {(provided) => (
            <div 
              className="flex gap-4 overflow-x-auto pb-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {lists.map((list, index) => (
                <KanbanList
                  key={list.id}
                  list={list}
                  index={index}
                  cards={getListCards(list.id)}
                  onAddCard={onAddCard}
                  onCardClick={setSelectedCard}
                  onDeleteList={onDeleteList}
                  onEditList={onEditList}
                />
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
      </DragDropContext>

      {selectedCard && (
        <KanbanCardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={onUpdateCard}
          onDelete={onDeleteCard}
        />
      )}
    </>
  );
};
