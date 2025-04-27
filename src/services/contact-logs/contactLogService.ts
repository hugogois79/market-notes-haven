
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
      toast.error("Validator ID is required");
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
      linked_note_id: contactLog.linked_note_id || null,
      attachment_url: contactLog.attachment_url || null // Add support for attachments
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

// New function to handle file uploads for contact logs
export const uploadContactLogAttachment = async (
  validatorId: string, 
  file: File
): Promise<string | null> => {
  try {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File is too large. Maximum size is 10MB.");
      return null;
    }
    
    // Get user auth status
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("You must be logged in to upload files");
      return null;
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `contact_log_${validatorId}_${Date.now()}.${fileExt}`;
    const filePath = `public/${userData.user.id}/${fileName}`;
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('note_attachments') // Using the same bucket for simplicity
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error("Failed to upload file");
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('note_attachments')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    toast.error("Failed to upload attachment");
    return null;
  }
};
