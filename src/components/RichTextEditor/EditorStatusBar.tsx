
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
}

const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  isSaving,
  lastSaved,
  onSave
}) => {
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
