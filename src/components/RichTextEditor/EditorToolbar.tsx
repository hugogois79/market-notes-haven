
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  ListOrdered, 
  List, 
  Heading1, 
  Heading2,
  Heading3,
  Table,
  Highlighter,
  Grip
} from "lucide-react";

interface EditorToolbarProps {
  editorRef: RefObject<HTMLDivElement> | null;
  execCommand: (command: string, value?: string) => void;
  formatTableCells?: (format: string) => void;
  insertVerticalSeparator?: () => void;
  highlightText?: () => void;
  boldText?: () => void;
  underlineText?: () => void; 
  hasConclusion?: boolean;
  category?: string;
  className?: string;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editorRef, 
  execCommand, 
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  boldText,
  underlineText,
  hasConclusion,
  category,
  className
}) => {
  return (
    <div className={`flex flex-wrap gap-0 p-0.5 bg-muted/95 border-b sticky top-0 z-40 backdrop-blur-sm shadow-sm ${className || ''}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => boldText ? boldText() : execCommand('bold')}
        title="Bold (Alt+B)"
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('italic')}
        title="Italic (Alt+I)"
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => underlineText ? underlineText() : execCommand('underline')}
        title="Underline (Alt+U)"
      >
        <Underline className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('insertorderedlist')}
        title="Numbered List"
        className="text-emphasis" // Add emphasis for better visibility
      >
        <ListOrdered className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('insertunorderedlist')}
        title="Bullet List"
      >
        <List className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => formatTableCells ? formatTableCells('left') : execCommand('justifyLeft')}
        title="Align Left (Alt+L)"
      >
        <AlignLeft className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => formatTableCells ? formatTableCells('center') : execCommand('justifyCenter')}
        title="Align Center (Alt+C)"
      >
        <AlignCenter className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => formatTableCells ? formatTableCells('right') : execCommand('justifyRight')}
        title="Align Right (Alt+R)"
      >
        <AlignRight className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => formatTableCells ? formatTableCells('justify') : execCommand('justifyFull')}
        title="Justify (Alt+J)"
      >
        <AlignJustify className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('formatBlock', '<h1>')}
        title="Heading 1 (Alt+1)"
      >
        <Heading1 className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('formatBlock', '<h2>')}
        title="Heading 2 (Alt+2)"
      >
        <Heading2 className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => execCommand('formatBlock', '<h3>')}
        title="Heading 3 (Alt+3)"
      >
        <Heading3 className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => highlightText ? highlightText() : execCommand('backColor', '#FEF7CD')}
        title="Highlight Text (Alt+H)"
      >
        <Highlighter className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => insertVerticalSeparator ? insertVerticalSeparator() : null}
        title="Insert Separator"
      >
        <Grip className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0.5"
        onClick={() => {
          const rows = prompt('Number of rows', '3');
          const cols = prompt('Number of columns', '3');
          
          if (rows && cols && !isNaN(Number(rows)) && !isNaN(Number(cols))) {
            execCommand('insertTable', `${rows},${cols}`);
          }
        }}
        title="Insert Table"
      >
        <Table className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditorToolbar;
