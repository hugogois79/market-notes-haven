
import { Button } from "@/components/ui/button";
import { FileText, Plus, Bookmark, FolderOpen, Clock, Rocket, Loader, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface IndexProps {
  notes: Note[];
  loading?: boolean;
}

const Index = ({ notes, loading = false }: IndexProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    searchQuery === "" || 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get recent notes (last 6) from filtered notes
  const recentNotes = [...filteredNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Mock categories with counts
  const categories = [
    { name: "Stocks", count: 12, icon: <FileText size={16} /> },
    { name: "Crypto", count: 8, icon: <Bookmark size={16} /> },
    { name: "Forex", count: 5, icon: <FolderOpen size={16} /> },
    { name: "Commodities", count: 3, icon: <Clock size={16} /> },
  ];

  const handleNewNote = () => {
    console.log("Creating new note");
    navigate("/editor/new");
  };
  
  const handleViewAllNotes = () => {
    console.log("Viewing all notes");
    navigate("/notes");
  };

  return (
    <div className="space-y-6 px-6 py-4 animate-fade-in">
      {/* Header without Logo */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1EAEDB]">Dashboard</h1>
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
      </div>

      {/* Recent Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} className="text-[#1EAEDB]" />
            Recent Notes
          </h2>
          <Button variant="ghost" size="sm" onClick={handleViewAllNotes}>
            View All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-start items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-[#1EAEDB]" />
            <span className="ml-2 text-lg">Loading notes...</span>
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg p-8 text-left border border-border animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1EAEDB]/10 text-[#1EAEDB] mb-4">
              <Rocket size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "No Notes Found" : "No Notes Yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery 
                ? "Try adjusting your search query or create a new note." 
                : "Start creating market research notes to track your insights and analysis."}
            </p>
            <Button variant="brand" onClick={handleNewNote}>
              Create Your First Note
            </Button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen size={20} className="text-[#1EAEDB]" />
            Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div 
              key={category.name}
              className="bg-card glass-card rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
              onClick={() => toast.info(`${category.name} category selected`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 font-medium">
                  {category.icon}
                  {category.name}
                </div>
                <div className="bg-[#1EAEDB]/10 text-[#1EAEDB] text-xs rounded-full px-2 py-0.5">
                  {category.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
