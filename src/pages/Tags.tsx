import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag as TagIcon, FileText, Search, X, Plus, Trash2, FolderOpen, Edit, Check, Filter, Tags, CheckSquare } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import TagBadge from "@/components/ui/tag-badge";
import { 
  fetchTags, 
  createTag, 
  deleteTag, 
  getNotesForTag, 
  migrateExistingTags, 
  fetchCategories,
  updateTagCategory,
  fetchTagsByCategory
} from "@/services/tagService";
import { fetchNotes } from "@/services/supabaseService";
import { useNotes } from "@/contexts/NotesContext";

interface TagWithCount extends Tag {
  count: number;
  isSelected?: boolean;
}

const Tags = () => {
  const { notes, loading, isLoading } = useNotes();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [notesMigrated, setNotesMigrated] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isEditingTag, setIsEditingTag] = useState<string | null>(null);
  const [editTagCategory, setEditTagCategory] = useState<string | null>(null);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [activeTab, setActiveTab] = useState("tags");
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([]);
  const [bulkCategoryAssignOpen, setBulkCategoryAssignOpen] = useState(false);
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const isLoaded = !(loading || isLoading);
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, []);
  
  useEffect(() => {
    const loadTags = async () => {
      try {
        let tagsData;
        
        if (selectedCategory) {
          tagsData = await fetchTagsByCategory(selectedCategory);
        } else {
          tagsData = await fetchTags();
        }
        
        const tagsWithCount = await Promise.all(tagsData.map(async (tag) => {
          const noteIds = await getNotesForTag(tag.id);
          return {
            ...tag,
            count: noteIds.length,
            isSelected: bulkSelectedTags.includes(tag.id)
          };
        }));
        
        tagsWithCount.sort((a, b) => a.name.localeCompare(b.name));
        
        setTags(tagsWithCount);
        
        if (isFirstLoad && tagsWithCount.length === 0 && !notesMigrated) {
          setIsFirstLoad(false);
          handleMigrateTags();
        } else {
          setIsFirstLoad(false);
        }
      } catch (error) {
        console.error("Error loading tags:", error);
        toast.error("Failed to load tags");
      }
    };
    
    loadTags();
  }, [isFirstLoad, notesMigrated, selectedCategory, bulkSelectedTags]);
  
  useEffect(() => {
    const filterNotes = async () => {
      if (!selectedTag) {
        setFilteredNotes(notes.filter(note => 
          searchQuery === "" || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        return;
      }
      
      const tagObj = tags.find(t => t.id === selectedTag);
      if (!tagObj) return;
      
      const noteIds = await getNotesForTag(selectedTag);
      
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
      const tag = await createTag(newTag.trim(), selectedCategory);
      
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
        setTags(prev => prev.filter(tag => tag.id !== tagToDelete));
        setBulkSelectedTags(prev => prev.filter(id => id !== tagToDelete));
        
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
      window.location.reload();
    } else {
      toast.error("Failed to migrate tags");
    }
  };

  const handleUpdateTagCategory = async (tagId: string) => {
    if (!tagId) return;
    
    setIsUpdatingTag(true);
    
    try {
      const updatedTag = await updateTagCategory(tagId, editTagCategory);
      
      if (updatedTag) {
        setTags(prev => prev.map(tag => 
          tag.id === tagId ? { ...tag, category: updatedTag.category } : tag
        ));
        
        toast.success(`Updated tag category`);
      }
    } finally {
      setIsUpdatingTag(false);
      setIsEditingTag(null);
      setEditTagCategory(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Add to categories list
    if (!categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()].sort());
    }
    
    // Use this category for bulk update if in that dialog
    if (bulkCategoryAssignOpen) {
      setBulkSelectedCategory(newCategory.trim());
    } else {
      setSelectedCategory(newCategory.trim());
    }
    
    setNewCategory("");
    setShowNewCategoryDialog(false);
    toast.success(`Created new category: ${newCategory.trim()}`);
  };

  const handleBulkUpdateCategories = async () => {
    if (bulkSelectedTags.length === 0) {
      toast.error("No tags selected");
      return;
    }

    setIsBulkUpdating(true);
    
    try {
      let successCount = 0;
      
      for (const tagId of bulkSelectedTags) {
        const updatedTag = await updateTagCategory(tagId, bulkSelectedCategory);
        if (updatedTag) {
          successCount++;
          // Update the tags list
          setTags(prev => prev.map(tag => 
            tag.id === tagId ? { ...tag, category: updatedTag.category } : tag
          ));
        }
      }
      
      if (successCount > 0) {
        toast.success(`Updated category for ${successCount} tags`);
        // Clear selection after successful update
        setBulkSelectedTags([]);
      } else {
        toast.error("Failed to update categories");
      }
    } finally {
      setIsBulkUpdating(false);
      setBulkCategoryAssignOpen(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setBulkSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const selectAllFilteredTags = () => {
    const filteredTagIds = getFilteredTags().map(tag => tag.id);
    setBulkSelectedTags(filteredTagIds);
  };

  const clearTagSelection = () => {
    setBulkSelectedTags([]);
  };

  const getFilteredTags = () => {
    return tags.filter(tag => 
      (!selectedCategory || tag.category === selectedCategory) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB] flex items-center gap-2">
            <TagIcon className="h-8 w-8" />
            Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize and filter your notes by tags and categories
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
              <div className="py-4 space-y-4">
                <div>
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
                
                <div>
                  <Select
                    value={selectedCategory || ""}
                    onValueChange={(value) => {
                      if (value === "new") {
                        setShowNewCategoryDialog(true);
                      } else {
                        setSelectedCategory(value === "" ? null : value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tags" className="flex-1">Tags</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tags" className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in tags or notes..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => {
                  if (value === "new") {
                    setShowNewCategoryDialog(true);
                  } else {
                    setSelectedCategory(value === "all" ? null : value);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                  <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(selectedTag || bulkSelectedTags.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                {selectedTag && (
                  <div className="flex items-center mr-2">
                    <span className="text-sm text-muted-foreground">Filtered by tag:</span>
                    <Badge variant="default" className="cursor-pointer bg-[#1EAEDB] ml-2">
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
                
                {bulkSelectedTags.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm font-medium">{bulkSelectedTags.length} tags selected</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearTagSelection}
                      className="h-8 px-2"
                    >
                      Clear selection
                    </Button>
                    <Dialog open={bulkCategoryAssignOpen} onOpenChange={setBulkCategoryAssignOpen}>
                      <DialogTrigger asChild>
                        <Button variant="brand" size="sm" className="h-8 gap-1">
                          <FolderOpen size={14} />
                          Assign to category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign to Category</DialogTitle>
                          <DialogDescription>
                            Assign {bulkSelectedTags.length} selected tags to a category
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select
                            value={bulkSelectedCategory || ""}
                            onValueChange={(value) => {
                              if (value === "new") {
                                setShowNewCategoryDialog(true);
                              } else {
                                setBulkSelectedCategory(value === "" ? null : value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No category (remove existing)</SelectItem>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                              <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setBulkCategoryAssignOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="brand" 
                            onClick={handleBulkUpdateCategories}
                            disabled={isBulkUpdating}
                          >
                            {isBulkUpdating ? "Updating..." : "Update Categories"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TagIcon size={20} className="text-[#1EAEDB]" />
                {selectedCategory ? `Tags in "${selectedCategory}"` : "All Tags"}
              </h2>
              
              {getFilteredTags().length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFilteredTags}
                    className="gap-1"
                  >
                    <CheckSquare size={14} />
                    Select all
                  </Button>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-[#1EAEDB] border-t-transparent rounded-full inline-block mb-2"></div>
                <p>Loading tags...</p>
              </div>
            ) : getFilteredTags().length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getFilteredTags().map((tag) => (
                  <div key={tag.id} className="flex items-center">
                    <div className="flex items-center mr-1">
                      <Checkbox
                        id={`select-${tag.id}`}
                        checked={bulkSelectedTags.includes(tag.id)}
                        onCheckedChange={() => toggleTagSelection(tag.id)}
                        className="mr-1 data-[state=checked]:bg-[#1EAEDB] data-[state=checked]:text-white"
                      />
                    </div>
                    <Badge 
                      variant={selectedTag === tag.id ? "default" : "secondary"}
                      className={`text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all ${
                        selectedTag === tag.id ? 'bg-[#1EAEDB]' : bulkSelectedTags.includes(tag.id) ? 'border-[#1EAEDB] border' : ''
                      }`}
                      onClick={() => handleTagClick(tag.id)}
                    >
                      {tag.name}
                      <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                        {tag.count}
                      </span>
                      {tag.category && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({tag.category})
                        </span>
                      )}
                    </Badge>
                    
                    {isEditingTag === tag.id ? (
                      <div className="flex items-center ml-1">
                        <Select
                          value={editTagCategory || ""}
                          onValueChange={(value) => {
                            if (value === "new") {
                              setShowNewCategoryDialog(true);
                            } else {
                              setEditTagCategory(value === "" ? null : value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-[120px]">
                            <SelectValue placeholder="Category..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No category</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                            <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateTagCategory(tag.id)}
                          disabled={isUpdatingTag}
                        >
                          <Check size={14} className="text-green-500" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setIsEditingTag(null);
                            setEditTagCategory(null);
                          }}
                        >
                          <X size={14} className="text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 ml-1"
                          onClick={() => {
                            setIsEditingTag(tag.id);
                            setEditTagCategory(tag.category);
                          }}
                        >
                          <Edit size={14} className="text-muted-foreground hover:text-primary" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleDeleteTagClick(tag.id)}
                        >
                          <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <TagIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No tags found matching your search." : "No tags found. Add tags to your notes to see them here."}
                </p>
              </div>
            )}
          </div>

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
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FolderOpen size={20} className="text-[#1EAEDB]" />
              Categories
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length > 0 ? (
                categories.map(category => {
                  const categoryTags = tags.filter(tag => tag.category === category);
                  return (
                    <Card key={category} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center text-lg">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-[#1EAEDB]" />
                            <span>{category}</span>
                          </div>
                          <Badge>{categoryTags.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {categoryTags.length} {categoryTags.length === 1 ? 'tag' : 'tags'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-0">
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-auto mb-4">
                          {categoryTags.slice(0, 8).map(tag => (
                            <TagBadge key={tag.id} tag={tag.name} count={tag.count} />
                          ))}
                          {categoryTags.length > 8 && (
                            <Badge variant="outline">+{categoryTags.length - 8} more</Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setSelectedCategory(category);
                            setActiveTab("tags");
                          }}
                        >
                          <Filter className="w-4 h-4 mr-1" /> View Tags
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center p-8 border border-dashed rounded-lg">
                  <FolderOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No categories found. Add categories to organize your tags.</p>
                  <p className="text-sm text-muted-foreground">
                    Categories can be created in the Notes Editor or from the Categories page.
                  </p>
                </div>
              )}
              
              {tags.filter(tag => !tag.category).length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-lg">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <span>Uncategorized</span>
                      </div>
                      <Badge variant="outline">
                        {tags.filter(tag => !tag.category).length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {tags.filter(tag => !tag.category).length} {tags.filter(tag => !tag.category).length === 1 ? 'tag' : 'tags'} without a category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-auto mb-4">
                      {tags.filter(tag => !tag.category).slice(0, 8).map(tag => (
                        <TagBadge key={tag.id} tag={tag.name} count={tag.count} />
                      ))}
                      {tags.filter(tag => !tag.category).length > 8 && (
                        <Badge variant="outline">+{tags.filter(tag => !tag.category).length - 8} more</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setSelectedCategory(null);
                        setActiveTab("tags");
                      }}
                    >
                      <Filter className="w-4 h-4 mr-1" /> View Tags
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your tags
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="brand" 
              onClick={handleCreateCategory}
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tags;
