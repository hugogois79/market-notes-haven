
import { supabase } from '@/integrations/supabase/client';

export interface TaoSubnet {
  id: number | string;
  name: string;
  neurons: number;
  emission: string;  // Change back to just string to match database
  description?: string;
  tier: number;
  incentive: string;
  created_at?: string;
  updated_at?: string;
  api_endpoint?: string;
  api_docs_url?: string;
  api_version?: string;
  last_api_check?: string;
  api_status?: string;
}

export const fetchTaoSubnets = async (): Promise<TaoSubnet[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_subnets')
      .select('*')
      .order('id');

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    return [];
  }
};

export const fetchTaoSubnet = async (id: number): Promise<TaoSubnet | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_subnets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching TAO subnet ${id}:`, error);
    return null;
  }
};

export const updateTaoSubnet = async (subnet: Partial<TaoSubnet> & { id: number | string }): Promise<TaoSubnet | null> => {
  try {
    // Ensure emission is always a string to match the database column type
    const subnetToUpdate = {
      ...subnet,
      emission: subnet.emission ? String(subnet.emission) : undefined
    };

    // Extract ID for the eq filter
    const id = typeof subnet.id === 'string' ? parseInt(subnet.id, 10) : subnet.id;
    
    // Remove id from the update object
    const { id: _, ...updateData } = subnetToUpdate;

    const { data, error } = await supabase
      .from('tao_subnets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating TAO subnet ${subnet.id}:`, error);
    return null;
  }
};

export const createTaoSubnet = async (subnet: Omit<TaoSubnet, "id" | "created_at" | "updated_at">): Promise<TaoSubnet | null> => {
  try {
    // Ensure emission is always a string to match the database column type
    const subnetToCreate = {
      ...subnet,
      emission: String(subnet.emission)
    };

    const { data, error } = await supabase
      .from('tao_subnets')
      .insert(subnetToCreate)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating TAO subnet:', error);
    return null;
  }
};
