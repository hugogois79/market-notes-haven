
import React from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Mail, MessageCircle, Link2, GripVertical } from "lucide-react";
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
    <Draggable draggableId={validator.id} index={index} key={validator.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-75 z-50' : ''}`}
        >
          <Card className={`shadow-sm transition-all ${snapshot.isDragging ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="p-3 flex flex-row items-center">
              <div {...provided.dragHandleProps} className="mr-2 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
              <div className="flex justify-between items-start flex-1">
                <CardTitle className="text-base">{validator.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-mr-2 h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(validator)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Add Contact Log
                    </DropdownMenuItem>
                    {getAvailableStages(validator.crm_stage).map(
                      (newStage) => (
                        <DropdownMenuItem
                          key={newStage}
                          onClick={() => onMoveStage(validator, newStage)}
                        >
                          Move to {newStage}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex justify-between items-center mb-2">
                <Badge
                  className={`${getPriorityColor(
                    validator.priority
                  )} border-0`}
                >
                  {validator.priority}
                </Badge>
                <div className="flex space-x-1">
                  {validator.email && (
                    <a
                      href={`mailto:${validator.email}`}
                      className="text-blue-600 hover:text-blue-800"
                      title={validator.email}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                  {validator.telegram && (
                    <a
                      href={`https://t.me/${validator.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title={validator.telegram}
                    >
                      <MessageCircle size={14} />
                    </a>
                  )}
                  {validator.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${validator.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title={`linkedin.com/in/${validator.linkedin}`}
                    >
                      <Link2 size={14} />
                    </a>
                  )}
                </div>
              </div>
              {validator.wallet_address && (
                <div className="mt-2 text-xs text-muted-foreground truncate" title={validator.wallet_address}>
                  {validator.wallet_address.substring(0, 10)}...{validator.wallet_address.substring(validator.wallet_address.length - 6)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default ValidatorCard;
