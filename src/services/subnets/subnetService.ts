
import { supabase } from "@/integrations/supabase/client";
import { TaoSubnet } from "./types";

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
