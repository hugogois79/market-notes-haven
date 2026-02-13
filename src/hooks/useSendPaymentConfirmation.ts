import { useState } from 'react';

export interface SendPaymentConfirmationRequest {
  vendor_email: string;
  file_url: string;
  file_name: string;
  vendor_name?: string;
  invoice_number?: string;
  total_amount?: number;
  file_id: string;
}

export interface SendPaymentConfirmationResponse {
  success: boolean;
  message?: string;
  vendor_email?: string;
  error?: string;
}

export const useSendPaymentConfirmation = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendPaymentConfirmationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendConfirmation = async (data: SendPaymentConfirmationRequest): Promise<SendPaymentConfirmationResponse> => {
    setIsSending(true);
    setError(null);
    
    try {
      const response = await fetch('https://n8n.gvvcapital.com/webhook/send-payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erro na comunicação: ${response.status}`);
      }
      
      const result: SendPaymentConfirmationResponse = await response.json();
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const errorResult: SendPaymentConfirmationResponse = { 
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

  return { sendConfirmation, isSending, result, error, reset };
};
