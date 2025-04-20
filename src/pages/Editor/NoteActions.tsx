
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Note } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { printNote } from "@/utils/printUtils";

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

  // Handle deleting the note
  const handleDelete = async () => {
    if (!currentNote) return;
    
    try {
      const success = await onDeleteNote(currentNote.id);
      
      if (!success) {
        toast.error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  // Handle printing the note
  const handlePrint = () => {
    if (!currentNote) return;
    
    try {
      printNote(currentNote);
      toast.success("Preparing note for printing...");
    } catch (error) {
      toast.error("Failed to print note");
      console.error("Print error:", error);
    }
  };

  // Determine if the note can have actions (if it's not a new unsaved note)
  const canHaveActions = currentNote && (!isNewNote || !currentNote.id.toString().startsWith("temp-"));

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
      
      {canHaveActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                disabled={isDeleting || !currentNote}
              >
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  note from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default NoteActions;
