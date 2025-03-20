
import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PlusCircle,
  Tag,
  Grid3X3,
  List,
  X,
  FolderOpenDot,
  FilterX,
  Coins,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import NoteCard from "@/components/NoteCard";
import { Note, Tag as TagType, Token } from "@/types";
import { useNavigate } from "react-router-dom";
import { fetchTags } from "@/services/tagService";
import { fetchTokens } from "@/services/tokenService";
import { useNotes } from "@/contexts/NotesContext";
import TagBadge from "@/components/ui/tag-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Notes = () => {
  const navigate = useNavigate();
  const { notes: contextNotes, isLoading: isLoadingContextNotes, refetch } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tokenFilteredNotes, setTokenFilteredNotes] = useState<Record<string, string[]>>({});
  const [tokenFilteringComplete, setTokenFilteringComplete] = useState(false);

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
  });

  useEffect(() => {
    setTokenFilteredNotes({});
    setTokenFilteringComplete(selectedTokens.length === 0);
  }, [selectedTokens]);

  const tagMapping = tags.reduce((acc: Record<string, string>, tag: TagType) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  const handleTokenMatch = useCallback((noteId: string, tokenId: string, matches: boolean) => {
    if (matches) {
      setTokenFilteredNotes(prev => ({
        ...prev,
        [tokenId]: [...(prev[tokenId] || []), noteId]
      }));
    }
  }, []);

  const categories = Array.from(
    new Set(contextNotes.filter(note => note.category).map(note => note.category))
  );

  const selectedTokenNames = tokens
    .filter(token => selectedTokens.includes(token.id))
    .map(token => token.symbol);

  const filteredNotes = contextNotes.filter((note) => {
    if (!note) return false;

    const searchMatch =
      !searchQuery ||
      (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content &&
        note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const categoryMatch =
      selectedCategories.length === 0 || 
      (note.category && selectedCategories.includes(note.category));

    const tagMatch =
      selectedTags.length === 0 || 
      (note.tags && note.tags.some(tag => selectedTags.includes(tag)));

    let tokenMatch = true;
    if (selectedTokens.length > 0) {
      if (!tokenFilteringComplete) {
        tokenMatch = true;
      } else {
        tokenMatch = selectedTokens.some(tokenId => 
          tokenFilteredNotes[tokenId]?.includes(note.id)
        );
      }
    }
    
    return searchMatch && categoryMatch && tagMatch && tokenMatch;
  });

  const handleCreateNote = () => {
    navigate("/editor/new");
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleToken = (tokenId: string) => {
    setSelectedTokens(prev => 
      prev.includes(tokenId)
        ? prev.filter(t => t !== tokenId)
        : [...prev, tokenId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedTokens([]);
  };

  const areFiltersActive =
    searchQuery !== "" || 
    selectedCategories.length > 0 || 
    selectedTags.length > 0 || 
    selectedTokens.length > 0;

  useEffect(() => {
    if (selectedTokens.length > 0) {
      const allTokensFiltered = selectedTokens.every(
        tokenId => tokenId in tokenFilteredNotes
      );
      
      if (allTokensFiltered) {
        setTokenFilteringComplete(true);
      }
    }
  }, [tokenFilteredNotes, selectedTokens]);
  
  const filteredNoteCount = filteredNotes.length;

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground text-sm">
            Browse and search all your market research notes
          </p>
        </div>
        <Button onClick={handleCreateNote} className="gap-2">
          <PlusCircle size={18} />
          New Note
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left sidebar with filters */}
        <div className="w-full md:w-1/4 space-y-4">
          {/* Categories filter */}
          <div className="bg-card rounded-lg shadow-sm p-3">
            <div className="flex items-center gap-2 font-medium mb-2 text-sm">
              <FolderOpenDot size={16} className="text-primary" />
              Categories
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {categories.length === 0 ? (
                <div className="text-xs text-muted-foreground p-1">No categories available</div>
              ) : (
                categories.map(category => (
                  <div 
                    key={category}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm cursor-pointer ${
                      selectedCategories.includes(category) 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="truncate">{category}</span>
                    {selectedCategories.includes(category) && (
                      <Badge variant="default" className="ml-auto h-4 w-4 p-0 flex items-center justify-center">
                        <X size={10} />
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tags filter */}
          <div className="bg-card rounded-lg shadow-sm p-3">
            <div className="flex items-center gap-2 font-medium mb-2 text-sm">
              <Tag size={16} className="text-primary" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {tags.length === 0 ? (
                <div className="text-xs text-muted-foreground p-1">No tags available</div>
              ) : (
                tags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag.name}
                    selected={selectedTags.includes(tag.id)}
                    onClick={() => toggleTag(tag.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Tokens filter */}
          <div className="bg-card rounded-lg shadow-sm p-3">
            <div className="flex items-center gap-2 font-medium mb-2 text-sm">
              <Coins size={16} className="text-primary" />
              Tokens
            </div>
            <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {tokens.length === 0 ? (
                <div className="text-xs text-muted-foreground p-1">No tokens available</div>
              ) : (
                tokens.map(token => (
                  <Badge
                    key={token.id}
                    variant={selectedTokens.includes(token.id) ? "default" : "outline"}
                    className={`cursor-pointer text-xs py-1 px-2 font-normal ${
                      selectedTokens.includes(token.id) 
                        ? "bg-[#0A3A5C]" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleToken(token.id)}
                  >
                    <Coins size={10} className="mr-1" />
                    {token.symbol}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Clear filters button */}
          {areFiltersActive && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="w-full gap-1 text-xs"
              size="sm"
            >
              <FilterX size={14} />
              Clear all filters
            </Button>
          )}
        </div>

        {/* Main content area */}
        <div className="w-full md:w-3/4 space-y-4">
          {/* Search and view mode controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              size="sm"
              className="h-9 sm:w-auto w-full"
            >
              {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
              <span className="ml-2">{viewMode === "grid" ? "List view" : "Grid view"}</span>
            </Button>
          </div>

          {/* Active filters display */}
          {areFiltersActive && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-md">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              
              {selectedCategories.map(category => (
                <Badge
                  key={category}
                  variant="outline"
                  className="flex items-center gap-1 bg-muted/40"
                >
                  <FolderOpenDot size={12} />
                  {category}
                  <X
                    size={12}
                    className="cursor-pointer ml-1"
                    onClick={() => toggleCategory(category)}
                  />
                </Badge>
              ))}
              
              {selectedTags.map(tagId => (
                <Badge
                  key={tagId}
                  variant="outline"
                  className="flex items-center gap-1 bg-muted/40"
                >
                  <Tag size={12} />
                  {tagMapping[tagId] || tagId}
                  <X
                    size={12}
                    className="cursor-pointer ml-1"
                    onClick={() => toggleTag(tagId)}
                  />
                </Badge>
              ))}
              
              {selectedTokens.map(tokenId => {
                const token = tokens.find(t => t.id === tokenId);
                return (
                  <Badge
                    key={tokenId}
                    variant="outline"
                    className="flex items-center gap-1 bg-muted/40"
                  >
                    <Coins size={12} />
                    {token?.symbol || tokenId}
                    <X
                      size={12}
                      className="cursor-pointer ml-1"
                      onClick={() => toggleToken(tokenId)}
                    />
                  </Badge>
                );
              })}
              
              {searchQuery && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-muted/40"
                >
                  <Search size={12} />
                  {searchQuery}
                  <X
                    size={12}
                    className="cursor-pointer ml-1"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing {filteredNoteCount} of {contextNotes.length} notes
              {selectedTokens.length > 0 && !tokenFilteringComplete && (
                <span className="ml-2 italic">Filtering in progress...</span>
              )}
            </div>
          </div>

          {/* Notes display */}
          {isLoadingContextNotes ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              : "flex flex-col gap-2"
            }>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="h-28 animate-pulse bg-muted/40 glass-card"
                />
              ))}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  : "flex flex-col gap-2"
              }
            >
              {filteredNotes.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {selectedTokens.length > 0 && !tokenFilteringComplete
                      ? "Filtering notes by token..."
                      : contextNotes.length === 0
                      ? "No notes found. Create your first note!"
                      : "No notes match your filters"}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    className={viewMode === "list" ? "flex-row items-center" : ""}
                    tagMapping={tagMapping}
                    selectedTokenIds={selectedTokens}
                    onTokenMatch={selectedTokens.length > 0 ? handleTokenMatch : undefined}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
