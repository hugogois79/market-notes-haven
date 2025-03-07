
import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Save,
  Clock,
  Tags as TagsIcon,
  ChevronDown,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditorHeaderProps {
  title: string;
  setTitle: (title: string) => void;
  summary: string;
  isGeneratingSummary: boolean;
  generateSummary: () => void;
  category: string;
  handleCategorySelect: (category: string) => void;
  allCategories: string[];
  lastSaved: Date | null;
  handleSave: () => void;
  isUploading: boolean;
}

const EditorHeader = ({
  title,
  setTitle,
  summary,
  isGeneratingSummary,
  generateSummary,
  category,
  handleCategorySelect,
  allCategories,
  lastSaved,
  handleSave,
  isUploading,
}: EditorHeaderProps) => {
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Note Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
      />
      
      {/* AI Summary Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm text-muted-foreground">AI Summary</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSummary}
            disabled={isGeneratingSummary}
            className="h-7 px-2 flex items-center gap-1"
          >
            {isGeneratingSummary ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span className="text-xs">Generate</span>
              </>
            )}
          </Button>
        </div>
        <div className={cn(
          "text-sm p-3 rounded-md border border-border/50 bg-secondary/30 min-h-[50px]",
          !summary && "italic text-muted-foreground"
        )}>
          {summary || "No summary yet. Click 'Generate' to create an AI summary of your note."}
        </div>
      </div>
      
      {/* Last saved info and Save button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-sm text-muted-foreground">
            <Clock size={14} />
            <span>
              {lastSaved 
                ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                : "Not saved yet"}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-8">
                <TagsIcon size={14} />
                <span>{category}</span>
                <ChevronDown size={14} className="opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allCategories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn("cursor-pointer", {
                    "font-medium": cat === category,
                  })}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Save Button */}
        <Button 
          variant="brand" 
          size="sm" 
          className="gap-2 ml-auto" 
          onClick={handleSave}
          disabled={isUploading}
        >
          <Save size={16} />
          {isUploading ? "Uploading..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
};

export default EditorHeader;
