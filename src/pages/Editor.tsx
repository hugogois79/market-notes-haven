import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Printer, FileIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Note, Token, Tag } from "@/types";
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
import { fetchTags } from "@/services/tagService";

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
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
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

  // Effect to load tokens and tags
  useEffect(() => {
    const loadTokensAndTags = async () => {
      setIsLoadingTokens(true);
      setIsLoadingTags(true);
      
      try {
        // Fetch tokens (assuming there's a fetchTokens function in tokenService)
        const tokens = await getTokensForNote('all');
        setAllTokens(tokens);
        
        // Fetch tags
        const tags = await fetchTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tokens and tags:", error);
      } finally {
        setIsLoadingTokens(false);
        setIsLoadingTags(false);
      }
    };
    
    loadTokensAndTags();
  }, []);

  // Effect to load the note or set up a new one
  useEffect(() => {
    console.log("Editor: noteId =", noteId);
    console.log("Notes available:", notes.length);
    
    if (noteId === "new") {
      console.log("Setting up new note");
      setIsNewNote(true);
      // Create a placeholder new note object with default values
      const newNoteTemplate: Note = {
        id: "temp-" + Date.now().toString(),
        title: "Untitled Note",
        content: "",
        summary: "",
        tags: [],
        category: "General",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCurrentNote(newNoteTemplate);
      setLinkedTokens([]);
    } else if (notes.length > 0) {
      const foundNote = notes.find(note => note.id === noteId);
      console.log("Found note:", foundNote);
      
      if (foundNote) {
        console.log('Loaded note content:', foundNote.content);
        setCurrentNote(foundNote);
        setIsNewNote(false);
        
        // Fetch linked tokens for this note
        const fetchLinkedTokens = async () => {
          try {
            setIsLoadingTokens(true);
            const tokens = await getTokensForNote(foundNote.id);
            setLinkedTokens(tokens);
          } catch (error) {
            console.error("Error fetching linked tokens:", error);
          } finally {
            setIsLoadingTokens(false);
          }
        };
        
        fetchLinkedTokens();
      } else {
        // Note not found, redirect to notes list
        toast.error("Note not found");
        navigate("/notes");
      }
    }
    // If notes hasn't loaded yet, we'll wait for the next render when notes are available
  }, [noteId, notes, navigate]);

  // Handle saving the note
  const handleSave = async (updatedFields: Partial<Note>): Promise<void> => {
    if (!currentNote) return;
    
    console.log('Updating note with fields:', updatedFields);
    
    // Merge the updated fields with the current note
    const updatedNote: Note = {
      ...currentNote,
      ...updatedFields,
      updatedAt: new Date()
    };
    
    // Only update tokens if they were changed
    if (updatedFields.tokens) {
      setLinkedTokens(updatedFields.tokens);
    }
    
    const savedNote = await onSaveNote(updatedNote);
    
    if (savedNote) {
      console.log('Note saved successfully');
      
      if (isNewNote) {
        // Redirect to the new note's edit page
        navigate(`/editor/${savedNote.id}`, { replace: true });
        setIsNewNote(false);
      }
      
      setCurrentNote(savedNote);
      toast.success("Note saved successfully");
    } else {
      console.error('Failed to save note');
      toast.error("Failed to save note");
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

  // Handle title change
  const handleTitleChange = (title: string) => {
    if (!currentNote) return;
    handleSave({ title });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    if (!currentNote) return;
    handleSave({ category });
  };

  // Show a loading state if we're still waiting for notes to load
  if (!currentNote && notes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

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
      
      {/* Editor */}
      <div className="flex-1">
        {currentNote && (
          <RichTextEditor 
            title={currentNote.title}
            content={currentNote.content}
            category={currentNote.category || "General"}
            onTitleChange={handleTitleChange}
            onContentChange={(content) => handleSave({ content })}
            onCategoryChange={handleCategoryChange}
            linkedTags={currentNote.tags.map(tagId => {
              // If allTags is loaded, find the tag object
              const foundTag = allTags.find(t => t.id === tagId);
              return foundTag || { id: tagId, name: tagId };
            })}
            onTagsChange={(tags) => handleSave({ tags: tags.map(t => typeof t === 'string' ? t : t.id) })}
            linkedTokens={linkedTokens}
            onTokensChange={(tokens) => handleSave({ tokens })}
            noteId={currentNote.id}
            attachment_url={currentNote.attachment_url}
            onAttachmentChange={(url) => handleSave({ attachment_url: url || undefined })}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
