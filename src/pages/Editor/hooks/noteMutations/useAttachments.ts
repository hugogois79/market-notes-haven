
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useAttachments = (currentNote: { attachments?: string[], attachment_url?: string }) => {
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    const newAttachments = currentNote.attachments || 
      (currentNote.attachment_url ? [currentNote.attachment_url] : []);
    
    setAttachments(newAttachments);
  }, [currentNote]);

  const handleAttachmentChange = (attachmentData: string | null) => {
    try {
      if (attachmentData) {
        try {
          const parsedAttachments = JSON.parse(attachmentData);
          if (Array.isArray(parsedAttachments)) {
            setAttachments(parsedAttachments);
            return {
              attachment_url: parsedAttachments[0] || null,
              attachments: parsedAttachments
            };
          } else {
            setAttachments([attachmentData]);
            return {
              attachment_url: attachmentData,
              attachments: [attachmentData]
            };
          }
        } catch (e) {
          setAttachments([attachmentData]);
          return {
            attachment_url: attachmentData,
            attachments: [attachmentData]
          };
        }
      } else {
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
