import { useState, useEffect } from "react";
import { Tag as TagIcon, Plus, TagsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note, Tag } from "@/types";
import { toast } from "sonner";
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
import { useNotes } from "@/contexts/NotesContext";

// Import our components
import TagsList from "@/components/Tags/TagsList";
import CategoryList from "@/components/Tags/CategoryList";
import TagsFilters from "@/components/Tags/TagsFilters";
import BulkTagActions from "@/components/Tags/BulkTagActions";
import NewCategoryDialog from "@/components/Tags/NewCategoryDialog";
import NotesDisplay from "@/components/Tags/NotesDisplay";
import DeleteTagDialog from "@/components/Tags/DeleteTagDialog";
import AddTagDialog from "@/components/Tags/AddTagDialog";

interface TagWithCount extends Tag {
  count: number;
  isSelected?: boolean;
}

const Tags = () => {
  const { notes, loading, isLoading } = useNotes();
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
  const [activeTab, setActiveTab] = useState("tags");
  const [bulkSelectedTags, setBulkSelectedTags] = useState<string[]>([]);
  const [bulkCategoryAssignOpen, setBulkCategoryAssignOpen] = useState(false);
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const isLoaded = !(loading || isLoading);
  
  const handleNewCategoryDialog = (show: boolean) => {
    setShowNewCategoryDialog(show);
  };

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
      const tag = await createTag(newTag.trim(), selectedCategory || null);
      
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

  const handleUpdateTagCategory = async (tagId: string, category: string | null) => {
    if (!tagId) return false;
    
    const updatedTag = await updateTagCategory(tagId, category);
    
    if (updatedTag) {
      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, category: updatedTag.category } : tag
      ));
      
      toast.success(`Updated tag category`);
      return true;
    }
    
    return false;
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
          <AddTagDialog 
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            newTag={newTag}
            onNewTagChange={setNewTag}
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={setSelectedCategory}
            categories={categories}
            onNewCategoryDialog={handleNewCategoryDialog}
            onAddTag={handleAddTag}
            isAddingTag={isAddingTag}
          />
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
          <TagsFilters 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onClearSelection={handleClearSelection}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            tags={tags}
            onNewCategoryDialog={handleNewCategoryDialog}
          />
          
          {bulkSelectedTags.length > 0 && (
            <BulkTagActions 
              bulkSelectedTags={bulkSelectedTags}
              onClearSelection={clearTagSelection}
              categories={categories}
              bulkCategoryAssignOpen={bulkCategoryAssignOpen}
              onBulkCategoryAssignOpen={setBulkCategoryAssignOpen}
              bulkSelectedCategory={bulkSelectedCategory}
              onBulkSelectedCategoryChange={setBulkSelectedCategory}
              onNewCategoryDialog={handleNewCategoryDialog}
              onBulkUpdateCategories={handleBulkUpdateCategories}
              isBulkUpdating={isBulkUpdating}
            />
          )}

          <TagsList 
            tags={tags}
            selectedTag={selectedTag}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            categories={categories}
            bulkSelectedTags={bulkSelectedTags}
            onTagClick={handleTagClick}
            onTagDelete={handleDeleteTagClick}
            onTagSelection={toggleTagSelection}
            onSelectAllTags={selectAllFilteredTags}
            onUpdateTagCategory={handleUpdateTagCategory}
            onNewCategoryDialog={handleNewCategoryDialog}
          />

          {selectedTag && (
            <NotesDisplay 
              title={`Notes with tag: ${tags.find(t => t.id === selectedTag)?.name || "Unknown"}`}
              notes={filteredNotes}
              emptyMessage="No notes found with the selected tag."
            />
          )}
          
          {!selectedTag && searchQuery && (
            <NotesDisplay 
              title="Search Results"
              notes={filteredNotes}
              emptyMessage="No notes found matching your search."
            />
          )}
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoryList 
            categories={categories}
            tags={tags}
            onSelectCategory={setSelectedCategory}
            onSwitchToTagsTab={() => setActiveTab("tags")}
          />
        </TabsContent>
      </Tabs>

      <DeleteTagDialog 
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        tagName={tags.find(t => t.id === tagToDelete)?.name || "Unknown"}
        onConfirmDelete={handleDeleteTag}
        isDeleting={isDeletingTag}
      />

      <NewCategoryDialog 
        open={showNewCategoryDialog}
        onOpenChange={setShowNewCategoryDialog}
        newCategory={newCategory}
        onNewCategoryChange={setNewCategory}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
};

export default Tags;
