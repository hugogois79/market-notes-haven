import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BankPaymentRequest {
  beneficiaryName: string;
  beneficiaryIban: string;
  amount: number;
  currency: string;
  sourceAccountId: string;
  reference: string;
  executionDate: string;
  documentId: string;
  documentUrl: string;
}

export interface BankPaymentResponse {
  success: boolean;
  transferId?: string;
  status?: string;
  error?: string;
  message?: string;
}

export const useBankPayment = () => {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<BankPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendPayment = async (data: BankPaymentRequest): Promise<BankPaymentResponse> => {
    setIsSending(true);
    setError(null);
    
    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('bank-payment-webhook', {
        body: data
      });
      
      if (fnError) {
        throw new Error(fnError.message || 'Erro na comunicação com o servidor');
      }
      
      const result = response as BankPaymentResponse;
      setResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      const errorResult: BankPaymentResponse = { 
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

  return { sendPayment, isSending, result, error, reset };
};
