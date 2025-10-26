import React, { useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { KanbanList as KanbanListType, KanbanCard } from '@/services/kanbanService';
import { KanbanCard as KanbanCardComponent } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, GripVertical, ChevronDown, ChevronRight, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface KanbanListProps {
  list: KanbanListType;
  index: number;
  cards: KanbanCard[];
  onAddCard: (listId: string, title: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onUpdateCard: (cardId: string, updates: Partial<KanbanCard>) => void;
  onDeleteList: (listId: string) => void;
  onEditList: (listId: string, title: string) => void;
  onColorChange: (listId: string, color: string) => void;
}

const LIST_COLORS = [
  { name: 'Gray', value: '#f3f4f6' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Green', value: '#dcfce7' },
  { name: 'Yellow', value: '#fef9c3' },
  { name: 'Red', value: '#fee2e2' },
  { name: 'Purple', value: '#f3e8ff' },
  { name: 'Orange', value: '#ffedd5' },
  { name: 'Pink', value: '#fce7f3' },
];

export const KanbanList: React.FC<KanbanListProps> = ({
  list,
  index,
  cards,
  onAddCard,
  onCardClick,
  onUpdateCard,
  onDeleteList,
  onEditList,
  onColorChange
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <Draggable draggableId={list.id} index={index}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 ${
            isCollapsed ? 'w-12' : 'w-80'
          } rounded-lg transition-all duration-200 ${
            snapshot.isDragging ? 'opacity-50 shadow-lg' : ''
          }`}
          style={{
            backgroundColor: list.color || '#f3f4f6',
            ...provided.draggableProps.style
          }}
        >
          {isCollapsed ? (
            // Collapsed view - vertical
            <div className="flex flex-col items-center h-full min-h-[200px] p-3">
              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
              
              <button
                onClick={() => setIsCollapsed(false)}
                className="p-1 hover:bg-muted rounded mb-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              <div 
                className="flex-1 flex items-center justify-center cursor-pointer"
                onClick={() => setIsCollapsed(false)}
              >
                <h3 
                  className="font-semibold text-sm whitespace-nowrap"
                  style={{ 
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed'
                  }}
                >
                  {list.title}
                </h3>
              </div>
            </div>
          ) : (
            // Expanded view - normal
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </div>
                  
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

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
                      className="font-semibold cursor-pointer hover:opacity-70 flex-1"
                      onDoubleClick={() => setIsEditingTitle(true)}
                    >
                      {list.title}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({cards.length})
                      </span>
                    </h3>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsCollapsed(!isCollapsed)}>
                      Collapse List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                      Edit Title
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Background Color
                    </div>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {LIST_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => onColorChange(list.id, color.value)}
                          className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform"
                          style={{ 
                            backgroundColor: color.value,
                            borderColor: list.color === color.value ? '#000' : 'transparent'
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDeleteList(list.id)}
                      className="text-destructive"
                    >
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Droppable droppableId={list.id} type="card">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-muted' : ''
                    } rounded-md p-2 transition-colors`}
                  >
                    {cards.map((card, cardIndex) => (
                      <KanbanCardComponent
                        key={card.id}
                        card={card}
                        index={cardIndex}
                        onClick={() => onCardClick(card)}
                        onMarkComplete={(cardId) => onUpdateCard(cardId, {
                          concluded: true,
                          completed: true,
                          archived: true,
                          completed_at: new Date().toISOString()
                        })}
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
          )}
        </div>
      )}
    </Draggable>
  );
};
