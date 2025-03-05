
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag as TagIcon, FileText, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";
import { toast } from "sonner";

interface TagsPageProps {
  notes: Note[];
  loading?: boolean;
}

const Tags = ({ notes, loading = false }: TagsPageProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<{name: string, count: number}[]>([]);
  
  // Extract all unique tags from notes
  useEffect(() => {
    if (notes.length > 0) {
      const tagCounts: Record<string, number> = {};
      
      notes.forEach(note => {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const tagList = Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count
      }));
      
      // Sort tags alphabetically
      tagList.sort((a, b) => a.name.localeCompare(b.name));
      
      setTags(tagList);
    }
  }, [notes]);
  
  // Filter notes based on search query and selected tag
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || 
      note.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      // If clicking the same tag, clear the filter
      setSelectedTag(null);
      toast.info("Showing all notes");
    } else {
      setSelectedTag(tag);
      toast.info(`Showing notes with tag: ${tag}`);
    }
  };

  const handleClearSelection = () => {
    setSelectedTag(null);
    setSearchQuery("");
    toast.info("Filters cleared");
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB] flex items-center gap-2">
            <TagIcon className="h-8 w-8" />
            Tags
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize and filter your notes by tags
          </p>
        </div>
      </div>

      {/* Search and filter info */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in tags or notes..."
            className="pl-9 w-full max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {selectedTag && (
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Filtered by tag:</span>
            <Badge variant="default" className="cursor-pointer bg-[#1EAEDB]">
              {selectedTag}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-8 w-8 p-0" 
              onClick={handleClearSelection}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filter</span>
            </Button>
          </div>
        )}
      </div>

      {/* Tags cloud */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TagIcon size={20} className="text-[#1EAEDB]" />
          All Tags
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-[#1EAEDB] border-t-transparent rounded-full inline-block mb-2"></div>
            <p>Loading tags...</p>
          </div>
        ) : tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge 
                key={tag.name}
                variant={selectedTag === tag.name ? "default" : "secondary"}
                className={`text-sm py-1 px-3 cursor-pointer hover:bg-opacity-90 transition-all ${
                  selectedTag === tag.name ? 'bg-[#1EAEDB]' : ''
                }`}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
                <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                  {tag.count}
                </span>
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <TagIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No tags found. Add tags to your notes to see them here.</p>
          </div>
        )}
      </div>

      {/* Notes with selected tag */}
      {selectedTag && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#1EAEDB]" />
            Notes with tag: {selectedTag}
          </h2>
          
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No notes found with the selected tag.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Show all notes if no tag is selected */}
      {!selectedTag && searchQuery && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#1EAEDB]" />
            Search Results
          </h2>
          
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No notes found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tags;
