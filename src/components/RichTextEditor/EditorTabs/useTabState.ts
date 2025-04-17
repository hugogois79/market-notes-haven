
import { useState, useRef, useEffect, RefObject } from "react";
import { useEditor } from "../hooks/editor";

export const useTabState = (
  activeTab: string,
  hasConclusion: boolean = true
) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Initialize editor with necessary functions
  const {
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText,
    yellowUnderlineText,
    processCheckboxes
  } = useEditor(editorRef, hasConclusion);
  
  // Effect to ensure editor is editable when switching tabs
  useEffect(() => {
    if (activeTab === "editor" && editorRef.current) {
      // Force editability and focus when switching to editor tab
      editorRef.current.contentEditable = 'true';
      editorRef.current.setAttribute('contenteditable', 'true');
      
      // Remove any attributes that might interfere with editing
      editorRef.current.removeAttribute('readonly');
      editorRef.current.removeAttribute('disabled');
      
      // Short timeout to ensure DOM is ready before focusing
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [activeTab]);

  // Effect to continuously check and fix editability
  useEffect(() => {
    const editableCheckInterval = setInterval(() => {
      if (activeTab === "editor" && editorRef.current) {
        if (editorRef.current.contentEditable !== 'true') {
          editorRef.current.contentEditable = 'true';
          editorRef.current.setAttribute('contenteditable', 'true');
        }
      }
    }, 5);
    
    return () => {
      clearInterval(editableCheckInterval);
    };
  }, [activeTab]);

  return {
    editorRef,
    execCommand,
    formatTableCells,
    insertVerticalSeparator,
    highlightText,
    boldText,
    underlineText,
    yellowUnderlineText,
    processCheckboxes
  };
};

export const useCursorPlacement = (
  editorRef: RefObject<HTMLDivElement>,
  content: string,
  activeTab: string
) => {
  // Effect to position cursor at the beginning for empty content
  useEffect(() => {
    if (activeTab === "editor" && editorRef.current) {
      const selection = window.getSelection();
      if (selection && (!content || content.trim() === '')) {
        try {
          const range = document.createRange();
          
          // Create a text node if there isn't content
          if (!editorRef.current.firstChild) {
            const textNode = document.createTextNode('\u200B'); // Zero-width space
            editorRef.current.appendChild(textNode);
            range.setStart(textNode, 0);
          } else {
            range.setStart(editorRef.current.firstChild, 0);
          }
          
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          console.error("Error positioning cursor:", error);
        }
      }
    }
  }, [activeTab, content, editorRef]);
};

export const useHandleContainerClick = (
  editorRef: RefObject<HTMLDivElement>,
  activeTab: string
) => {
  // Force focus via direct DOM manipulation when container clicked
  const handleContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (activeTab === "editor") {
      if (editorRef.current) {
        // Force editability at the DOM level
        editorRef.current.contentEditable = 'true';
        editorRef.current.setAttribute('contenteditable', 'true');
        
        // Remove any attributes that might interfere with editing
        editorRef.current.removeAttribute('readonly');
        editorRef.current.removeAttribute('disabled');
        
        // Focus immediately
        editorRef.current.focus();
      }
    }
  };

  return { handleContainerClick };
};
