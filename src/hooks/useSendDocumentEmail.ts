import { useState } from 'react';

export interface SendEmailRequest {
  entityName: string;
  fileUrl: string;
  fileName: string;
  subject: string;
  message: string;
  metadata: {
    documentId: string;
    invoiceNumber?: string;
    date?: string;
    amount?: number;
  };
}

export interface SendEmailResponse {
  success: boolean;
  emailSent?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  source?: 'google_contacts' | 'document_ocr' | 'manual';
  error?: string;
  message?: string;
}

export const useSendDocumentEmail = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendEmailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (data: SendEmailRequest): Promise<SendEmailResponse> => {
    setIsSending(true);
    setError(null);
    
    try {
      const response = await fetch('https://n8n.gvvcapital.com/webhook/send-document-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erro na comunicação: ${response.status}`);
      }
      
      const result: SendEmailResponse = await response.json();
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const errorResult: SendEmailResponse = { 
        success: false, 
        error: errorMessage 
      };
      setError(errorMessage);
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { sendEmail, isSending, result, error, reset };
};
