
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag as TagIcon, FileText, Search, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagsPageProps {
  notes: Note[];
  loading?: boolean;
}

const Tags = ({ notes, loading = false }: TagsPageProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<{name: string, count: number}[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  
  // Extract all unique tags from notes
  useEffect(() => {
    if (notes.length > 0) {
      const tagCounts: Record<string, number> = {};
      
      notes.forEach(note => {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const tagList = Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count
      }));
      
      // Sort tags alphabetically
      tagList.sort((a, b) => a.name.localeCompare(b.name));
      
      setTags(tagList);
    }
  }, [notes]);
  
  // Filter notes based on search query and selected tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || 
      note.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      // If clicking the same tag, clear the filter
      setSelectedTag(null);
      toast.info("Showing all notes");
    } else {
      setSelectedTag(tag);
      toast.info(`Showing notes with tag: ${tag}`);
    }
  };

  const handleClearSelection = () => {
    setSelectedTag(null);
    setSearchQuery("");
    toast.info("Filters cleared");
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase())) {
      toast.error("This tag already exists");
      return;
    }

    setIsAddingTag(true);
    
    try {
      // Create a new note with this tag if there are no notes yet
      // or add the tag to an existing note
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (notes.length === 0) {
        // Create a new note with this tag
        const { error } = await supabase
          .from('notes')
          .insert([{
            title: 'Tag Note',
            content: `Note created for tag: ${newTag}`,
            tags: [newTag],
            user_id: userId
          }]);
          
        if (error) throw error;
        
        toast.success(`Created new note with tag: ${newTag}`);
      } else {
        // Find the first note to update with the new tag
        const noteToUpdate = notes[0];
        const updatedTags = [...noteToUpdate.tags, newTag];
        
        const { error } = await supabase
          .from('notes')
          .update({ 
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteToUpdate.id);
          
        if (error) throw error;
        
        toast.success(`Added tag "${newTag}" to note: ${noteToUpdate.title}`);
      }
      
      // Update local state with the new tag
      setTags(prev => [...prev, { name: newTag, count: 1 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTag("");
      setIsDialogOpen(false);
      
      // Refetch notes to update the UI
      // (assuming there's a refetch function in the parent component)
      
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleDeleteTagClick = (tagName: string) => {
    setTagToDelete(tagName);
    setShowDeleteAlert(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    
    setIsDeletingTag(true);
    
    try {
      // Find all notes that have this tag
      const notesWithTag = notes.filter(note => note.tags.includes(tagToDelete));
      
      if (notesWithTag.length === 0) {
        toast.error("No notes found with this tag");
        setIsDeletingTag(false);
        setShowDeleteAlert(false);
        return;
      }
      
      // Update each note to remove the tag
      let successCount = 0;
      
      for (const note of notesWithTag) {
        const updatedTags = note.tags.filter(tag => tag !== tagToDelete);
        
        const { error } = await supabase
          .from('notes')
          .update({ 
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id);
          
        if (error) {
          console.error(`Error updating note ${note.id}:`, error);
        } else {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        // Update local state to remove the tag
        setTags(prev => prev.filter(tag => tag.name !== tagToDelete));
        
        // If the deleted tag was selected, clear the selection
        if (selectedTag === tagToDelete) {
          setSelectedTag(null);
        }
        
        toast.success(`Removed tag "${tagToDelete}" from ${successCount} ${successCount === 1 ? 'note' : 'notes'}`);
      } else {
        toast.error("Failed to remove tag from any notes");
      }
      
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    } finally {
      setIsDeletingTag(false);
      setShowDeleteAlert(false);
      setTagToDelete(null);
    }
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB] flex items-center gap-2">
            <TagIcon className="h-8 w-8" />
            Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize and filter your notes by tags
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="brand" className="gap-2">
              <Plus size={16} />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to organize your notes
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="brand" 
                onClick={handleAddTag}
                disabled={isAddingTag}
              >
                {isAddingTag ? "Adding..." : "Add Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filter info */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in tags or notes..."
            className="pl-9 w-full max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {selectedTag && (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Filtered by tag:</span>
            <Badge variant="default" className="cursor-pointer bg-[#1EAEDB]">
              {selectedTag}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-8 w-8 p-0" 
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filter</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tags cloud */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TagIcon size={20} className="text-[#1EAEDB]" />
          All Tags
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[#1EAEDB] border-t-transparent rounded-full inline-block mb-2"></div>
            <p>Loading tags...</p>
          </div>
        ) : tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag.name} className="flex items-center">
                <Badge 
                  variant={selectedTag === tag.name ? "default" : "secondary"}
                  className={`text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all ${
                    selectedTag === tag.name ? 'bg-[#1EAEDB]' : ''
                  }`}
                  onClick={() => handleTagClick(tag.name)}
                >
                  {tag.name}
                  <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                    {tag.count}
                  </span>
                </Badge>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 ml-1"
                    >
                      <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium">Delete tag "{tag.name}"?</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTagClick(tag.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <TagIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No tags found. Add tags to your notes to see them here.</p>
          </div>
        )}
      </div>

      {/* Notes with selected tag */}
      {selectedTag && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#1EAEDB]" />
            Notes with tag: {selectedTag}
          </h2>
          
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No notes found with the selected tag.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Show all notes if no tag is selected */}
      {!selectedTag && searchQuery && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#1EAEDB]" />
            Search Results
          </h2>
          
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No notes found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Tag Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tag "{tagToDelete}" from all notes that have it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeletingTag}
            >
              {isDeletingTag ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tags;
