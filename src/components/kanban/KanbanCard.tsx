import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { KanbanCard as KanbanCardType } from '@/services/kanbanService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2, RotateCcw, Paperclip, ListChecks, Tag, Euro } from 'lucide-react';
import { format, isPast, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface KanbanCardProps {
  card: KanbanCardType;
  index: number;
  onClick: () => void;
  onMarkComplete: (cardId: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 hover:bg-green-200',
  medium: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  high: 'bg-red-100 text-red-800 hover:bg-red-200'
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, index, onClick, onMarkComplete }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate if card is overdue
  const isOverdue = card.due_date && !card.concluded ? (() => {
    const dueDate = new Date(card.due_date);
    return isPast(startOfDay(dueDate)) && startOfDay(dueDate).getTime() !== startOfDay(new Date()).getTime();
  })() : false;

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(card.id);
  };

  const handleReopen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(card.id);
    toast.success('Card reopened');
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 cursor-pointer hover:shadow-md transition-shadow relative ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          } ${isOverdue ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800' : ''}`}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && !card.concluded && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-primary shadow-lg hover:bg-primary hover:text-primary-foreground z-10 p-0"
              onClick={handleMarkComplete}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          
          {isHovered && card.concluded && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-orange-500 shadow-lg hover:bg-orange-500 hover:text-white z-10 p-0"
              onClick={handleReopen}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          
          <CardContent className="p-3">
            <h4 className="font-medium text-sm mb-2">{card.title}</h4>
            
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {card.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              {card.priority && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${priorityColors[card.priority]}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {card.priority}
                </Badge>
              )}
              
              {card.due_date && (() => {
                const dueDate = new Date(card.due_date);
                const isOverdue = isPast(startOfDay(dueDate)) && startOfDay(dueDate).getTime() !== startOfDay(new Date()).getTime();
                return (
                  <Badge variant="outline" className={`text-xs ${isOverdue ? 'border-red-500' : ''}`}>
                    <Calendar className={`h-3 w-3 mr-1 ${isOverdue ? 'text-red-500' : ''}`} />
                    {isOverdue && '! '}
                    {format(dueDate, 'MMM dd')}
                  </Badge>
                );
              })()}
              
              {card.tasks && Array.isArray(card.tasks) && card.tasks.length > 0 && (() => {
                const completed = card.tasks.filter((t: any) => t.completed).length;
                const total = card.tasks.length;
                return (
                  <Badge variant="outline" className="text-xs">
                    <ListChecks className="h-3 w-3 mr-1" />
                    {completed}/{total}
                  </Badge>
                );
              })()}
              
              {card.attachment_count && card.attachment_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {card.attachment_count}
                </Badge>
              )}
              
              {card.value && card.value > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  <Euro className="h-3 w-3 mr-1" />
                  {card.value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Badge>
              )}
              
              {card.tags && card.tags.length > 0 && card.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};
