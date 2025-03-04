
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Note } from "@/types";
import { supabase } from "@/integrations/supabase/client";
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
  const [categories, setCategories] = useState<string[]>([]);

  // Effect to fetch all unique categories from notes
  useEffect(() => {
    if (notes.length > 0) {
      const uniqueCategories = Array.from(
        new Set(
          notes
            .map(note => note.category)
            .filter(category => category) // Filter out null/undefined
        )
      );
      
      setCategories(uniqueCategories as string[]);
    }
  }, [notes]);

  // Effect to load the note or set up a new one
  useEffect(() => {
    if (noteId === "new") {
      setIsNewNote(true);
      setCurrentNote(undefined);
    } else {
      const foundNote = notes.find(note => note.id === noteId);
      if (foundNote) {
        console.log('Loaded note content:', foundNote.content);
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
    console.log('Attempting to save note with content:', note.content);
    
    const savedNote = await onSaveNote(note);
    
    if (savedNote) {
      console.log('Note saved successfully with content:', savedNote.content);
      
      if (isNewNote) {
        // Redirect to the new note's edit page
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
    } else {
      console.error('Failed to save note');
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
          categories={categories} 
        />
      </div>
    </div>
  );
};

export default Editor;
