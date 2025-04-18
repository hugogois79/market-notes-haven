
import { supabase } from "@/integrations/supabase/client";
import { TaoValidator } from "./types";
import { toast } from "sonner";

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

    // Cast the data to ensure it matches the TaoValidator type
    return (data || []).map(validator => ({
      ...validator,
      crm_stage: validator.crm_stage as TaoValidator["crm_stage"],
      priority: validator.priority as TaoValidator["priority"]
    }));
  } catch (error) {
    console.error('Error fetching validators:', error);
    toast.error('An unexpected error occurred');
    return [];
  }
};

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

    // Cast the data to ensure it matches the TaoValidator type
    return data ? {
      ...data,
      crm_stage: data.crm_stage as TaoValidator["crm_stage"],
      priority: data.priority as TaoValidator["priority"]
    } : null;
  } catch (error) {
    console.error('Error fetching validator:', error);
    return null;
  }
};

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

    // Cast the data to ensure it matches the TaoValidator type
    return data ? {
      ...data,
      crm_stage: data.crm_stage as TaoValidator["crm_stage"],
      priority: data.priority as TaoValidator["priority"]
    } : null;
  } catch (error) {
    console.error('Error creating validator:', error);
    return null;
  }
};

export const updateValidator = async (id: string, updates: Partial<TaoValidator>): Promise<TaoValidator | null> => {
  try {
    console.log(`Updating validator ${id} with:`, updates);
    
    const { error: updateError } = await supabase
      .from('tao_validators')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating validator:', updateError);
      toast.error(`Failed to update validator: ${updateError.message}`);
      return null;
    }

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

    console.log('Validator updated successfully:', updatedData);
    
    // Cast the data to ensure it matches the TaoValidator type
    return updatedData ? {
      ...updatedData,
      crm_stage: updatedData.crm_stage as TaoValidator["crm_stage"],
      priority: updatedData.priority as TaoValidator["priority"]
    } : null;
  } catch (error) {
    console.error('Error updating validator:', error);
    toast.error('An unexpected error occurred while updating the validator');
    return null;
  }
};

export const updateValidatorStage = async (id: string, newStage: TaoValidator["crm_stage"]): Promise<TaoValidator | null> => {
  try {
    console.log(`updateValidatorStage called for ID ${id} with new stage ${newStage}`);
    
    // Add a delay to ensure database consistency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { error: updateError } = await supabase
      .from('tao_validators')
      .update({ crm_stage: newStage })
      .eq('id', id);

    if (updateError) {
      console.error(`Error moving validator to ${newStage} stage:`, updateError);
      toast.error(`Failed to update stage: ${updateError.message}`);
      return null;
    }

    // Add a small delay before fetching to ensure consistency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data, error: fetchError } = await supabase
      .from('tao_validators')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Error fetching updated validator:`, fetchError);
      toast.error(`Stage was updated but could not retrieve the updated data`);
      return { id, crm_stage: newStage } as TaoValidator;
    }

    console.log('Stage updated successfully:', data);
    
    // Cast the data to ensure it matches the TaoValidator type
    return data ? {
      ...data,
      crm_stage: data.crm_stage as TaoValidator["crm_stage"],
      priority: data.priority as TaoValidator["priority"]
    } : null;
  } catch (error) {
    console.error('Error updating validator stage:', error);
    toast.error('An unexpected error occurred while updating the stage');
    return null;
  }
};

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
