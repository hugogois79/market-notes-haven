import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { KanbanCard as KanbanCardType } from '@/services/kanbanService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanCardProps {
  card: KanbanCardType;
  index: number;
  onClick: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 hover:bg-green-200',
  medium: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  high: 'bg-red-100 text-red-800 hover:bg-red-200'
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, index, onClick }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          }`}
          onClick={onClick}
        >
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
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};
