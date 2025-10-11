import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { KanbanList as KanbanListType, KanbanCard } from '@/services/kanbanService';
import { KanbanCard as KanbanCardComponent } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanListProps {
  list: KanbanListType;
  cards: KanbanCard[];
  onAddCard: (listId: string, title: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onDeleteList: (listId: string) => void;
  onEditList: (listId: string, title: string) => void;
}

export const KanbanList: React.FC<KanbanListProps> = ({
  list,
  cards,
  onAddCard,
  onCardClick,
  onDeleteList,
  onEditList
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle);
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleEditTitle = () => {
    if (editedTitle.trim() && editedTitle !== list.title) {
      onEditList(list.id, editedTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        {isEditingTitle ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleEditTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleEditTitle()}
            className="font-semibold h-8"
            autoFocus
          />
        ) : (
          <h3 
            className="font-semibold cursor-pointer hover:opacity-70"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {list.title}
          </h3>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              Edit Title
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteList(list.id)}
              className="text-destructive"
            >
              Delete List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] ${
              snapshot.isDraggingOver ? 'bg-muted' : ''
            } rounded-md p-2 transition-colors`}
          >
            {cards.map((card, index) => (
              <KanbanCardComponent
                key={card.id}
                card={card}
                index={index}
                onClick={() => onCardClick(card)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isAddingCard ? (
        <div className="mt-2 space-y-2">
          <Input
            placeholder="Enter card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCard();
              if (e.key === 'Escape') setIsAddingCard(false);
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddCard}>
              Add Card
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsAddingCard(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full mt-2 justify-start"
          onClick={() => setIsAddingCard(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      )}
    </div>
  );
};
