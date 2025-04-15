
import { supabase } from "@/integrations/supabase/client";

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

export const fetchTaoSubnets = async (): Promise<TaoSubnet[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_subnets')
      .select('*')
      .order('tier', { ascending: true })
      .order('neurons', { ascending: false });

    if (error) {
      console.error('Error fetching TAO subnets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching TAO subnets:', error);
    return [];
  }
};
