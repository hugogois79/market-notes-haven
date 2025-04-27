
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
    console.log("Creating contact log with data:", contactLog);
    
    // Validate data before submitting
    if (!contactLog.validator_id) {
      console.error('Error creating contact log: Missing validator_id');
      return null;
    }
    
    if (!contactLog.method) {
      contactLog.method = "Email"; // Set default method if not provided
    }

    // Ensure null values are properly handled
    const cleanedContactLog = {
      validator_id: contactLog.validator_id,
      subnet_id: contactLog.subnet_id || null,
      contact_date: contactLog.contact_date,
      method: contactLog.method,
      summary: contactLog.summary,
      next_steps: contactLog.next_steps || null,
      linked_note_id: contactLog.linked_note_id || null
    };

    console.log("Submitting cleaned data:", cleanedContactLog);
    
    const { data, error } = await supabase
      .from('tao_contact_logs')
      .insert([cleanedContactLog])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact log:', error);
      toast.error(`Failed to create contact log: ${error.message}`);
      return null;
    }

    console.log("Contact log created successfully:", data);
    toast.success("Contact log created successfully");

    // Cast the data to ensure it matches the TaoContactLog type
    return data ? {
      ...data,
      method: data.method as TaoContactLog['method']
    } : null;
  } catch (error) {
    console.error('Error creating contact log:', error);
    toast.error('An unexpected error occurred while creating the contact log');
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
