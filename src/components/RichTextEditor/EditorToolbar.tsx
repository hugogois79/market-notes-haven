
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
  onPrint?: () => void;
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
  className,
  onPrint
}) => {
  return (
    <div className={`flex flex-wrap gap-1 p-2 bg-muted border-b ${className || ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => boldText ? boldText() : execCommand('bold')}
        title="Bold (Alt+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('italic')}
        title="Italic (Alt+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => underlineText ? underlineText() : execCommand('underline')}
        title="Underline (Alt+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('insertorderedlist')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('insertunorderedlist')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatTableCells ? formatTableCells('left') : execCommand('justifyLeft')}
        title="Align Left (Alt+L)"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatTableCells ? formatTableCells('center') : execCommand('justifyCenter')}
        title="Align Center (Alt+C)"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatTableCells ? formatTableCells('right') : execCommand('justifyRight')}
        title="Align Right (Alt+R)"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatTableCells ? formatTableCells('justify') : execCommand('justifyFull')}
        title="Justify (Alt+J)"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('formatBlock', '<h1>')}
        title="Heading 1 (Alt+1)"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('formatBlock', '<h2>')}
        title="Heading 2 (Alt+2)"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => highlightText ? highlightText() : execCommand('backColor', '#FEF7CD')}
        title="Highlight Text (Alt+H)"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertVerticalSeparator ? insertVerticalSeparator() : null}
        title="Insert Separator"
      >
        <Grip className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const rows = prompt('Number of rows', '3');
          const cols = prompt('Number of columns', '3');
          
          if (rows && cols && !isNaN(Number(rows)) && !isNaN(Number(cols))) {
            execCommand('insertTable', `${rows},${cols}`);
          }
        }}
        title="Insert Table"
      >
        <Table className="h-4 w-4" />
      </Button>
      {onPrint && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrint}
          title="Print"
        >
          <span className="text-xs">Print</span>
        </Button>
      )}
    </div>
  );
};

export default EditorToolbar;
