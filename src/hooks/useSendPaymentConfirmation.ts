import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SendPaymentConfirmationRequest {
  file_url: string;
  file_name: string;
  file_id: string;
  vendor_name?: string;
  vendor_email?: string;
  invoice_number?: string;
  total_amount?: number;
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

      // Update confirmation_sent_at in Supabase directly from frontend
      if (result.success && data.file_id) {
        await supabase
          .from('workflow_files')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', data.file_id);
      }

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
