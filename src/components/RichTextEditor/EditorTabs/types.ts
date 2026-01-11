
import { ReactNode } from "react";

export interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void;
  noteId?: string;
  attachment_url?: string;
  attachments?: string[];
  onAttachmentChange?: (url: string | null) => void;
  hasConclusion?: boolean;
  category?: string;
  onPrint?: () => void;
  // Formatting functions passed from parent
  editorRef?: React.RefObject<HTMLDivElement>;
  execCommand?: (command: string, value?: string) => void;
  formatTableCells?: (alignment: string) => void;
  insertVerticalSeparator?: () => void;
  highlightText?: () => void;
  boldText?: () => void;
  underlineText?: () => void;
  yellowUnderlineText?: () => void;
}

export interface TabContentProps {
  editorRef: React.RefObject<HTMLDivElement>;
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void;
  hasConclusion?: boolean;
  category?: string;
  handleContainerClick?: (e: React.MouseEvent) => void;
  execCommand?: (command: string, value?: string) => void;
  formatTableCells?: (alignment: 'left' | 'center' | 'right') => void;
  insertVerticalSeparator?: () => void;
  highlightText?: () => void;
  boldText?: () => void;
  underlineText?: () => void;
  yellowUnderlineText?: () => void;
}

export interface AttachmentTabContentProps {
  noteId: string;
  attachmentUrl?: string;
  attachments?: string[];
  onAttachmentChange?: (url: string | null) => void;
}

export interface RelationsTabContentProps {
  noteId: string;
}
