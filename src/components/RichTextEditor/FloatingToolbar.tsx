
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
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = (props) => {
  return (
    <div className="floating-toolbar-container sticky bottom-4 left-0 right-0 z-50 flex justify-center">
      <FormattingToolbar {...props} isFloating={true} />
    </div>
  );
};

export default FloatingToolbar;
