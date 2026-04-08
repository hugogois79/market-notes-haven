
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, StickyNote } from "lucide-react";

interface ValidatorManagementHeaderProps {
  onAddValidator: () => void;
  onAddContactLog: () => void;
  onAddNote: () => void;
}

const ValidatorManagementHeader: React.FC<ValidatorManagementHeaderProps> = ({
  onAddValidator,
  onAddContactLog,
  onAddNote,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">Validator Management</h2>
      <div className="flex gap-2">
        <Button onClick={onAddValidator} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Validator
        </Button>
        <Button variant="outline" onClick={onAddContactLog} size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Add Contact Log
        </Button>
        <Button variant="outline" onClick={onAddNote} size="sm">
          <StickyNote className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>
    </div>
  );
};

export default ValidatorManagementHeader;
