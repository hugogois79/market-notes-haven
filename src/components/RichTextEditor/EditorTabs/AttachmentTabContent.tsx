
import React from "react";
import AttachmentSection from "../AttachmentSection";
import { AttachmentTabContentProps } from "./types";

const AttachmentTabContent: React.FC<AttachmentTabContentProps> = ({
  noteId,
  attachmentUrl,
  attachments,
  onAttachmentChange
}) => {
  return (
    <AttachmentSection 
      noteId={noteId}
      attachmentUrl={attachmentUrl}
      attachments={attachments}
      onAttachmentChange={onAttachmentChange}
    />
  );
};

export default AttachmentTabContent;
