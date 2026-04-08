
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { TaoNote, TaoValidator } from "@/services/taoValidatorService";

interface RecentNotesProps {
  notes: TaoNote[];
  validator: TaoValidator;
  onAddNote: (validator: TaoValidator) => void;
}

export const RecentNotes: React.FC<RecentNotesProps> = ({
  notes,
  validator,
  onAddNote,
}) => {
  if (notes.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => onAddNote(validator)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add first note
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map(note => (
        <div key={note.id} className="flex items-start">
          <div className="flex-shrink-0 mr-2 mt-0.5">
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-medium line-clamp-1">{note.title}</div>
            <div className="text-muted-foreground line-clamp-1">
              {note.content?.substring(0, 50) || "No content"}
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-6 mt-1"
        onClick={() => onAddNote(validator)}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add note
      </Button>
    </div>
  );
};
