
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Note } from "@/types";

interface NoteActionsProps {
  currentNote: Note | undefined;
  isNewNote: boolean;
  isDeleting: boolean;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

const NoteActions: React.FC<NoteActionsProps> = ({
  currentNote,
  isNewNote,
  isDeleting,
  onDeleteNote,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
    </div>
  );
};

export default NoteActions;
