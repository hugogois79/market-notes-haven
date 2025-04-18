
import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Link2, MoreHorizontal, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface KanbanCardProps {
  validator: TaoValidator;
  index: number;
  recentContacts: TaoContactLog[];
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator: TaoValidator) => void;
  onAddNote: (validator: TaoValidator) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  validator,
  index,
  recentContacts,
  onEditValidator,
  onAddContactLog,
  onAddNote,
}) => {
  return (
    <Draggable 
      key={validator.id} 
      draggableId={validator.id} 
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? "opacity-75" : ""}
        >
          <Card className={`bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-move ${
            snapshot.isDragging ? "ring-2 ring-primary shadow-lg" : ""
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
                  <DropdownMenuItem onClick={() => onEditValidator(validator)}>
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
                    Add Contact Log
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddNote(validator)}>
                    Add Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between mb-2">
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

            {recentContacts.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    Last contact: {format(new Date(recentContacts[0].contact_date), "MMM d, yyyy")} 
                    via {recentContacts[0].method}
                  </span>
                </div>
              </div>
            )}

            {validator.wallet_address && (
              <div className="text-xs text-muted-foreground truncate mt-1" title={validator.wallet_address}>
                {validator.wallet_address.substring(0, 8)}...{validator.wallet_address.substring(validator.wallet_address.length - 6)}
              </div>
            )}
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
