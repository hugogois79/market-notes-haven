
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import NoteCard from "@/components/NoteCard";
import { Note, Tag as TagType, Token } from "@/types";
import { useNavigate } from "react-router-dom";
import { fetchTags } from "@/services/tagService";
import { fetchTokens } from "@/services/tokenService";
import TokenSection from "@/components/RichTextEditor/TokenSection";
import { useNotes } from "@/contexts/NotesContext";
import TagBadge from "@/components/ui/tag-badge";

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

  // Fetch tags
  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  // Fetch tokens
  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
  });

  // Reset token filtering when token selection changes
  useEffect(() => {
    setTokenFilteredNotes({});
    setTokenFilteringComplete(selectedTokens.length === 0);
  }, [selectedTokens]);

  // Create tag mapping for display
  const tagMapping = tags.reduce((acc: Record<string, string>, tag: TagType) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  // Handle token match feedback from NoteCard components
  const handleTokenMatch = useCallback((noteId: string, tokenId: string, matches: boolean) => {
    if (matches) {
      setTokenFilteredNotes(prev => ({
        ...prev,
        [tokenId]: [...(prev[tokenId] || []), noteId]
      }));
    }
  }, []);

  // Get unique categories from notes
  const categories = Array.from(
    new Set(contextNotes.filter(note => note.category).map(note => note.category))
  );

  // Get selected token names for display
  const selectedTokenNames = tokens
    .filter(token => selectedTokens.includes(token.id))
    .map(token => token.symbol);

  // Filter notes based on search, categories, tags, and tokens
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

    // For token filtering, a note matches if it contains ANY of the selected tokens
    let tokenMatch = true;
    if (selectedTokens.length > 0) {
      if (!tokenFilteringComplete) {
        // Still filtering, include all notes for now
        tokenMatch = true;
      } else {
        // Check if note is in any of the filtered note lists for the selected tokens
        tokenMatch = selectedTokens.some(tokenId => 
          tokenFilteredNotes[tokenId]?.includes(note.id)
        );
      }
    }
    
    return searchMatch && categoryMatch && tagMatch && tokenMatch;
  });

  // Create new note
  const handleCreateNote = () => {
    navigate("/editor/new");
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Toggle token selection
  const toggleToken = (tokenId: string) => {
    setSelectedTokens(prev => 
      prev.includes(tokenId)
        ? prev.filter(t => t !== tokenId)
        : [...prev, tokenId]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedTokens([]);
  };

  // Check if any filters are active
  const areFiltersActive =
    searchQuery !== "" || 
    selectedCategories.length > 0 || 
    selectedTags.length > 0 || 
    selectedTokens.length > 0;

  // Update token filtering complete status when we have results
  useEffect(() => {
    if (selectedTokens.length > 0) {
      // Check if we have results for all selected tokens
      const allTokensFiltered = selectedTokens.every(
        tokenId => tokenId in tokenFilteredNotes
      );
      
      if (allTokensFiltered) {
        setTokenFilteringComplete(true);
      }
    }
  }, [tokenFilteredNotes, selectedTokens]);
  
  // Count filtered notes
  const filteredNoteCount = filteredNotes.length;

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Browse and search all your market research notes
          </p>
        </div>
        <Button onClick={handleCreateNote} className="gap-2">
          <PlusCircle size={18} />
          New Note
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
          </Button>
          {areFiltersActive && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-1 text-xs"
            >
              <FilterX size={16} />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {areFiltersActive && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          
          {selectedCategories.map(category => (
            <Badge
              key={category}
              variant="outline"
              className="flex items-center gap-1 bg-muted/40"
            >
              Category: {category}
              <X
                size={14}
                className="cursor-pointer"
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
              Tag: {tagMapping[tagId] || tagId}
              <X
                size={14}
                className="cursor-pointer"
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
                Token: {token?.symbol || tokenId}
                <X
                  size={14}
                  className="cursor-pointer"
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
              Search: {searchQuery}
              <X
                size={14}
                className="cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Filters section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Category filter */}
        <Card className="p-3 border rounded-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FolderOpenDot size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Filter by Category
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge 
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "secondary"}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
              {categories.length === 0 && (
                <span className="text-sm text-muted-foreground">No categories available</span>
              )}
            </div>
          </div>
        </Card>
        
        {/* Tag filter */}
        <Card className="p-3 border rounded-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Filter by Tag
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <TagBadge 
                  key={tag.id}
                  tag={tag.name}
                  selected={selectedTags.includes(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground">No tags available</span>
              )}
            </div>
          </div>
        </Card>
        
        {/* Token filter */}
        <Card className="p-3 border rounded-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Filter by Token
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tokens.map(token => (
                <Badge 
                  key={token.id}
                  variant={selectedTokens.includes(token.id) ? "default" : "secondary"}
                  className="cursor-pointer px-3 py-1 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/80"
                  onClick={() => toggleToken(token.id)}
                >
                  {token.symbol}
                </Badge>
              ))}
              {tokens.length === 0 && (
                <span className="text-sm text-muted-foreground">No tokens available</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Notes count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNoteCount} of {contextNotes.length} notes
          {selectedTokens.length > 0 && !tokenFilteringComplete && (
            <span className="ml-2 italic">Filtering in progress...</span>
          )}
        </div>
      </div>

      {/* Notes display */}
      {isLoadingContextNotes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="h-32 animate-pulse bg-muted/40 glass-card"
            />
          ))}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-4"
          }
        >
          {filteredNotes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
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
  );
};

export default Notes;
