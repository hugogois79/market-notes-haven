
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, FolderPlus, PlusCircle, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Note } from "@/types";
import NoteCard from "@/components/NoteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNotes } from "@/contexts/NotesContext";

interface CategoryCount {
  category: string;
  count: number;
}

const Categories = () => {
  const { notes, loading, isLoading, refetch } = useNotes();
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ original: string, updated: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const isLoaded = !(loading || isLoading);

  // Calculate categories and their counts
  useEffect(() => {
    if (isLoaded || notes.length > 0) {
      const categoryMap = new Map<string, number>();
      
      notes.forEach((note) => {
        if (note.category) {
          const count = categoryMap.get(note.category) || 0;
          categoryMap.set(note.category, count + 1);
        }
      });
      
      const categoriesArray = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category));
      
      setCategories(categoriesArray);
      
      // Set default selected category if none is selected and categories exist
      if (!selectedCategory && categoriesArray.length > 0) {
        setSelectedCategory(categoriesArray[0].category);
      }
    }
  }, [notes, isLoaded, selectedCategory]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Check if category already exists
    if (categories.some(c => c.category.toLowerCase() === newCategory.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }

    setIsSaving(true);
    
    // Create a new note with the category
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a category");
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          { 
            title: `${newCategory} Notes`, 
            content: `# ${newCategory} Notes\n\nThis is your first note in the ${newCategory} category.`,
            category: newCategory,
            tags: [],
            user_id: user.id
          }
        ]);

      if (error) throw error;
      
      // Success handling with optimistic UI update
      const newCategoryItem = { category: newCategory, count: 1 };
      setCategories(prev => [...prev, newCategoryItem].sort((a, b) => a.category.localeCompare(b.category)));
      
      toast.success(`Added category: ${newCategory}`);
      setNewCategory("");
      setDialogOpen(false);
      
      // Refresh notes in the background
      refetch();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    if (!editingCategory.updated.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Check if new name already exists
    if (
      editingCategory.original.toLowerCase() !== editingCategory.updated.toLowerCase() &&
      categories.some(c => c.category.toLowerCase() === editingCategory.updated.toLowerCase())
    ) {
      toast.error("Category already exists");
      return;
    }

    setIsSaving(true);

    try {
      // Update all notes with this category
      const { error } = await supabase
        .from('notes')
        .update({ category: editingCategory.updated })
        .eq('category', editingCategory.original);

      if (error) throw error;
      
      // Optimistic UI update
      setCategories(prev => prev.map(cat => 
        cat.category === editingCategory.original 
          ? { ...cat, category: editingCategory.updated } 
          : cat
      ));
      
      toast.success(`Updated category: ${editingCategory.updated}`);
      
      if (selectedCategory === editingCategory.original) {
        setSelectedCategory(editingCategory.updated);
      }
      
      setEditingCategory(null);
      setEditDialogOpen(false);
      
      // Refresh notes in the background
      refetch();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!category) return;

    if (!window.confirm(`Are you sure you want to remove the category "${category}" from all notes? This will not delete the notes.`)) {
      return;
    }

    setIsSaving(true);

    try {
      // Remove category from notes (set to null)
      const { error } = await supabase
        .from('notes')
        .update({ category: null })
        .eq('category', category);

      if (error) throw error;
      
      // Optimistic UI update
      setCategories(prev => prev.filter(c => c.category !== category));
      
      toast.success(`Deleted category: ${category}`);
      
      if (selectedCategory === category) {
        // Find a new category to select, or select null if no categories left
        const nextCategory = categories.find(c => c.category !== category);
        setSelectedCategory(nextCategory ? nextCategory.category : null);
      }
      
      // Refresh notes in the background
      refetch();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredNotes = selectedCategory 
    ? notes.filter(note => note.category === selectedCategory)
    : [];
  
  const uncategorizedNotes = notes.filter(note => !note.category);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1EAEDB]">Categories</h1>
          <p className="text-muted-foreground">Organize and browse your notes by category</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span>New Category</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your notes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-category">Category Name</Label>
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1">All Categories</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">Category Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading || isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[150px] rounded-lg" />
              ))
            ) : (
              <>
                {categories.map((category) => (
                  <Card key={category.category} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Folder className="text-[#1EAEDB] w-5 h-5" />
                          <span>{category.category}</span>
                        </div>
                        <Badge>{category.count}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {category.count} note{category.count !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Browse all notes in {category.category} category
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4 pb-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingCategory({ 
                            original: category.category, 
                            updated: category.category 
                          });
                          setEditDialogOpen(true);
                        }}
                        disabled={isSaving}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteCategory(category.category)}
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                {/* Uncategorized notes card */}
                {uncategorizedNotes.length > 0 && (
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Folder className="text-muted-foreground w-5 h-5" />
                          <span>Uncategorized</span>
                        </div>
                        <Badge variant="outline">{uncategorizedNotes.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {uncategorizedNotes.length} note{uncategorizedNotes.length !== 1 ? 's' : ''} without a category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Notes that haven't been assigned to any category
                      </p>
                    </CardContent>
                    <CardFooter className="border-t pt-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setActiveTab("notes");
                        }}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-1" /> View Notes
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Empty state when no categories */}
                {categories.length === 0 && uncategorizedNotes.length === 0 && !loading && !isLoading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Folder className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      You haven't created any categories yet. Categories help you organize your notes.
                    </p>
                    <Button onClick={() => setDialogOpen(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Create Category
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Folder className="text-[#1EAEDB] w-5 h-5" />
                {selectedCategory ? selectedCategory : "Uncategorized Notes"}
              </h2>
              <div className="flex gap-2">
                {selectedCategory && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingCategory({ 
                          original: selectedCategory, 
                          updated: selectedCategory 
                        });
                        setEditDialogOpen(true);
                      }}
                      disabled={isSaving}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit Category
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(selectedCategory)}
                      disabled={isSaving}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete Category
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((category) => (
                <Badge 
                  key={category.category}
                  variant={selectedCategory === category.category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setSelectedCategory(category.category)}
                >
                  {category.category} ({category.count})
                </Badge>
              ))}
              {uncategorizedNotes.length > 0 && (
                <Badge 
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => setSelectedCategory(null)}
                >
                  Uncategorized ({uncategorizedNotes.length})
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading || isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[200px] rounded-lg" />
              ))
            ) : (
              <>
                {selectedCategory !== null
                  ? filteredNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))
                  : uncategorizedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))
                }
                
                {((selectedCategory && filteredNotes.length === 0) || 
                  (!selectedCategory && uncategorizedNotes.length === 0)) && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Notes Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {selectedCategory
                        ? `There are no notes in the "${selectedCategory}" category.`
                        : "There are no uncategorized notes."}
                    </p>
                    <Button onClick={() => navigate("/editor/new")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Create Note
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the name of this category. This will update all notes in this category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-category">Category Name</Label>
            <Input
              id="edit-category"
              value={editingCategory?.updated || ""}
              onChange={(e) => setEditingCategory(prev => prev ? {...prev, updated: e.target.value} : null)}
              placeholder="Enter category name"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
