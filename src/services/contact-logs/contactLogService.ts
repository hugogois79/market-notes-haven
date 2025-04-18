
import { supabase } from "@/integrations/supabase/client";
import { TaoContactLog } from "./types";
import { toast } from "sonner";

export const fetchContactLogs = async (): Promise<TaoContactLog[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_contact_logs')
      .select('*')
      .order('contact_date', { ascending: false });

    if (error) {
      console.error('Error fetching contact logs:', error);
      return [];
    }

    // Cast the data to ensure it matches the TaoContactLog type
    return (data || []).map(log => ({
      ...log,
      method: log.method as TaoContactLog['method']
    }));
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    return [];
  }
};

export const createContactLog = async (contactLog: Omit<TaoContactLog, 'id' | 'created_at' | 'updated_at'>): Promise<TaoContactLog | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_contact_logs')
      .insert([contactLog])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact log:', error);
      return null;
    }

    // Cast the data to ensure it matches the TaoContactLog type
    return data ? {
      ...data,
      method: data.method as TaoContactLog['method']
    } : null;
  } catch (error) {
    console.error('Error creating contact log:', error);
    return null;
  }
};

export const fetchContactLogsByValidator = async (validatorId: string): Promise<TaoContactLog[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_contact_logs')
      .select('*')
      .eq('validator_id', validatorId)
      .order('contact_date', { ascending: false });

    if (error) {
      console.error('Error fetching contact logs:', error);
      return [];
    }

    // Cast the data to ensure it matches the TaoContactLog type
    return (data || []).map(log => ({
      ...log,
      method: log.method as TaoContactLog['method']
    }));
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    return [];
  }
};
