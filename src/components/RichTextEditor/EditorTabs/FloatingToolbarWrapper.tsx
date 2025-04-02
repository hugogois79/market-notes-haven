
import React, { RefObject } from "react";
import FloatingToolbar from "../FloatingToolbar";

interface FloatingToolbarWrapperProps {
  editorRef: RefObject<HTMLDivElement>;
  boldText: (() => void) | null;
  underlineText: (() => void) | null;
  highlightText: (() => void) | null;
  execCommand: (command: string, value?: string) => void;
  formatTableCells: (alignment: string) => void;
  insertVerticalSeparator: () => void;
  isVisible: boolean;
}

const FloatingToolbarWrapper: React.FC<FloatingToolbarWrapperProps> = ({
  editorRef,
  boldText,
  underlineText,
  highlightText,
  execCommand,
  formatTableCells,
  insertVerticalSeparator,
  isVisible
}) => {
  if (!isVisible) return null;

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

  return (
    <FloatingToolbar
      editorRef={editorRef}
      formatBold={boldText || (() => execCommand('bold'))}
      formatItalic={() => execCommand('italic')}
      formatUnorderedList={() => execCommand('insertunorderedlist')}
      formatOrderedList={() => execCommand('insertorderedlist')}
      formatAlignLeft={handleAlignLeft}
      formatAlignCenter={handleAlignCenter}
      formatAlignRight={handleAlignRight}
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
    />
  );
};

export default FloatingToolbarWrapper;
