
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import TextFormattingSection from "./toolbar/TextFormattingSection";
import ListFormattingSection from "./toolbar/ListFormattingSection";
import AlignmentSection from "./toolbar/AlignmentSection";
import InsertSection from "./toolbar/InsertSection";

interface FormattingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  formatBold: () => void;
  formatItalic: () => void;
  formatUnorderedList: () => void;
  formatOrderedList: () => void;
  formatAlignLeft: () => void;
  formatAlignCenter: () => void;
  formatAlignRight: () => void;
  formatLink: () => void;
  formatImage: () => void;
  formatStrikethrough: () => void;
  insertCheckbox: () => void;
  insertTable: () => void;
  formatTableCells: () => void;
  insertVerticalSeparator: () => void;
  highlightText: () => void;
  underlineText: () => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  formatBold,
  formatItalic,
  formatUnorderedList,
  formatOrderedList,
  formatAlignLeft,
  formatAlignCenter,
  formatAlignRight,
  formatLink,
  formatImage,
  formatStrikethrough,
  insertCheckbox,
  insertTable,
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  underlineText
}) => {
  return (
    <div className="flex items-center flex-wrap gap-1 p-2 bg-muted/95 rounded-t-md mx-2 mb-0 sticky top-0 z-50 backdrop-blur-sm shadow-md border-b">
      <TooltipProvider delayDuration={300}>
        <TextFormattingSection 
          formatBold={formatBold}
          formatItalic={formatItalic}
          underlineText={underlineText}
          formatStrikethrough={formatStrikethrough}
          highlightText={highlightText}
        />
        
        <ListFormattingSection 
          formatUnorderedList={formatUnorderedList}
          formatOrderedList={formatOrderedList}
          insertCheckbox={insertCheckbox}
        />
        
        <AlignmentSection 
          formatAlignLeft={formatAlignLeft}
          formatAlignCenter={formatAlignCenter}
          formatAlignRight={formatAlignRight}
        />
        
        <InsertSection 
          formatLink={formatLink}
          formatImage={formatImage}
          insertTable={insertTable}
          formatTableCells={formatTableCells}
          insertVerticalSeparator={insertVerticalSeparator}
        />
      </TooltipProvider>
    </div>
  );
};

export default FormattingToolbar;
