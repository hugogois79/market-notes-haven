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
    <div className="container mx-auto py-4 space-y-3">
      <div className="flex items-center justify-between">
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

      <div className="flex flex-col md:flex-row gap-2">
        <div className="w-full md:w-3/4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            size="sm"
            className="h-9"
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
          </Button>
          {areFiltersActive && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-1 text-xs h-9"
              size="sm"
            >
              <FilterX size={16} />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {areFiltersActive && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          
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

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-background h-9 text-sm" size="sm">
              <FolderOpenDot size={14} />
              Filter by Category
              <ChevronDown size={12} className="ml-1" />
              {selectedCategories.length > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center px-1">
                  {selectedCategories.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.length === 0 ? (
              <DropdownMenuItem disabled>No categories available</DropdownMenuItem>
            ) : (
              categories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-background h-9 text-sm" size="sm">
              <Tag size={14} />
              Filter by Tag
              <ChevronDown size={12} className="ml-1" />
              {selectedTags.length > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center px-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            <DropdownMenuLabel>Select Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.length === 0 ? (
              <DropdownMenuItem disabled>No tags available</DropdownMenuItem>
            ) : (
              tags.map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={selectedTags.includes(tag.id)}
                  onCheckedChange={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-background h-9 text-sm" size="sm">
              <Coins size={14} />
              Filter by Token
              <ChevronDown size={12} className="ml-1" />
              {selectedTokens.length > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center px-1">
                  {selectedTokens.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            <DropdownMenuLabel>Select Tokens</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tokens.length === 0 ? (
              <DropdownMenuItem disabled>No tokens available</DropdownMenuItem>
            ) : (
              tokens.map(token => (
                <DropdownMenuCheckboxItem
                  key={token.id}
                  checked={selectedTokens.includes(token.id)}
                  onCheckedChange={() => toggleToken(token.id)}
                >
                  {token.symbol} - {token.name}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {filteredNoteCount} of {contextNotes.length} notes
          {selectedTokens.length > 0 && !tokenFilteringComplete && (
            <span className="ml-2 italic">Filtering in progress...</span>
          )}
        </div>
      </div>

      {isLoadingContextNotes ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
              ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
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
  );
};

export default Notes;
