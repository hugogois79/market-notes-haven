
import React, { RefObject } from "react";
import PortableToolbar from "./PortableToolbar";

export interface ToolbarPlacementProps {
  editorRef: RefObject<HTMLDivElement>;
  boldText?: () => void;
  underlineText?: () => void;
  highlightText?: () => void;
  execCommand: (command: string, value?: string) => void;
  formatTableCells: (alignment: string) => void;
  insertVerticalSeparator: () => void;
  position?: 'top' | 'bottom' | 'inline';
  variant?: 'default' | 'floating' | 'inline' | 'fixed';
  className?: string;
}

const ToolbarPlacement: React.FC<ToolbarPlacementProps> = ({
  editorRef,
  boldText,
  underlineText,
  highlightText,
  execCommand,
  formatTableCells,
  insertVerticalSeparator,
  position = 'inline',
  variant = 'default',
  className = "",
}) => {
  // Create wrapper functions for alignment actions
  const handleAlignLeft = () => {
    if (formatTableCells) formatTableCells('left');
    else execCommand('justifyLeft');
  };
  
  const handleAlignCenter = () => {
    if (formatTableCells) formatTableCells('center');
    else execCommand('justifyCenter');
  };
  
  const handleAlignRight = () => {
    if (formatTableCells) formatTableCells('right');
    else execCommand('justifyRight');
  };
  
  const handleAlignJustify = () => {
    if (formatTableCells) formatTableCells('justify');
    else execCommand('justifyFull');
  };

  return (
    <PortableToolbar
      editorRef={editorRef}
      formatBold={boldText || (() => execCommand('bold'))}
      formatItalic={() => execCommand('italic')}
      formatUnorderedList={() => execCommand('insertunorderedlist')}
      formatOrderedList={() => execCommand('insertorderedlist')}
      formatAlignLeft={handleAlignLeft}
      formatAlignCenter={handleAlignCenter}
      formatAlignRight={handleAlignRight}
      formatAlignJustify={handleAlignJustify}
      formatLink={() => execCommand('createlink', prompt('Enter link URL:', 'http://') || '')}
      formatImage={() => execCommand('insertImage', prompt('Enter image URL:', 'http://') || '')}
      formatStrikethrough={() => execCommand('strikeThrough')}
      insertCheckbox={() => execCommand('insertHTML', '<input type="checkbox" style="margin-right: 5px;">')}
      insertTable={() => {
        const rows = prompt('Number of rows', '3');
        const cols = prompt('Number of columns', '3');
        
        if (rows && cols && !isNaN(Number(rows)) && !isNaN(Number(cols))) {
          execCommand('insertTable', `${rows},${cols}`);
        }
      }}
      formatTableCells={formatTableCells}
      insertVerticalSeparator={insertVerticalSeparator}
      highlightText={highlightText || (() => execCommand('backColor', '#FEF7CD'))}
      underlineText={underlineText || (() => execCommand('underline'))}
      position={position}
      variant={variant}
      className={className}
      execCommand={execCommand}
    />
  );
};

export default ToolbarPlacement;
