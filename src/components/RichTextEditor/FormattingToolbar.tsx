
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
    <div className="flex items-center flex-wrap gap-1 p-2 bg-muted/30 rounded-md mx-2 my-2">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("bold")}
        title="Bold"
        className="h-8 w-8"
      >
        <Bold size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("italic")}
        title="Italic"
        className="h-8 w-8"
      >
        <Italic size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("insertUnorderedList")}
        title="Bullet List"
        className="h-8 w-8"
      >
        <List size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => execCommand("insertOrderedList")}
        title="Numbered List"
        className="h-8 w-8"
      >
        <ListOrdered size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsTableDialogOpen(true)}
        title="Insert Table"
        className="h-8 w-8"
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
        className="h-8 w-8"
      >
        <AlignLeft size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("center")}
        title="Align Center"
        className="h-8 w-8"
      >
        <AlignCenter size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("right")}
        title="Align Right"
        className="h-8 w-8"
      >
        <AlignRight size={16} />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => formatTableCells("justify")}
        title="Justify"
        className="h-8 w-8"
      >
        <AlignJustify size={16} />
      </Button>
    </div>
  );
};

export default FormattingToolbar;
