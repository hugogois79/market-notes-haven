
import React, { useState, useEffect } from "react";
import { Note } from "@/types";
import { useNotes } from "@/contexts/NotesContext";
import { getTaoNotes, createTaoNote } from "@/utils/noteUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreVertical,
  Tag as TagIcon,
  Folder,
  CalendarDays,
  FileEdit,
  Trash2,
  FilterX,
  FolderOpenDot,
  Clock,
} from "lucide-react";

interface TaoNotesProps {
  validatorNames: Record<string, string>;
}

const TaoNotes: React.FC<TaoNotesProps> = ({ validatorNames }) => {
  const navigate = useNavigate();
  const { notes, isLoading, handleDeleteNote, refetch } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);

  useEffect(() => {
    const taoNotes = getTaoNotes(notes);
    
    // Apply search filter
    let filtered = taoNotes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        note => 
          note.title.toLowerCase().includes(query) || 
          note.content.toLowerCase().includes(query)
      );
    }
    
    // Apply validator filter
    if (selectedValidator) {
      filtered = filtered.filter(note => 
        note.title.includes(validatorNames[selectedValidator]) ||
        note.content.includes(validatorNames[selectedValidator])
      );
    }
    
    setFilteredNotes(filtered);
  }, [notes, searchQuery, selectedValidator, validatorNames]);

  const handleCreateNote = (validatorId?: string) => {
    const validatorName = validatorId ? validatorNames[validatorId] : undefined;
    const newNote = createTaoNote(validatorName);
    
    // Navigate to editor with the new note
    navigate(`/editor/new?category=TAO&tags=TAO${validatorName ? `&title=${encodeURIComponent(`${validatorName} Note`)}` : ''}`);
  };

  const handleEditNote = (noteId: string) => {
    navigate(`/editor/${noteId}`);
  };

  const handleDeleteNoteConfirm = async (noteId: string) => {
    try {
      await handleDeleteNote(noteId);
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Error deleting note:", error);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedValidator(null);
  };

  const filterByValidator = (validatorId: string) => {
    setSelectedValidator(prevId => prevId === validatorId ? null : validatorId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">TAO Notes</h3>
        <Button onClick={() => handleCreateNote()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New TAO Note
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {(searchQuery || selectedValidator) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      
      {(searchQuery || selectedValidator) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              {searchQuery}
              <button 
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedValidator && (
            <Badge variant="outline" className="flex items-center gap-1">
              <FolderOpenDot className="h-3 w-3" />
              {validatorNames[selectedValidator]}
              <button 
                onClick={() => setSelectedValidator(null)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="text-center py-6">
          <CardContent>
            <p className="text-muted-foreground mb-4">No TAO notes found</p>
            <Button onClick={() => handleCreateNote()} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create your first TAO note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredNotes.map(note => (
            <Card key={note.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium truncate max-w-[80%]">
                    {note.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditNote(note.id)}>
                        <FileEdit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Note</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{note.title}"? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => {}}>Cancel</Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteNoteConfirm(note.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>{format(note.createdAt, 'MMM d, yyyy')}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm line-clamp-3">
                  {note.content || "No content"}
                </p>
              </CardContent>
              <CardFooter className="pt-0 flex-wrap gap-y-2">
                <div className="flex flex-wrap gap-1">
                  {note.tags.filter(tag => tag !== "TAO").map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {note.category}
                  </Badge>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaoNotes;
