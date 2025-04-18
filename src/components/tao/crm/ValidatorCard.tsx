
import React from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Link2, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Draggable } from 'react-beautiful-dnd';

interface ValidatorCardProps {
  validator: TaoValidator;
  index: number;
  onView: (validator: TaoValidator) => void;
  onMoveStage: (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => void;
  getAvailableStages: (currentStage: TaoValidator["crm_stage"]) => TaoValidator["crm_stage"][];
  getPriorityColor: (priority: TaoValidator["priority"]) => string;
}

const ValidatorCard: React.FC<ValidatorCardProps> = ({
  validator,
  index,
  onView,
  onMoveStage,
  getAvailableStages,
  getPriorityColor,
}) => {
  return (
    <Draggable draggableId={validator.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'opacity-75' : ''}
        >
          <Card className={`bg-white p-3 shadow-sm transition-all ${
            snapshot.isDragging ? 'ring-2 ring-primary shadow-lg' : ''
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{validator.name}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(validator)}>
                    View Details
                  </DropdownMenuItem>
                  {getAvailableStages(validator.crm_stage).map((newStage) => (
                    <DropdownMenuItem
                      key={newStage}
                      onClick={() => onMoveStage(validator, newStage)}
                    >
                      Move to {newStage}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <Badge className={getPriorityColor(validator.priority)}>
                {validator.priority}
              </Badge>
              <div className="flex space-x-1">
                {validator.email && (
                  <a
                    href={`mailto:${validator.email}`}
                    className="text-gray-500 hover:text-blue-600"
                    title={validator.email}
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                )}
                {validator.telegram && (
                  <a
                    href={`https://t.me/${validator.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600"
                    title={validator.telegram}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
                {validator.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${validator.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600"
                    title={`linkedin.com/in/${validator.linkedin}`}
                  >
                    <Link2 className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {validator.wallet_address && (
              <div className="text-xs text-muted-foreground truncate" title={validator.wallet_address}>
                {validator.wallet_address.substring(0, 10)}...{validator.wallet_address.substring(validator.wallet_address.length - 6)}
              </div>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default ValidatorCard;
