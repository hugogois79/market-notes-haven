
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import NoteCard from "@/components/NoteCard";
import { Note, Tag as TagType, Token } from "@/types";
import { useNavigate } from "react-router-dom";
import { fetchNotes } from "@/services/supabaseService";
import { fetchTags } from "@/services/tagService";
import { fetchTokens } from "@/services/tokenService";
import TokenSection from "@/components/RichTextEditor/TokenSection";
import { useNotes } from "@/contexts/NotesContext";

const Notes = () => {
  const navigate = useNavigate();
  const { notes: contextNotes, isLoading: isLoadingContextNotes, refetch } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tokenFilteredNotes, setTokenFilteredNotes] = useState<string[]>([]);
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
    setTokenFilteredNotes([]);
    setTokenFilteringComplete(selectedToken === null);
  }, [selectedToken]);

  // Create tag mapping for display
  const tagMapping = tags.reduce((acc: Record<string, string>, tag: TagType) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  // Handle token match feedback from NoteCard components
  const handleTokenMatch = useCallback((noteId: string, matches: boolean) => {
    if (matches) {
      setTokenFilteredNotes(prev => [...prev, noteId]);
    }
  }, []);

  // Get unique categories from notes
  const categories = Array.from(
    new Set(contextNotes.filter(note => note.category).map(note => note.category))
  );

  // Get selected token name for display
  const selectedTokenName = tokens.find(token => token.id === selectedToken)?.symbol || selectedToken;

  // Filter notes based on search, category, tag, and token
  const filteredNotes = contextNotes.filter((note) => {
    if (!note) return false;

    const searchMatch =
      !searchQuery ||
      (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content &&
        note.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const categoryMatch =
      !selectedCategory || note.category === selectedCategory;

    const tagMatch =
      !selectedTag || (note.tags && note.tags.includes(selectedTag));

    const tokenMatch = 
      !selectedToken || 
      (tokenFilteringComplete && tokenFilteredNotes.includes(note.id));
    
    if (!selectedToken) {
      return searchMatch && categoryMatch && tagMatch;
    } else if (!tokenFilteringComplete) {
      return searchMatch && categoryMatch && tagMatch;
    } else {
      return searchMatch && categoryMatch && tagMatch && tokenMatch;
    }
  });

  // Create new note
  const handleCreateNote = () => {
    navigate("/editor/new");
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedToken(null);
  };

  // Check if any filters are active
  const areFiltersActive =
    searchQuery !== "" || selectedCategory !== null || selectedTag !== null || selectedToken !== null;

  // Update token filtering complete status when we have results
  useEffect(() => {
    if (selectedToken && tokenFilteredNotes.length > 0) {
      setTokenFilteringComplete(true);
    }
  }, [tokenFilteredNotes, selectedToken]);
  
  // Count filtered notes
  const filteredNoteCount = filteredNotes.length;

  // Handle token selection for filter
  const handleTokenSelect = (token: Token | string) => {
    if (typeof token === 'string') {
      setSelectedToken(token);
    } else {
      setSelectedToken(token.id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            variant={selectedCategory !== null ? "default" : "outline"}
            className="gap-1"
            onClick={() => setSelectedCategory(selectedCategory ? null : categories[0])}
            disabled={categories.length === 0}
          >
            <FolderOpenDot size={16} />
            Category
          </Button>
          <Button
            variant={selectedTag !== null ? "default" : "outline"}
            className="gap-1"
            onClick={() => setSelectedTag(selectedTag ? null : tags[0]?.id)}
            disabled={tags.length === 0}
          >
            <Tag size={16} />
            Tags{selectedTag ? " (1)" : ""}
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
          </Button>
        </div>
      </div>

      {/* Active filters display */}
      {areFiltersActive && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {selectedCategory && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-muted/40"
            >
              Category: {selectedCategory}
              <X
                size={14}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              />
            </Badge>
          )}
          {selectedTag && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-muted/40"
            >
              Tag: {tagMapping[selectedTag] || selectedTag}
              <X
                size={14}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              />
            </Badge>
          )}
          {selectedToken && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-muted/40"
            >
              Token: {selectedTokenName}
              <X
                size={14}
                className="cursor-pointer"
                onClick={() => setSelectedToken(null)}
              />
            </Badge>
          )}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Filters section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Token filter */}
        <Card className="p-4 border rounded-md">
          <TokenSection
            isFilter={true}
            selectedTokens={[]}
            handleRemoveToken={() => {}}
            handleTokenSelect={handleTokenSelect}
            isLoadingTokens={isLoadingTokens}
            onFilterChange={setSelectedToken}
            selectedFilterToken={selectedToken}
          />
        </Card>
        
        {/* Category filter */}
        <Card className="p-4 border rounded-md">
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
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
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
        <Card className="p-4 border rounded-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Filter by Tag
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge 
                  key={tag.id}
                  variant={selectedTag === tag.id ? "default" : "secondary"}
                  className="cursor-pointer px-3 py-1 flex items-center gap-1"
                  onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                >
                  <Tag size={12} />
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground">No tags available</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Notes count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNoteCount} of {contextNotes.length} notes
          {selectedToken && !tokenFilteringComplete && (
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
              className="h-40 animate-pulse bg-muted/40 glass-card"
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
                {selectedToken && !tokenFilteringComplete
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
                selectedTokenId={selectedToken}
                onTokenMatch={selectedToken ? handleTokenMatch : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;
