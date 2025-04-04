
import React from "react";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Type, List, ListOrdered, Heading1, Heading2, Heading3, 
  Table, SeparatorHorizontal, CheckSquare, Highlighter
} from "lucide-react";
import TextFormattingSection from "./toolbar/TextFormattingSection";
import AlignmentSection from "./toolbar/AlignmentSection";
import ListFormattingSection from "./toolbar/ListFormattingSection";
import InsertSection from "./toolbar/InsertSection";
import ToolbarDivider from "./toolbar/ToolbarDivider";
import ToolbarButton from "./toolbar/ToolbarButton";

interface EditorToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  execCommand: (command: string, value?: string) => void;
  formatTableCells?: (alignment: string) => void;
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
  hasConclusion = true,
  category = "General",
  className = ""
}) => {
  const handleTextAlign = (alignment: string) => {
    if (formatTableCells) {
      formatTableCells(alignment);
    } else {
      switch (alignment) {
        case 'left':
          execCommand('justifyLeft');
          break;
        case 'center':
          execCommand('justifyCenter');
          break;
        case 'right':
          execCommand('justifyRight');
          break;
      }
    }
  };

  const applyHeading = (level: string) => {
    execCommand('formatBlock', level);
  };

  return (
    <div className={`flex items-center flex-wrap p-1 gap-0.5 ${className}`}>
      {/* Text Formatting Section */}
      <TextFormattingSection 
        boldText={boldText}
        italicText={() => execCommand('italic')}
        underlineText={underlineText}
        highlightText={highlightText}
      />
      
      <ToolbarDivider />
      
      {/* Heading Section */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton 
          icon={Heading1} 
          onClick={() => applyHeading('<h1>')} 
          tooltip="Heading 1"
        />
        <ToolbarButton 
          icon={Heading2} 
          onClick={() => applyHeading('<h2>')} 
          tooltip="Heading 2"
        />
        <ToolbarButton 
          icon={Heading3} 
          onClick={() => applyHeading('<h3>')} 
          tooltip="Heading 3"
        />
        <ToolbarButton 
          icon={Type} 
          onClick={() => applyHeading('<p>')} 
          tooltip="Normal text"
        />
      </div>
      
      <ToolbarDivider />
      
      {/* List Formatting Section */}
      <ListFormattingSection 
        execCommand={execCommand}
        editorRef={editorRef}
      />
      
      <ToolbarDivider />
      
      {/* Alignment Section */}
      <AlignmentSection 
        onAlignLeft={() => handleTextAlign('left')}
        onAlignCenter={() => handleTextAlign('center')}
        onAlignRight={() => handleTextAlign('right')}
      />
      
      <ToolbarDivider />
      
      {/* Insert Section */}
      <InsertSection 
        onInsertTable={() => {
          document.execCommand('insertHTML', false, 
            '<table style="width:100%; border-collapse:collapse; margin:1rem 0;">' +
            '<tr><th style="border:1px solid #ccc; padding:8px; text-align:left;">Header 1</th>' +
            '<th style="border:1px solid #ccc; padding:8px; text-align:left;">Header 2</th></tr>' +
            '<tr><td style="border:1px solid #ccc; padding:8px;">Cell 1</td>' +
            '<td style="border:1px solid #ccc; padding:8px;">Cell 2</td></tr>' +
            '</table>');
        }}
        onInsertCheckbox={() => {
          document.execCommand('insertHTML', false, 
            '<p><input type="checkbox" class="editor-checkbox" contenteditable="false"> <span>Checkbox item</span></p>');
        }}
        onInsertSeparator={insertVerticalSeparator || (() => {
          document.execCommand('insertHTML', false, '<hr style="border:none; border-top:1px solid #ccc; margin:1rem 0;" />');
        })}
      />
    </div>
  );
};

export default EditorToolbar;
