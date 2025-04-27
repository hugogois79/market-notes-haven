
import React from "react";
import AttachmentSection from "../AttachmentSection";
import { AttachmentTabContentProps } from "./types";

const AttachmentTabContent: React.FC<AttachmentTabContentProps> = ({
  noteId,
  attachmentUrl,
  attachments,
  onAttachmentChange
}) => {
  // Ensure we're using proper attachments array
  const attachmentsList = attachments || (attachmentUrl ? [attachmentUrl] : []);
  
  return (
    <AttachmentSection 
      noteId={noteId}
      attachmentUrl={attachmentUrl}
      attachments={attachmentsList}
      onAttachmentChange={onAttachmentChange}
    />
  );
};

export default AttachmentTabContent;
