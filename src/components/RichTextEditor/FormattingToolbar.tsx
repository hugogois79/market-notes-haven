
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
  Table,
  Heading1,
  Heading2,
  Heading3,
  Text,
  SeparatorVertical,
  Highlighter,
  Underline,
  Printer
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FormattingToolbarProps {
  execCommand: (command: string, value?: string) => void;
  setIsTableDialogOpen: (isOpen: boolean) => void;
  formatTableCells: (alignment: string) => void;
  insertVerticalSeparator: () => void;
  highlightText: () => void;
  underlineText?: () => void;
  onPrint?: () => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ 
  execCommand, 
  setIsTableDialogOpen,
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  underlineText,
  onPrint
}) => {
  return (
    <div className="flex items-center flex-wrap gap-1 p-2 bg-muted/60 rounded-t-md mx-2 mb-0 sticky top-0 z-10 backdrop-blur-sm shadow-sm border-b">
      {/* Heading format options */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => execCommand("formatBlock", "<h1>")}
              title="Title"
              className="h-8 w-8"
            >
              <Heading1 size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Heading 1 (Alt+1)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => execCommand("formatBlock", "<h2>")}
              title="Subtitle"
              className="h-8 w-8"
            >
              <Heading2 size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Heading 2 (Alt+2)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => execCommand("formatBlock", "<h3>")}
              title="Heading 3"
              className="h-8 w-8"
            >
              <Heading3 size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Heading 3 (Alt+3)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => execCommand("formatBlock", "<p>")}
              title="Normal Text"
              className="h-8 w-8"
            >
              <Text size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Normal Text (Alt+0)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="border-l border-muted-foreground/20 mx-1 h-6"></div>
      
      {/* Bold, Italic, Lists, etc. */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Bold (Alt+B)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Italic (Alt+I)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => underlineText ? underlineText() : execCommand("underline")}
              title="Underline"
              className="h-8 w-8"
            >
              <Underline size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Underline (Alt+U)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Highlight button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={highlightText}
              title="Highlight Text"
              className="h-8 w-8"
            >
              <Highlighter size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Highlight Text (Alt+H)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Bullet List</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Numbered List</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={insertVerticalSeparator}
        title="Chapter Separator"
        className="h-8 w-8"
      >
        <SeparatorVertical size={16} />
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
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Align Left (Alt+L)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Align Center (Alt+C)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Align Right (Alt+R)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Justify (Alt+J)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Print button */}
      {onPrint && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onPrint}
                title="Print Note"
                className="h-8 w-8"
              >
                <Printer size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Print Note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default FormattingToolbar;
