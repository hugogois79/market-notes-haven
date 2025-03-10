
import React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
}

const EditorStatusBar = ({ isSaving, lastSaved, onSave }: EditorStatusBarProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {isSaving ? (
          <span className="text-brand">Saving...</span>
        ) : lastSaved ? (
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        ) : null}
      </div>
      
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="outline"
        className="gap-2"
        size="sm"
      >
        <Save size={16} />
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
};

export default EditorStatusBar;
