
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
  formatTableCells: (alignment: string) => void;
  insertVerticalSeparator: () => void;
  highlightText: () => void;
  underlineText: () => void;
  isFloating?: boolean;
  position?: 'top' | 'bottom';
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
  underlineText,
  isFloating = false,
  position = 'top'
}) => {
  const isBottom = position === 'bottom';
  
  return (
    <div className={`flex items-center flex-wrap gap-0 p-1 bg-background/95 backdrop-blur-md rounded-md ${
      isFloating 
        ? isBottom 
          ? 'w-full border-t shadow-md py-1' 
          : 'fixed bottom-3 left-1/2 transform -translate-x-1/2 max-w-[95%] w-fit border border-muted shadow-md' 
        : 'mx-0 mb-0 rounded-t-md border-b'
    }`}>
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
