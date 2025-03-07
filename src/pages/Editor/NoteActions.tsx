
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Printer, FileIcon, ExternalLink } from "lucide-react";
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
  const [isPrinting, setIsPrinting] = useState(false);

  // Function to get file name from attachment URL
  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || "attachment";
    } catch (error) {
      return "attachment";
    }
  };

  // Handle deleting the note
  const handleDelete = async () => {
    if (!currentNote) return;
    
    try {
      const success = await onDeleteNote(currentNote.id);
      
      if (success) {
        toast.success("Note deleted successfully");
        navigate("/notes");
      } else {
        toast.error("Failed to delete note");
      }
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Handle printing the note
  const handlePrint = () => {
    if (!currentNote) return;
    
    setIsPrinting(true);
    
    try {
      printNote(currentNote);
      toast.success("Preparing note for printing...");
    } catch (error) {
      toast.error("Failed to print note");
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

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
      
      {!isNewNote && currentNote && !currentNote.id.toString().startsWith("temp-") && (
        <div className="flex items-center gap-2">
          {currentNote.attachment_url && (
            <a 
              href={currentNote.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileIcon size={14} />
              <span className="hidden sm:inline">{getFilenameFromUrl(currentNote.attachment_url)}</span>
              <ExternalLink size={14} />
            </a>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer size={16} />
            {isPrinting ? "Printing..." : "Print"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-2"
                disabled={isDeleting}
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
