import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PlusCircle,
  Tag as TagIcon,
  Grid3X3,
  List,
  X,
  FolderOpenDot,
  FilterX,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import NoteCard from "@/components/NoteCard";
import { Note, Tag as TagType } from "@/types";
import { useNavigate } from "react-router-dom";
import { fetchTags } from "@/services/tag";
import { useNotes } from "@/contexts/NotesContext";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseProject {
  id: string;
  name: string;
  color: string | null;
}
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MetadataSection from "@/components/RichTextEditor/MetadataSection";

const Notes = () => {
  const navigate = useNavigate();
  const { notes: contextNotes, isLoading: isLoadingContextNotes, refetch } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tagInput, setTagInput] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  // Fetch projects for filter
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["expense-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_projects')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as ExpenseProject[];
    },
  });

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });



  const tagMapping = tags.reduce((acc: Record<string, string>, tag: TagType) => {
    acc[tag.id] = tag.name;
    return acc;
  }, {});

  const categories = Array.from(
    new Set(contextNotes.filter(note => note.category).map(note => note.category))
  );

  const filteredNotes = useMemo(() => {
    if (!contextNotes || contextNotes.length === 0) return [];
  
    return contextNotes.filter(note => {
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

      const projectMatch =
        selectedProjects.length === 0 || 
        (note.project_id && selectedProjects.includes(note.project_id));
      
      return searchMatch && categoryMatch && tagMatch && projectMatch;
    });
  }, [contextNotes, searchQuery, selectedCategories, selectedTags, selectedProjects]);

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

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(p => p !== projectId)
        : [...prev, projectId]
    );
  };

  const handleAddTag = async () => {
    return Promise.resolve();
  };

  const handleRemoveTag = (tagToRemove: string | TagType) => {
    const tagId = typeof tagToRemove === 'string' ? tagToRemove : tagToRemove.id;
    toggleTag(tagId);
  };

  const handleSelectTag = (tag: TagType) => {
    toggleTag(tag.id);
  };

  const getAvailableTagsForSelection = () => {
    return tags.filter(tag => 
      !selectedTags.includes(tag.id) &&
      (!tagSearchQuery || tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
    );
  };

  const filteredCategories = categories.filter(
    category => !categorySearchQuery || 
    category.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(
    project => !projectSearchQuery || 
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedProjects([]);
  };

  const areFiltersActive =
    searchQuery !== "" || 
    selectedCategories.length > 0 || 
    selectedTags.length > 0 || 
    selectedProjects.length > 0;

  const filteredNoteCount = filteredNotes.length;

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id));
  const selectedProjectObjects = projects.filter(project => selectedProjects.includes(project.id));

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

      <div className="flex flex-wrap gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
            >
              <FolderOpenDot size={14} />
              <span>Categories</span>
              {selectedCategories.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5">
                  {selectedCategories.length}
                </Badge>
              )}
              <ChevronDown size={14} className="ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="text-xs text-center py-2 text-muted-foreground">
                  {categorySearchQuery ? "No matching categories" : "No categories available"}
                </div>
              ) : (
                filteredCategories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    <div className="flex items-center">
                      <FolderOpenDot size={14} className="mr-2 text-muted-foreground" />
                      {category}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
            {selectedCategories.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setSelectedCategories([])} 
                  className="justify-center text-red-500"
                >
                  <X size={14} className="mr-2" />
                  Clear categories
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
            >
              <TagIcon size={14} />
              <span>Tags</span>
              {selectedTags.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5">
                  {selectedTags.length}
                </Badge>
              )}
              <ChevronDown size={14} className="ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[250px]">
            <DropdownMenuLabel>Select Tags</DropdownMenuLabel>
            <div className="p-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedTagObjects.map((tag) => (
                  <div
                    key={tag.id}
                    className="bg-[#0A3A5C] hover:bg-[#0A3A5C]/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-white/70 hover:text-white"
                      aria-label={`Remove tag ${tag.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
              
              <div className="max-h-32 overflow-y-auto">
                {getAvailableTagsForSelection().length === 0 ? (
                  <div className="text-xs text-center py-2 text-muted-foreground">
                    {tagSearchQuery ? "No matching tags" : "No more tags available"}
                  </div>
                ) : (
                  getAvailableTagsForSelection().map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => handleSelectTag(tag)}
                      className="cursor-pointer text-sm"
                    >
                      {tag.name}
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </div>
            
            {selectedTags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setSelectedTags([])} 
                  className="justify-center text-red-500"
                >
                  <X size={14} className="mr-2" />
                  Clear tags
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1"
            >
              <FolderOpen size={14} />
              <span>Projetos</span>
              {selectedProjects.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5">
                  {selectedProjects.length}
                </Badge>
              )}
              <ChevronDown size={14} className="ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuLabel>Filtrar por Projeto</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar projetos..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="text-xs text-center py-2 text-muted-foreground">
                  {projectSearchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto disponível"}
                </div>
              ) : (
                filteredProjects.map(project => (
                  <DropdownMenuCheckboxItem
                    key={project.id}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  >
                    <div className="flex items-center">
                      <FolderOpen size={14} className="mr-2 text-muted-foreground" />
                      {project.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
            {selectedProjects.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setSelectedProjects([])} 
                  className="justify-center text-red-500"
                >
                  <X size={14} className="mr-2" />
                  Limpar projetos
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          size="sm"
          className="h-9 ml-auto"
        >
          {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
          <span className="ml-2 hidden sm:inline">{viewMode === "grid" ? "List view" : "Grid view"}</span>
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {areFiltersActive && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-md mb-4">
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
              <TagIcon size={12} />
              {tagMapping[tagId] || tagId}
              <X
                size={12}
                className="cursor-pointer ml-1"
                onClick={() => toggleTag(tagId)}
              />
            </Badge>
          ))}
          
          {selectedProjects.map(projectId => {
            const project = projects.find(p => p.id === projectId);
            return (
              <Badge
                key={projectId}
                variant="outline"
                className="flex items-center gap-1 bg-muted/40"
              >
                <FolderOpen size={12} />
                {project?.name || projectId}
                <X
                  size={12}
                  className="cursor-pointer ml-1"
                  onClick={() => toggleProject(projectId)}
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 px-2 text-xs ml-auto"
          >
            <FilterX size={12} className="mr-1" />
            Clear all
          </Button>
        </div>
      )}

      <div className="mt-6">
        {isLoadingContextNotes ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Search size={20} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No notes found</h3>
            <p className="text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
              {areFiltersActive
                ? "Try adjusting your filters or search to find what you're looking for."
                : "Get started by creating your first note."}
            </p>
            {areFiltersActive ? (
              <Button variant="outline" onClick={handleClearFilters}>
                <FilterX size={14} className="mr-2" />
                Clear filters
              </Button>
            ) : (
              <Button onClick={handleCreateNote}>
                <PlusCircle size={14} className="mr-2" />
                Create note
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
            }
          >
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                className={viewMode === "list" ? "flex-row" : ""}
                tagMapping={tagMapping}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
