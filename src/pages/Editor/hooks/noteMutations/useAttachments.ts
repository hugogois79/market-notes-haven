
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useAttachments = (currentNote: { attachments?: string[], attachment_url?: string }) => {
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    // First try to use the attachments array if it exists
    if (currentNote.attachments && Array.isArray(currentNote.attachments)) {
      setAttachments(currentNote.attachments);
    } 
    // Fall back to using attachment_url if no attachments array
    else if (currentNote.attachment_url) {
      setAttachments([currentNote.attachment_url]);
    } else {
      setAttachments([]);
    }
  }, [currentNote]);

  const handleAttachmentChange = (attachmentData: string | null) => {
    try {
      if (attachmentData) {
        try {
          const parsedAttachments = JSON.parse(attachmentData);
          if (Array.isArray(parsedAttachments)) {
            // Check if we're exceeding the 20 file limit
            if (parsedAttachments.length > 20) {
              toast.error('Maximum of 20 files allowed per note');
              const truncatedAttachments = parsedAttachments.slice(0, 20);
              setAttachments(truncatedAttachments);
              return {
                attachment_url: truncatedAttachments[0] || null,
                attachments: truncatedAttachments
              };
            }
            
            setAttachments(parsedAttachments);
            return {
              attachment_url: parsedAttachments[0] || null,
              attachments: parsedAttachments
            };
          } else {
            // Single attachment URL
            setAttachments([attachmentData]);
            return {
              attachment_url: attachmentData,
              attachments: [attachmentData]
            };
          }
        } catch (e) {
          // Handle case where attachmentData is a raw URL string
          setAttachments([attachmentData]);
          return {
            attachment_url: attachmentData,
            attachments: [attachmentData]
          };
        }
      } else {
        // No attachments
        setAttachments([]);
        return {
          attachment_url: null,
          attachments: []
        };
      }
    } catch (error) {
      console.error("Error handling attachment change:", error);
      return null;
    }
  };

  return { attachments, handleAttachmentChange };
};
