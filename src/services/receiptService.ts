import { supabase } from "@/integrations/supabase/client";

export interface Receipt {
  id: string;
  user_id: string;
  raw_content: string;
  formatted_content: string;
  receipt_number: number;
  beneficiary_name: string | null;
  payment_amount: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all receipts for the current user
 */
export const fetchUserReceipts = async (): Promise<Receipt[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return [];
  }
};

/**
 * Fetch a single receipt by ID
 */
export const fetchReceiptById = async (id: string): Promise<Receipt | null> => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching receipt:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return null;
  }
};

/**
 * Delete a receipt by ID
 */
export const deleteReceipt = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting receipt:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
};

/**
 * Save a new receipt
 */
export const saveReceipt = async (receiptData: {
  raw_content: string;
  formatted_content: string;
  beneficiary_name?: string | null;
  payment_amount?: string | null;
  payment_date?: string | null;
  payment_reference?: string | null;
}): Promise<{ id: string; receipt_number: number } | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        raw_content: receiptData.raw_content,
        formatted_content: receiptData.formatted_content,
        beneficiary_name: receiptData.beneficiary_name || null,
        payment_amount: receiptData.payment_amount || null,
        payment_date: receiptData.payment_date || null,
        payment_reference: receiptData.payment_reference || null,
      } as any)
      .select('id, receipt_number')
      .single();

    if (error) {
      console.error('Error saving receipt:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving receipt:', error);
    return null;
  }
};

/**
 * Update an existing receipt
 */
export const updateReceipt = async (
  id: string,
  receiptData: {
    raw_content: string;
    formatted_content: string;
    beneficiary_name?: string | null;
    payment_amount?: string | null;
    payment_date?: string | null;
    payment_reference?: string | null;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('receipts')
      .update(receiptData)
      .eq('id', id);

    if (error) {
      console.error('Error updating receipt:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating receipt:', error);
    return false;
  }
};
