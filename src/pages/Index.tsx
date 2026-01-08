import { Button } from "@/components/ui/button";
import { FileText, Plus, Bookmark, FolderOpen, Clock, Rocket, Loader, Search, Table, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Note } from "@/types";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
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
import { fetchTags, fetchCategories } from "@/services/tag";
import { getTokensForNote } from "@/services/tokenService";
import TokenBadge from "@/components/TokenBadge";
import { Token } from "@/types";
import { useNotes } from "@/contexts/NotesContext";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import HighlightText from "@/components/HighlightText";

const Index = () => {
  const { notes, loading } = useNotes();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [tagNameMap, setTagNameMap] = useState<Record<string, string>>({});
  const [noteTokens, setNoteTokens] = useState<Record<string, Token[]>>({});
  const { isSearching, searchResults, semanticSearch, clearSearch } = useSemanticSearch();
  
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
  
  useEffect(() => {
    const fetchTokensForNotes = async () => {
      if (recentNotes.length > 0) {
        const tokensMap: Record<string, Token[]> = {};
        
        for (const note of recentNotes) {
          try {
            const tokens = await getTokensForNote(note.id);
            if (tokens.length > 0) {
              tokensMap[note.id] = tokens;
            }
          } catch (error) {
            console.error(`Error fetching tokens for note ${note.id}:`, error);
          }
        }
        
        setNoteTokens(tokensMap);
      }
    };
    
    const filteredNotes = notes.filter(note => {
      const matchesSearch = searchQuery === "" || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === null || 
        note.category === selectedCategory;
      
      const matchesTag = selectedTag === null || 
        note.tags.some(tagId => 
          tagId === selectedTag || tagNameMap[tagId] === selectedTag
        );
      
      return matchesSearch && matchesCategory && matchesTag;
    });
    
    const recentOnes = [...filteredNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
    
    if (recentOnes.length > 0) {
      fetchTokensForNotes();
    }
  }, [notes, searchQuery, selectedCategory, selectedTag, tagNameMap]);
  
  // Debounced semantic search
  useEffect(() => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    const timeoutId = setTimeout(() => {
      semanticSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, semanticSearch, clearSearch]);

  // Use semantic search results if available, otherwise filter notes locally
  const baseNotes = searchResults && searchQuery.trim() ? searchResults : notes;

  const filteredNotes = baseNotes.filter(note => {
    // If we have semantic search results, skip text matching since it's already done
    const matchesSearch = searchResults && searchQuery.trim() ? true : (
      searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesCategory = selectedCategory === null || 
      note.category === selectedCategory;
    
    const matchesTag = selectedTag === null || 
      note.tags.some(tagId => 
        tagId === selectedTag || tagNameMap[tagId] === selectedTag
      );
    
    return matchesSearch && matchesCategory && matchesTag;
  });
  
  const recentNotes = [...filteredNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

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
      setSelectedCategory(null);
      toast.info("Showing all notes");
    } else {
      setSelectedCategory(category);
      toast.info(`Showing notes in ${category} category`);
    }
  };

  const handleTagClick = (tagId: string, tagName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    console.log("Selected tag:", tagName);
    if (selectedTag === tagId || selectedTag === tagName) {
      setSelectedTag(null);
      toast.info("Cleared tag filter");
    } else {
      setSelectedTag(tagName);
      toast.info(`Filtering notes with tag: ${tagName}`);
    }
  };

  const clearTagFilter = () => {
    setSelectedTag(null);
    toast.info("Cleared tag filter");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/editor/${noteId}`);
  };

  // Extract plain text from HTML content for preview
  // Uses regex for safe text extraction without XSS risk
  const getTextPreview = (htmlContent: string) => {
    if (!htmlContent) return "";
    const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.substring(0, 100) + (plainText.length > 100 ? "..." : "");
  };

  const getTagName = (tagId: string) => {
    return tagNameMap[tagId] || tagId;
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
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

      <div className="relative">
        {isSearching ? (
          <Loader className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          placeholder="Search notes semantically..."
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
                className="cursor-pointer bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/90"
                onClick={clearTagFilter}
              >
                {selectedTag} <X size={14} className="ml-1" />
              </Badge>
            </div>
          )}
        </div>
      </div>

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
                  <TableHead>Tokens</TableHead>
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
                    <TableCell className="font-medium">
                      <HighlightText text={note.title} query={searchQuery} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{note.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                      <HighlightText text={getTextPreview(note.content)} query={searchQuery} />
                    </TableCell>
                    <TableCell>
                      {note.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 2).map((tagId) => (
                            <Badge 
                              key={tagId} 
                              variant="secondary" 
                              className="text-xs py-0 px-1.5 cursor-pointer bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/90"
                              onClick={(e) => handleTagClick(tagId, getTagName(tagId), e)}
                            >
                              {getTagName(tagId)}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/90">
                              +{note.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No tags</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {noteTokens[note.id] && noteTokens[note.id].length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {noteTokens[note.id].slice(0, 2).map((token) => (
                            <TokenBadge key={token.id} token={token} size="sm" />
                          ))}
                          {noteTokens[note.id].length > 2 && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5">
                              +{noteTokens[note.id].length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No tokens</span>
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
