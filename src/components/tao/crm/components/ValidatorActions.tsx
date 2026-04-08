
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Clock, Edit, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { TaoValidator } from "@/services/taoValidatorService";

interface ValidatorActionsProps {
  validator: TaoValidator;
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator: TaoValidator) => void;
  onAddNote: (validator: TaoValidator) => void;
  onDeleteValidator: (validator: TaoValidator) => void;
}

export const ValidatorActions: React.FC<ValidatorActionsProps> = ({
  validator,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onDeleteValidator,
}) => {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEditValidator(validator)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
            <Clock className="h-4 w-4 mr-2" />
            Add Contact Log
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNote(validator)}>
            <FileText className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDeleteValidator(validator)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
