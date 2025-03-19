
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

const Notes = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tokenFilteredNotes, setTokenFilteredNotes] = useState<string[]>([]);
  const [tokenFilteringComplete, setTokenFilteringComplete] = useState(false);

  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
  });

  useEffect(() => {
    setTokenFilteredNotes([]);
    setTokenFilteringComplete(selectedToken === null);
  }, [selectedToken]);

  const tagMapping = tags.reduce((acc: Record<string, string>, tag: TagType) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  const handleTokenMatch = useCallback((noteId: string, matches: boolean) => {
    if (matches) {
      setTokenFilteredNotes(prev => [...prev, noteId]);
    }
  }, []);

  const categories = Array.from(
    new Set(notes.filter(note => note.category).map(note => note.category))
  );

  const selectedTokenName = tokens.find(token => token.id === selectedToken)?.symbol || selectedToken;

  const filteredNotes = notes.filter((note) => {
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

  const handleCreateNote = () => {
    navigate("/editor/new");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedToken(null);
  };

  const areFiltersActive =
    searchQuery !== "" || selectedCategory !== null || selectedTag !== null || selectedToken !== null;

  useEffect(() => {
    if (selectedToken && tokenFilteredNotes.length > 0) {
      setTokenFilteringComplete(true);
    }
  }, [tokenFilteredNotes, selectedToken]);
  
  const filteredNoteCount = selectedToken && tokenFilteringComplete 
    ? filteredNotes.length 
    : filteredNotes.length;

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
          >
            <FolderOpenDot size={16} />
            Category
          </Button>
          <Button
            variant={selectedTag !== null ? "default" : "outline"}
            className="gap-1"
            onClick={() => setSelectedTag(selectedTag ? null : tags[0]?.id)}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 border rounded-md">
          <TokenSection
            isFilter={true}
            selectedTokens={[]}
            handleRemoveToken={() => {}}
            handleTokenSelect={(token) => {
              setSelectedToken(token.id);
            }}
            isLoadingTokens={isLoadingTokens}
            onFilterChange={setSelectedToken}
            selectedFilterToken={selectedToken}
          />
        </Card>
        {/* Additional filter cards could go here */}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNoteCount} of {notes.length} notes
          {selectedToken && !tokenFilteringComplete && (
            <span className="ml-2 italic">Filtering in progress...</span>
          )}
        </div>
      </div>

      {isLoadingNotes ? (
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
                  : "No notes found"}
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
