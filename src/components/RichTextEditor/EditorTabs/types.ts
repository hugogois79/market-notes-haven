
import { RefObject } from "react";

export interface EditorTabsProps {
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate?: (content: string) => void;
  onAutoSave?: () => void;
  noteId?: string;
  attachment_url?: string;
  onAttachmentChange?: (url: string | null) => void;
  hasConclusion?: boolean;
  category?: string;
  onPrint?: () => void;
}

export interface TabContentProps {
  editorRef: RefObject<HTMLDivElement>;
  content: string;
  onContentChange: (content: string) => void;
  onContentUpdate: (content: string) => void;
  onAutoSave: () => void;
  hasConclusion: boolean;
  category: string;
  handleContainerClick: (e: React.MouseEvent) => void;
  execCommand: (command: string, value?: string) => void;
  formatTableCells: (alignment: string) => void;
  insertVerticalSeparator: () => void;
  highlightText: () => void;
  boldText: () => void;
  underlineText: () => void;
}

export interface AttachmentTabContentProps {
  noteId: string;
  attachmentUrl?: string;
  onAttachmentChange: (url: string | null) => void;
}
