import { Button } from "@/components/ui/button";
import { FileText, Plus, Bookmark, FolderOpen, Clock, Rocket, Loader, Search, Table, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Note } from "@/types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTags } from "@/services/tagService";

interface IndexProps {
  notes: Note[];
  loading?: boolean;
}

const Index = ({ notes, loading = false }: IndexProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [tagNameMap, setTagNameMap] = useState<Record<string, string>>({});
  
  // Load tags to map IDs to names
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        const tagMap: Record<string, string> = {};
        tags.forEach(tag => {
          tagMap[tag.id] = tag.name;
        });
        setTagNameMap(tagMap);
      } catch (error) {
        console.error("Error loading tag mapping:", error);
      }
    };
    
    loadTags();
  }, []);
  
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
  
  // Filter notes based on search query, selected category, and selected tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || 
      note.category === selectedCategory;
    
    const matchesTag = selectedTag === null || 
      note.tags.some(tagId => 
        // Either match the tag ID or the tag name
        tagId === selectedTag || tagNameMap[tagId] === selectedTag
      );
    
    return matchesSearch && matchesCategory && matchesTag;
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

  // Handle tag click to filter by tag
  const handleTagClick = (tagId: string, tagName: string, event: React.MouseEvent) => {
    // Stop propagation to prevent note click handler from firing
    event.stopPropagation();
    
    console.log("Selected tag:", tagName);
    if (selectedTag === tagId || selectedTag === tagName) {
      // If clicking the same tag, clear the filter
      setSelectedTag(null);
      toast.info("Cleared tag filter");
    } else {
      setSelectedTag(tagName);
      toast.info(`Filtering notes with tag: ${tagName}`);
    }
  };

  // Clear tag filter
  const clearTagFilter = () => {
    setSelectedTag(null);
    toast.info("Cleared tag filter");
  };

  // Format date to be more readable
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle note click to navigate to editor
  const handleNoteClick = (noteId: string) => {
    navigate(`/editor/${noteId}`);
  };

  // Extract plain text from HTML content for preview
  const getTextPreview = (htmlContent: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.substring(0, 100) + (textContent.length > 100 ? "..." : "");
  };

  // Helper to get tag name from ID
  const getTagName = (tagId: string) => {
    return tagNameMap[tagId] || tagId;
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      {/* Header without Logo */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand">Dashboard</h1>
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
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {selectedCategory && (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Category:</span>
              <Badge 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                {selectedCategory} <X size={14} className="ml-1" />
              </Badge>
            </div>
          )}
          
          {selectedTag && (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Tag:</span>
              <Badge 
                variant="secondary"
                className="cursor-pointer bg-brand/10 text-brand hover:bg-brand/20"
                onClick={clearTagFilter}
              >
                {selectedTag} <X size={14} className="ml-1" />
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Categories Section - Moved to the top */}
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen size={20} className="text-brand" />
            Categories
          </h2>
        </div>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div 
                key={category.name}
                className={`bg-card glass-card rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer
                  ${selectedCategory === category.name ? 'ring-2 ring-brand' : ''}`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-medium">
                    {getCategoryIcon(category.name)}
                    {category.name}
                  </div>
                  <div className="bg-brand/10 text-brand text-xs rounded-full px-2 py-0.5">
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

      {/* Recent Notes Section - Now below Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} className="text-brand" />
            Recent Notes
          </h2>
          <Button variant="ghost" size="sm" onClick={handleViewAllNotes}>
            View All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-start items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-brand" />
            <span className="ml-2 text-lg">Loading notes...</span>
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentNotes.map((note) => (
                  <TableRow 
                    key={note.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleNoteClick(note.id)}
                  >
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{note.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                      {getTextPreview(note.content)}
                    </TableCell>
                    <TableCell>
                      {note.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 2).map((tagId) => (
                            <Badge 
                              key={tagId} 
                              variant="secondary" 
                              className="text-xs py-0 px-1.5 cursor-pointer hover:bg-secondary/80"
                              onClick={(e) => handleTagClick(tagId, getTagName(tagId), e)}
                            >
                              {getTagName(tagId)}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs py-0 px-1.5">
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No tags</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(note.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </div>
        ) : (
          <div className="bg-card rounded-lg p-8 text-left border border-border animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand mb-4">
              <Rocket size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || selectedCategory || selectedTag ? "No Notes Found" : "No Notes Yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery || selectedCategory || selectedTag
                ? "Try adjusting your filters or create a new note." 
                : "Start creating market research notes to track your insights and analysis."}
            </p>
            <Button variant="brand" onClick={handleNewNote}>
              Create Your First Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
