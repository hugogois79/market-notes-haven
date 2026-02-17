import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorEmailResult {
  email: string;
  source: string;
  name: string;
}

export interface SearchVendorEmailResponse {
  vendor_name: string;
  emails: VendorEmailResult[];
  count: number;
}

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
  gmail_message_id?: string;
  error?: string;
}

export const useSendPaymentConfirmation = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundEmails, setFoundEmails] = useState<VendorEmailResult[]>([]);
  const [result, setResult] = useState<SendPaymentConfirmationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchVendorEmail = async (vendorName: string): Promise<VendorEmailResult[]> => {
    setIsSearching(true);
    setError(null);
    setFoundEmails([]);

    try {
      const response = await fetch('https://n8n.gvvcapital.com/webhook/search-vendor-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_name: vendorName })
      });

      if (!response.ok) {
        throw new Error(`Erro na pesquisa: ${response.status}`);
      }

      const data: SearchVendorEmailResponse = await response.json();
      setFoundEmails(data.emails || []);
      return data.emails || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const sendConfirmation = async (data: SendPaymentConfirmationRequest): Promise<SendPaymentConfirmationResponse> => {
    setIsSending(true);
    setError(null);

    try {
      if (!data.vendor_email) {
        throw new Error('Email do fornecedor é obrigatório');
      }

      const response = await fetch('https://n8n.gvvcapital.com/webhook/send-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: data.vendor_email,
          vendor_name: data.vendor_name,
          invoice_number: data.invoice_number,
          total_amount: data.total_amount,
          file_url: data.file_url,
          file_name: data.file_name
        })
      });

      if (!response.ok) {
        throw new Error(`Erro no envio: ${response.status}`);
      }

      const result: SendPaymentConfirmationResponse = await response.json();

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
    setFoundEmails([]);
  };

  return { 
    searchVendorEmail,
    sendConfirmation, 
    isSending, 
    isSearching,
    foundEmails,
    result, 
    error, 
    reset 
  };
};
