import React, { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import TextFormattingSection from "./TextFormattingSection";
import ListFormattingSection from "./ListFormattingSection";
import AlignmentSection from "./AlignmentSection";
import InsertSection from "./InsertSection";
import ToolbarDivider from "./ToolbarDivider";
import ImageUploader from "../components/ImageUploader";

interface PortableToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  formatBold?: () => void;
  formatItalic?: () => void;
  formatUnorderedList?: () => void;
  formatOrderedList?: () => void;
  formatAlignLeft?: () => void;
  formatAlignCenter?: () => void;
  formatAlignRight?: () => void;
  formatAlignJustify?: () => void;
  formatLink?: () => void;
  formatImage?: () => void;
  formatStrikethrough?: () => void;
  insertCheckbox?: () => void;
  insertTable?: () => void;
  formatTableCells?: (alignment: string) => void;
  insertVerticalSeparator?: () => void;
  highlightText?: () => void;
  underlineText?: () => void;
  className?: string;
  variant?: 'default' | 'floating' | 'inline' | 'fixed';
  position?: 'top' | 'bottom' | 'inline';
  execCommand?: (command: string, value?: string) => void;
}

const PortableToolbar: React.FC<PortableToolbarProps> = ({
  editorRef,
  formatBold,
  formatItalic,
  formatUnorderedList,
  formatOrderedList,
  formatAlignLeft,
  formatAlignCenter,
  formatAlignRight,
  formatAlignJustify,
  formatLink,
  formatImage,
  formatStrikethrough,
  insertCheckbox,
  insertTable,
  formatTableCells,
  insertVerticalSeparator,
  highlightText,
  underlineText,
  className = "",
  variant = 'default',
  position = 'inline',
  execCommand,
}) => {
  const [imageUploaderOpen, setImageUploaderOpen] = useState(false);
  
  const getContainerClasses = () => {
    let baseClasses = "flex items-center flex-wrap gap-0 p-1 bg-background/95 backdrop-blur-md rounded-md ";
    
    switch (variant) {
      case 'floating':
        baseClasses += "border border-muted shadow-md ";
        break;
      case 'fixed':
        baseClasses += position === 'top' 
          ? "border-b shadow-sm " 
          : "border-t shadow-sm ";
        break;
      case 'inline':
        baseClasses += "border mb-2 ";
        break;
      default:
        baseClasses += "border ";
    }
    
    if (variant === 'fixed') {
      switch (position) {
        case 'top':
          baseClasses += "fixed top-0 left-0 right-0 z-50 ";
          break;
        case 'bottom':
          baseClasses += "fixed bottom-0 left-0 right-0 z-50 ";
          break;
        default:
          break;
      }
    } else if (variant === 'floating') {
      baseClasses += position === 'top' 
        ? "absolute top-2 left-1/2 transform -translate-x-1/2 z-40 " 
        : position === 'bottom' 
          ? "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 " 
          : "";
    }
    
    return baseClasses + className;
  };

  const handleExecCommand = (cmd: string, val?: string) => {
    if (execCommand) {
      execCommand(cmd, val);
    } else {
      document.execCommand(cmd, false, val);
    }
  };
  
  const handleImageClick = () => {
    if (formatImage) {
      formatImage();
    } else {
      setImageUploaderOpen(true);
    }
  };
  
  const handleImageInsert = (url: string) => {
    if (url) {
      handleExecCommand('insertImage', url);
    }
  };

  return (
    <>
      <div className={getContainerClasses()}>
        <TooltipProvider delayDuration={300}>
          <TextFormattingSection 
            boldText={formatBold}
            italicText={formatItalic}
            underlineText={underlineText}
            formatStrikethrough={formatStrikethrough}
            highlightText={highlightText}
          />
          
          <ToolbarDivider />
          
          <ListFormattingSection 
            formatUnorderedList={formatUnorderedList}
            formatOrderedList={formatOrderedList}
            insertCheckbox={insertCheckbox}
            execCommand={execCommand}
          />
          
          <ToolbarDivider />
          
          <AlignmentSection 
            formatAlignLeft={formatAlignLeft}
            formatAlignCenter={formatAlignCenter}
            formatAlignRight={formatAlignRight}
            formatAlignJustify={formatAlignJustify}
          />
          
          <ToolbarDivider />
          
          <InsertSection 
            formatLink={formatLink}
            formatImage={handleImageClick}
            insertTable={insertTable}
            formatTableCells={formatTableCells}
            insertVerticalSeparator={insertVerticalSeparator}
          />
        </TooltipProvider>
      </div>
      
      <ImageUploader 
        open={imageUploaderOpen}
        onOpenChange={setImageUploaderOpen}
        onImageInsert={handleImageInsert}
      />
    </>
  );
};

export default PortableToolbar;
