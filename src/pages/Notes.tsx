
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Tag, 
  Filter, 
  SortDesc, 
  GridIcon, 
  List, 
  Loader 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Note } from "@/types";
import NoteCard from "@/components/NoteCard";

interface NotesProps {
  notes: Note[];
  loading?: boolean;
}

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";
type ViewMode = "grid" | "list";

const Notes = ({ notes, loading = false }: NotesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Get unique categories and tags from notes
  const categories = Array.from(new Set(notes.map(note => note.category)));
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  
  // Filter notes based on search, category, and tags
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || note.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => note.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });
  
  // Sort filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "date-asc":
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  // Handle toggling a tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6 py-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search all your market research notes
          </p>
        </div>
        <Link to="/editor/new">
          <Button className="gap-2" size="sm">
            <Plus size={16} />
            New Note
          </Button>
        </Link>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Category filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderOpen size={16} />
                Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup 
                value={selectedCategory || "all"} 
                onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
              >
                <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
                {categories.map((category) => (
                  <DropdownMenuRadioItem key={category} value={category}>
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Tags filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag size={16} />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTags.length > 0 ? (
                allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No tags found
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Sort options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SortDesc size={16} />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <DropdownMenuRadioItem value="date-desc">Newest first</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date-asc">Oldest first</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title-asc">Title (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title-desc">Title (Z-A)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View mode toggle */}
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setViewMode("grid")}
            >
              <GridIcon size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-2"
              onClick={() => setViewMode("list")}
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Results info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading notes..." : `Showing ${sortedNotes.length} of ${notes.length} notes`}
        </div>
        {(selectedCategory || selectedTags.length > 0 || searchQuery) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setSelectedTags([]);
              setSearchQuery("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      
      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading notes...</span>
        </div>
      ) : sortedNotes.length > 0 ? (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "flex flex-col gap-3"
        }>
          {sortedNotes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              className={viewMode === "list" ? "h-auto" : ""}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg p-8 text-center border border-border animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Filter size={24} />
          </div>
          <h3 className="text-lg font-medium mb-2">No Notes Found</h3>
          <p className="text-muted-foreground mb-6">
            {notes.length > 0 
              ? "Try adjusting your filters or search query"
              : "Start creating notes to see them here"}
          </p>
          <Link to="/editor/new">
            <Button>
              Create Your First Note
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Notes;
