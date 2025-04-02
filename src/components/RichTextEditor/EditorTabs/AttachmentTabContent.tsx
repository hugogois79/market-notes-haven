
import React from "react";
import AttachmentSection from "../AttachmentSection";
import { AttachmentTabContentProps } from "./types";

const AttachmentTabContent: React.FC<AttachmentTabContentProps> = ({
  noteId,
  attachmentUrl,
  onAttachmentChange
}) => {
  return (
    <AttachmentSection 
      noteId={noteId}
      attachmentUrl={attachmentUrl}
      onAttachmentChange={onAttachmentChange}
    />
  );
};

export default AttachmentTabContent;
