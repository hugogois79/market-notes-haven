
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
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

interface EditorProps {
  notes: Note[];
  onSaveNote: (note: Note) => Promise<Note | null>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

const Editor = ({ notes, onSaveNote, onDeleteNote }: EditorProps) => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [currentNote, setCurrentNote] = useState<Note | undefined>(undefined);
  const [isNewNote, setIsNewNote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Effect to load the note or set up a new one
  useEffect(() => {
    if (noteId === "new") {
      setIsNewNote(true);
      setCurrentNote(undefined);
    } else {
      const foundNote = notes.find(note => note.id === noteId);
      if (foundNote) {
        setCurrentNote(foundNote);
        setIsNewNote(false);
      } else {
        toast.error("Note not found");
        navigate("/");
      }
    }
  }, [noteId, notes, navigate]);

  // Handle saving the note
  const handleSave = async (note: Note) => {
    const savedNote = await onSaveNote(note);
    
    if (savedNote) {
      if (isNewNote) {
        // Redirect to the new note's edit page
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
    }
  };

  // Handle deleting the note
  const handleDelete = async () => {
    if (!currentNote) return;
    
    setIsDeleting(true);
    
    try {
      const success = await onDeleteNote(currentNote.id);
      
      if (success) {
        navigate("/");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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
        
        {!isNewNote && currentNote && (
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
        )}
      </div>
      
      {/* Editor */}
      <div className="flex-1">
        <RichTextEditor 
          note={currentNote} 
          onSave={handleSave} 
        />
      </div>
    </div>
  );
};

export default Editor;
