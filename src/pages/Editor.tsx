import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Note, Token } from "@/types";
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
import { printNote } from "@/utils/printUtils";
import { getTokensForNote } from "@/services/tokenService";

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  
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
    console.log("Editor: noteId =", noteId);
    
    if (noteId === "new") {
      console.log("Setting up new note");
      setIsNewNote(true);
      // Create a placeholder new note object with default values
      const newNoteTemplate: Note = {
        id: "temp-" + Date.now().toString(),
        title: "Untitled Note",
        content: "",
        tags: [],
        category: "General",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentNote(newNoteTemplate);
      setLinkedTokens([]);
    } else {
      const foundNote = notes.find(note => note.id === noteId);
      if (foundNote) {
        console.log('Loaded note content:', foundNote.content);
        setCurrentNote(foundNote);
        setIsNewNote(false);
        
        // Fetch linked tokens for this note
        const fetchLinkedTokens = async () => {
          try {
            const tokens = await getTokensForNote(foundNote.id);
            setLinkedTokens(tokens);
          } catch (error) {
            console.error("Error fetching linked tokens:", error);
          }
        };
        
        fetchLinkedTokens();
      } else {
        toast.error("Note not found");
        navigate("/notes");
      }
    }
  }, [noteId, notes, navigate]);

  // Handle saving the note
  const handleSave = async (note: Note): Promise<Note | null> => {
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
      toast.success("Note saved successfully");
      
      // Refresh linked tokens
      const tokens = await getTokensForNote(savedNote.id);
      setLinkedTokens(tokens);
      
      return savedNote;
    } else {
      console.error('Failed to save note');
      toast.error("Failed to save note");
      return null;
    }
  };

  // Handle deleting the note
  const handleDelete = async () => {
    if (!currentNote) return;
    
    setIsDeleting(true);
    
    try {
      const success = await onDeleteNote(currentNote.id);
      
      if (success) {
        toast.success("Note deleted successfully");
        navigate("/notes");
      } else {
        toast.error("Failed to delete note");
      }
    } finally {
      setIsDeleting(false);
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
        
        {!isNewNote && currentNote && !currentNote.id.toString().startsWith("temp-") && (
          <div className="flex items-center gap-2">
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
      
      {/* Editor */}
      <div className="flex-1">
        {currentNote && (
          <RichTextEditor 
            note={currentNote} 
            onSave={handleSave}
            categories={categories}
            linkedTokens={linkedTokens}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
