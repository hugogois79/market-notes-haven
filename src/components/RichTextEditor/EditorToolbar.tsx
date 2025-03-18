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
  Grip,
} from "lucide-react";

interface EditorToolbarProps {
  editorRef: RefObject<HTMLDivElement>;
  execCommand: (command: string, value?: string) => void;
  formatTableCells?: (format: string) => void;
  insertVerticalSeparator?: () => void;
  highlightText?: () => void;
  boldText?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editorRef, 
  execCommand, 
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  boldText
}) => {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-muted border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => boldText ? boldText() : execCommand('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('underline')}
        title="Underline (Ctrl+U)"
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
        onClick={() => execCommand('justifyLeft')}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyCenter')}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyRight')}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyFull')}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('formatBlock', '<h1>')}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => execCommand('formatBlock', '<h2>')}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => highlightText?.()}
        title="Highlight Text"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertVerticalSeparator?.()}
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
    </div>
  );
};

export default EditorToolbar;
