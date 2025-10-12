import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Clock, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  noteContent?: {
    title: string;
    category: string;
    content: string;
    tags?: string[];
    summary?: string;
  };
}

const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  isSaving,
  lastSaved,
  onSave,
  noteContent
}) => {
  const handleCopyToClipboard = async () => {
    if (!noteContent) {
      toast.error("No content to copy");
      return;
    }

    try {
      // Create a formatted text version of the note
      let textToCopy = `Title: ${noteContent.title}\n`;
      textToCopy += `Category: ${noteContent.category}\n`;
      
      if (noteContent.tags && noteContent.tags.length > 0) {
        textToCopy += `Tags: ${noteContent.tags.join(", ")}\n`;
      }
      
      if (noteContent.summary) {
        textToCopy += `\nSummary:\n${noteContent.summary}\n`;
      }
      
      textToCopy += `\nContent:\n${noteContent.content}`;

      await navigator.clipboard.writeText(textToCopy);
      toast.success("Note copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-muted/30 text-xs text-muted-foreground border-t border-b">
      <div className="flex items-center gap-2">
        <Clock size={12} />
        <span>
          {lastSaved
            ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
            : "Not saved yet"}
        </span>
        {isSaving && <span className="text-blue-500 animate-pulse">Saving...</span>}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1"
          onClick={handleCopyToClipboard}
          title="Copy note content to clipboard"
        >
          <Copy size={12} />
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs flex items-center gap-1"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={12} />
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditorStatusBar;
