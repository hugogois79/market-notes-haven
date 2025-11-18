import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { KanbanCard as KanbanCardType } from '@/services/kanbanService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2, RotateCcw, Paperclip, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
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

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkComplete(card.id);
    toast.success('Card marked as complete and archived');
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
          }`}
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
              
              {card.due_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(card.due_date), 'MMM dd')}
                </Badge>
              )}
              
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
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};
