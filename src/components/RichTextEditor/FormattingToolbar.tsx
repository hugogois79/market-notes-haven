
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Table
} from "lucide-react";

export interface FormattingToolbarProps {
  execCommand: (command: string, value?: string) => void;
  setIsTableDialogOpen: (isOpen: boolean) => void;
  formatTableCells: (alignment: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ 
  execCommand, 
  setIsTableDialogOpen,
  formatTableCells
}) => {
  return (
    <div className="flex items-center flex-wrap gap-1 p-1 bg-muted rounded-md mb-2">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("bold")}
        title="Bold"
      >
        <Bold size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("italic")}
        title="Italic"
      >
        <Italic size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("insertUnorderedList")}
        title="Bullet List"
      >
        <List size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("insertOrderedList")}
        title="Numbered List"
      >
        <ListOrdered size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsTableDialogOpen(true)}
        title="Insert Table"
      >
        <Table size={16} />
      </Button>

      {/* Text alignment buttons */}
      <div className="border-l border-muted-foreground/20 mx-1 h-6"></div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("left")}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("center")}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("right")}
        title="Align Right"
      >
        <AlignRight size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("justify")}
        title="Justify"
      >
        <AlignJustify size={16} />
      </Button>
    </div>
  );
};

export default FormattingToolbar;
