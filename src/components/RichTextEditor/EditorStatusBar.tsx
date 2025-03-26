
import React from "react";
import { Save, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorStatusBarProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPrint?: () => void;
}

const EditorStatusBar = ({ isSaving, lastSaved, onSave, onPrint }: EditorStatusBarProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-muted-foreground">
        {isSaving ? (
          <span className="text-brand">Saving...</span>
        ) : lastSaved ? (
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        ) : null}
      </div>
      
      <div className="flex items-center gap-2">
        {onPrint && (
          <Button
            onClick={onPrint}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <Printer size={16} />
            Print
          </Button>
        )}
        
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
    </div>
  );
};

export default EditorStatusBar;
