
import { supabase } from "@/integrations/supabase/client";
import { toast as uiToast } from "@/components/ui/use-toast";
// Import the correct toast from sonner which has the error method
import { toast } from "sonner";

export interface TaoValidator {
  id: string;
  name: string;
  wallet_address: string | null;
  email: string | null;
  telegram: string | null;
  linkedin: string | null;
  crm_stage: 'Prospect' | 'Contacted' | 'Follow-up' | 'Negotiation' | 'Active' | 'Inactive';
  priority: 'High' | 'Medium' | 'Low';
  created_at: string;
  updated_at: string;
}

export interface TaoSubnet {
  id: number;
  name: string;
  description: string | null;
  tier: number;
  neurons: number;
  emission: string;
  incentive: string;
  created_at: string;
  updated_at: string;
}

export interface TaoValidatorSubnet {
  id: string;
  validator_id: string;
  subnet_id: number;
  created_at: string;
}

export interface TaoContactLog {
  id: string;
  validator_id: string;
  subnet_id: number | null;
  contact_date: string;
  method: 'Email' | 'Telegram' | 'Call' | 'DM' | 'Zoom' | 'In Person' | 'Meeting' | 'Discord' | 'Other';
  summary: string | null;
  next_steps: string | null;
  linked_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaoNote {
  id: string;
  title: string;
  content: string | null;
  validator_id: string | null;
  subnet_id: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch all validators
export const fetchValidators = async (): Promise<TaoValidator[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_validators')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching validators:', error);
      toast.error('Failed to load validators');
      return [];
    }

    return (data || []) as TaoValidator[];
  } catch (error) {
    console.error('Error fetching validators:', error);
    toast.error('An unexpected error occurred');
    return [];
  }
};

// Fetch a validator by ID
export const fetchValidatorById = async (id: string): Promise<TaoValidator | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_validators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching validator:', error);
      return null;
    }

    return data as TaoValidator;
  } catch (error) {
    console.error('Error fetching validator:', error);
    return null;
  }
};

// Create a new validator
export const createValidator = async (validator: Omit<TaoValidator, 'id' | 'created_at' | 'updated_at'>): Promise<TaoValidator | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_validators')
      .insert([validator])
      .select()
      .single();

    if (error) {
      console.error('Error creating validator:', error);
      return null;
    }

    return data as TaoValidator;
  } catch (error) {
    console.error('Error creating validator:', error);
    return null;
  }
};

// Update a validator
export const updateValidator = async (id: string, updates: Partial<TaoValidator>): Promise<TaoValidator | null> => {
  try {
    // First, update the validator
    const { error: updateError } = await supabase
      .from('tao_validators')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating validator:', updateError);
      toast.error(`Failed to update validator: ${updateError.message}`);
      return null;
    }

    // Then fetch the updated validator to return
    const { data: updatedData, error: fetchError } = await supabase
      .from('tao_validators')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated validator:', fetchError);
      toast.error('Validator was updated but could not retrieve the updated data');
      return null;
    }

    return updatedData as TaoValidator;
  } catch (error) {
    console.error('Error updating validator:', error);
    toast.error('An unexpected error occurred while updating the validator');
    return null;
  }
};

// Move a validator to a different CRM stage - This is a dedicated function for stage updates
export const updateValidatorStage = async (id: string, newStage: TaoValidator["crm_stage"]): Promise<TaoValidator | null> => {
  try {
    console.log(`updateValidatorStage called for ID ${id} with new stage ${newStage}`);
    
    // Perform the update operation
    const { error: updateError } = await supabase
      .from('tao_validators')
      .update({ crm_stage: newStage })
      .eq('id', id);

    if (updateError) {
      console.error(`Error moving validator to ${newStage} stage:`, updateError);
      toast.error(`Failed to update stage: ${updateError.message}`);
      return null;
    }

    // Fetch the updated validator to return
    const { data, error: fetchError } = await supabase
      .from('tao_validators')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Error fetching updated validator:`, fetchError);
      toast.error(`Stage was updated but could not retrieve the updated data`);
      // Even if we can't fetch, the update was successful
      return { id, crm_stage: newStage } as TaoValidator;
    }

    console.log('Stage updated successfully:', data);
    return data as TaoValidator;
  } catch (error) {
    console.error('Error updating validator stage:', error);
    toast.error('An unexpected error occurred while updating the stage');
    return null;
  }
};

// Delete a validator
export const deleteValidator = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tao_validators')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting validator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting validator:', error);
    return false;
  }
};

// Fetch all contact logs
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

    return (data || []) as TaoContactLog[];
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    return [];
  }
};

// Create a new contact log
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

    return data as TaoContactLog;
  } catch (error) {
    console.error('Error creating contact log:', error);
    return null;
  }
};

// Fetch contact logs for a validator
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

    return (data || []) as TaoContactLog[];
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    return [];
  }
};

// Fetch all notes
export const fetchTaoNotes = async (): Promise<TaoNote[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Create a new note
export const createTaoNote = async (note: Omit<TaoNote, 'id' | 'created_at' | 'updated_at'>): Promise<TaoNote | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_notes')
      .insert([note])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data as TaoNote;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

// Fetch subnets associated with a validator
export const fetchSubnetsByValidator = async (validatorId: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_validator_subnets')
      .select('subnet_id')
      .eq('validator_id', validatorId);

    if (error) {
      console.error('Error fetching validator subnets:', error);
      return [];
    }

    return data.map(item => item.subnet_id) || [];
  } catch (error) {
    console.error('Error fetching validator subnets:', error);
    return [];
  }
};

// Add a subnet to a validator
export const addSubnetToValidator = async (validatorId: string, subnetId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tao_validator_subnets')
      .insert([{ validator_id: validatorId, subnet_id: subnetId }]);

    if (error) {
      console.error('Error adding subnet to validator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding subnet to validator:', error);
    return false;
  }
};

// Remove a subnet from a validator
export const removeSubnetFromValidator = async (validatorId: string, subnetId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tao_validator_subnets')
      .delete()
      .match({ validator_id: validatorId, subnet_id: subnetId });

    if (error) {
      console.error('Error removing subnet from validator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing subnet from validator:', error);
    return false;
  }
};

// Fetch validators by subnet
export const fetchValidatorsBySubnet = async (subnetId: number): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_validator_subnets')
      .select('validator_id')
      .eq('subnet_id', subnetId);

    if (error) {
      console.error('Error fetching subnet validators:', error);
      return [];
    }

    return data.map(item => item.validator_id) || [];
  } catch (error) {
    console.error('Error fetching subnet validators:', error);
    return [];
  }
};
