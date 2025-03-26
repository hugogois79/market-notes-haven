
import React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPrint?: () => void;
}

const EditorStatusBar = ({ isSaving, lastSaved, onSave }: EditorStatusBarProps) => {
  return (
    <div className="flex items-center justify-between py-2 px-4 bg-background z-20 border-b w-full sticky top-0">
      <div className="text-sm text-muted-foreground">
        {isSaving ? (
          <span className="text-brand">Saving...</span>
        ) : lastSaved ? (
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        ) : null}
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button
          onClick={onSave}
          disabled={isSaving}
          variant="outline"
          className="gap-2 whitespace-nowrap"
          size="sm"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default EditorStatusBar;
