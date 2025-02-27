
import { Button } from "@/components/ui/button";
import { FileText, Plus, Bookmark, FolderOpen, Clock, Rocket, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import NoteCard from "@/components/NoteCard";
import MarketTrends from "@/components/MarketTrends";
import { Note } from "@/types";
import { toast } from "sonner";

interface IndexProps {
  notes: Note[];
  loading?: boolean;
}

const Index = ({ notes, loading = false }: IndexProps) => {
  // Get recent notes (last 6)
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  // Mock categories with counts
  const categories = [
    { name: "Stocks", count: 12, icon: <FileText size={16} /> },
    { name: "Crypto", count: 8, icon: <Bookmark size={16} /> },
    { name: "Forex", count: 5, icon: <FolderOpen size={16} /> },
    { name: "Commodities", count: 3, icon: <Clock size={16} /> },
  ];

  return (
    <div className="space-y-6 py-2 animate-fade-in">
      {/* Header with Logo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/975730be-0cc6-45cc-95c5-6f382241b98c.png" 
            alt="Grand Victoria Ventures Capital" 
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-3xl font-semibold text-[#1EAEDB]">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Your market research and analysis hub
            </p>
          </div>
        </div>
        <Link to="/editor/new">
          <Button className="gap-2" size="sm" variant="brand">
            <Plus size={16} />
            New Note
          </Button>
        </Link>
      </div>

      {/* Market Trends Section */}
      <MarketTrends />

      {/* Recent Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} className="text-[#1EAEDB]" />
            Recent Notes
          </h2>
          <Link to="/notes">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
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
          <div className="bg-card rounded-lg p-8 text-center border border-border animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1EAEDB]/10 text-[#1EAEDB] mb-4">
              <Rocket size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start creating market research notes to track your insights and analysis.
            </p>
            <Link to="/editor/new">
              <Button variant="brand">
                Create Your First Note
              </Button>
            </Link>
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
              className="bg-card glass-card rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
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
