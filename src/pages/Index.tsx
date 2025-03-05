
import { Button } from "@/components/ui/button";
import { FileText, Plus, Bookmark, FolderOpen, Clock, Rocket, Loader, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface IndexProps {
  notes: Note[];
  loading?: boolean;
}

const Index = ({ notes, loading = false }: IndexProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  
  // Extract categories from notes
  useEffect(() => {
    if (notes.length > 0) {
      const categoryCounts: Record<string, number> = {};
      
      notes.forEach(note => {
        const category = note.category || "General";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      const categoryList = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count
      }));
      
      setCategories(categoryList);
    }
  }, [notes]);
  
  // Filter notes based on search query and selected category
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get recent notes (last 6) from filtered notes
  const recentNotes = [...filteredNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Icons for common categories
  const getCategoryIcon = (categoryName: string) => {
    switch(categoryName.toLowerCase()) {
      case 'stocks':
        return <FileText size={16} />;
      case 'crypto':
        return <Bookmark size={16} />;
      case 'forex':
        return <FolderOpen size={16} />;
      case 'commodities':
        return <Clock size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const handleNewNote = () => {
    console.log("Creating new note");
    navigate("/editor/new");
  };
  
  const handleViewAllNotes = () => {
    console.log("Viewing all notes");
    navigate("/notes");
  };
  
  const handleCategoryClick = (category: string) => {
    console.log("Selected category:", category);
    if (selectedCategory === category) {
      // If clicking the same category, clear the filter
      setSelectedCategory(null);
      toast.info("Showing all notes");
    } else {
      setSelectedCategory(category);
      toast.info(`Showing notes in ${category} category`);
    }
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      {/* Header without Logo */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB]">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your market research and analysis hub
          </p>
        </div>
        <Button className="gap-2" size="sm" variant="brand" onClick={handleNewNote}>
          <Plus size={16} />
          New Note
        </Button>
      </div>

      {/* Search field */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-9 w-full max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {selectedCategory && (
          <div className="mt-2 flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Filtered by:</span>
            <Badge 
              variant="secondary" 
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              {selectedCategory} ×
            </Badge>
          </div>
        )}
      </div>

      {/* Recent Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} className="text-[#1EAEDB]" />
            Recent Notes
          </h2>
          <Button variant="ghost" size="sm" onClick={handleViewAllNotes}>
            View All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-start items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-[#1EAEDB]" />
            <span className="ml-2 text-lg">Loading notes...</span>
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg p-8 text-left border border-border animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1EAEDB]/10 text-[#1EAEDB] mb-4">
              <Rocket size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategory ? "No Notes Found" : "No Notes Yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery || selectedCategory
                ? "Try adjusting your filters or create a new note." 
                : "Start creating market research notes to track your insights and analysis."}
            </p>
            <Button variant="brand" onClick={handleNewNote}>
              Create Your First Note
            </Button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen size={20} className="text-[#1EAEDB]" />
            Categories
          </h2>
        </div>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                className={`bg-card glass-card rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer
                  ${selectedCategory === category.name ? 'ring-2 ring-[#1EAEDB]' : ''}`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-medium">
                    {getCategoryIcon(category.name)}
                    {category.name}
                  </div>
                  <div className="bg-[#1EAEDB]/10 text-[#1EAEDB] text-xs rounded-full px-2 py-0.5">
                    {category.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            No categories found. Create notes with categories to see them here.
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
