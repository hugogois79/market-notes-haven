
import React, { useState, useEffect } from "react";
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
  formatTableCells: (alignment: string) => void; // Updated to accept string parameter
  insertVerticalSeparator: () => void;
  highlightText: () => void;
  underlineText: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      
      // Show the floating toolbar when scrolled down more than 300px
      if (position > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Get the scroll position of the editor content area
    const editorContent = document.querySelector('.editor-content-scroll-area');
    if (editorContent) {
      editorContent.addEventListener('scroll', (e) => {
        const target = e.target as HTMLElement;
        if (target.scrollTop > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (editorContent) {
        editorContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="floating-toolbar-container">
      <FormattingToolbar {...props} isFloating={true} />
    </div>
  );
};

export default FloatingToolbar;
