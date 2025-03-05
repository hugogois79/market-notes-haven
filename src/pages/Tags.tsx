import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag as TagIcon, FileText, Search, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/NoteCard";
import { Note, Tag } from "@/types";
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
import { fetchTags, createTag, deleteTag, getNotesForTag, migrateExistingTags } from "@/services/tagService";
import { fetchNotes } from "@/services/supabaseService";

interface TagsPageProps {
  notes: Note[];
  loading?: boolean;
}

interface TagWithCount extends Tag {
  count: number;
}

const Tags = ({ notes, loading = false }: TagsPageProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [notesMigrated, setNotesMigrated] = useState(false);
  
  // Load tags on component mount
  useEffect(() => {
    const loadTags = async () => {
      const tagsData = await fetchTags();
      
      // Transform the data to include count
      const tagsWithCount = await Promise.all(tagsData.map(async (tag) => {
        const noteIds = await getNotesForTag(tag.id);
        return {
          ...tag,
          count: noteIds.length,
        };
      }));
      
      // Sort tags alphabetically
      tagsWithCount.sort((a, b) => a.name.localeCompare(b.name));
      
      setTags(tagsWithCount);
      
      // If this is the first load and no tags were found, try to migrate existing tags
      if (isFirstLoad && tagsWithCount.length === 0 && !notesMigrated) {
        setIsFirstLoad(false);
        handleMigrateTags();
      } else {
        setIsFirstLoad(false);
      }
    };
    
    loadTags();
  }, [isFirstLoad, notesMigrated]);
  
  // Filter notes based on search query and selected tag
  useEffect(() => {
    const filterNotes = async () => {
      if (!selectedTag) {
        // If no tag is selected, just filter by search query
        setFilteredNotes(notes.filter(note => 
          searchQuery === "" || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        return;
      }
      
      // Find the tag object from the selected tag ID
      const tagObj = tags.find(t => t.id === selectedTag);
      if (!tagObj) return;
      
      // Get all notes associated with this tag
      const noteIds = await getNotesForTag(selectedTag);
      
      // Filter notes that are in the noteIds array and match the search query
      setFilteredNotes(notes.filter(note => 
        noteIds.includes(note.id) && (
          searchQuery === "" || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ));
    };
    
    filterNotes();
  }, [notes, searchQuery, selectedTag, tags]);
  
  const handleTagClick = (tagId: string) => {
    if (selectedTag === tagId) {
      // If clicking the same tag, clear the filter
      setSelectedTag(null);
      toast.info("Showing all notes");
    } else {
      setSelectedTag(tagId);
      const tagName = tags.find(t => t.id === tagId)?.name || "Unknown";
      toast.info(`Showing notes with tag: ${tagName}`);
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

    setIsAddingTag(true);
    
    try {
      const tag = await createTag(newTag.trim());
      
      if (tag) {
        setTags(prev => [...prev, { ...tag, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
        setNewTag("");
        setIsDialogOpen(false);
        toast.success(`Created new tag: ${tag.name}`);
      }
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleDeleteTagClick = (tagId: string) => {
    setTagToDelete(tagId);
    setShowDeleteAlert(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    
    setIsDeletingTag(true);
    
    try {
      const success = await deleteTag(tagToDelete);
      
      if (success) {
        // Update local state to remove the tag
        setTags(prev => prev.filter(tag => tag.id !== tagToDelete));
        
        // If the deleted tag was selected, clear the selection
        if (selectedTag === tagToDelete) {
          setSelectedTag(null);
        }
        
        const tagName = tags.find(t => t.id === tagToDelete)?.name || "Unknown";
        toast.success(`Deleted tag: ${tagName}`);
      }
    } finally {
      setIsDeletingTag(false);
      setShowDeleteAlert(false);
      setTagToDelete(null);
    }
  };
  
  const handleMigrateTags = async () => {
    toast.info("Migrating existing tags to the new system...");
    
    const success = await migrateExistingTags();
    
    if (success) {
      toast.success("Tags migrated successfully!");
      setNotesMigrated(true);
      // Reload the page to show the migrated tags
      window.location.reload();
    } else {
      toast.error("Failed to migrate tags");
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
        
        <div className="flex gap-2">
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
          
          {!notesMigrated && notes.some(note => note.tags && note.tags.length > 0) && (
            <Button 
              variant="outline" 
              onClick={handleMigrateTags}
              className="gap-2"
            >
              <TagIcon size={16} />
              Migrate Legacy Tags
            </Button>
          )}
        </div>
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
              {tags.find(t => t.id === selectedTag)?.name || "Unknown"}
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
              <div key={tag.id} className="flex items-center">
                <Badge 
                  variant={selectedTag === tag.id ? "default" : "secondary"}
                  className={`text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all ${
                    selectedTag === tag.id ? 'bg-[#1EAEDB]' : ''
                  }`}
                  onClick={() => handleTagClick(tag.id)}
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
                          onClick={() => handleDeleteTagClick(tag.id)}
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
            Notes with tag: {tags.find(t => t.id === selectedTag)?.name || "Unknown"}
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
              This will remove the tag "{tags.find(t => t.id === tagToDelete)?.name || "Unknown"}" from all notes that have it. This action cannot be undone.
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
