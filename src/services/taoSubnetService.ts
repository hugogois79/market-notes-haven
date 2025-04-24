
import { supabase } from '@/integrations/supabase/client';

export interface TaoSubnet {
  id: number | string;
  name: string;
  neurons: number;
  emission: string | number;
  description?: string;
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
    const { data, error } = await supabase
      .from('tao_subnets')
      .update(subnet)
      .eq('id', subnet.id)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating TAO subnet ${subnet.id}:`, error);
    return null;
  }
};

export const createTaoSubnet = async (subnet: Omit<TaoSubnet, 'id'>): Promise<TaoSubnet | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_subnets')
      .insert(subnet)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating TAO subnet:', error);
    return null;
  }
};
