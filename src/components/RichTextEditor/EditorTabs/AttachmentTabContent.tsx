
import React from "react";
import AttachmentSection from "../AttachmentSection";
import { AttachmentTabContentProps } from "./types";

const AttachmentTabContent: React.FC<AttachmentTabContentProps> = ({
  noteId,
  attachmentUrl,
  attachments,
  onAttachmentChange
}) => {
  // Process attachments to ensure we have an array
  let attachmentsList: string[] = [];
  
  // First priority: use the attachments array if available
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    attachmentsList = attachments;
    console.log("Using attachments array:", attachmentsList);
  } 
  // Fallback: use attachmentUrl if no attachments array
  else if (attachmentUrl) {
    attachmentsList = [attachmentUrl];
    console.log("Using single attachment URL:", attachmentUrl);
  }
  
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
