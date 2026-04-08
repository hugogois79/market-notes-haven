
import React from "react";
import FormattingToolbar from "./FormattingToolbar";

interface FloatingToolbarProps {
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
  position?: 'top' | 'bottom';
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = (props) => {
  const { position = 'top' } = props;

  const positionClasses = position === 'bottom' 
    ? "fixed bottom-0 left-0 right-0 z-[9999] flex justify-center border-t bg-background shadow-md" 
    : "floating-toolbar-container fixed bottom-4 left-0 right-0 z-[9999] flex justify-center";

  return (
    <div className={positionClasses}>
      <FormattingToolbar {...props} isFloating={true} />
    </div>
  );
};

export default FloatingToolbar;
