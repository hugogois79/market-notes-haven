
import { TaoSubnet as TaoSubnetService } from "@/services/taoSubnetService";
import { TaoSubnet as TaoSubnetTypes } from "@/services/subnets/types";

/**
 * Adapts the TaoSubnet from taoSubnetService to match the TaoSubnet from subnets/types
 */
export const adaptToSubnetTypes = (subnet: TaoSubnetService): TaoSubnetTypes => {
  return {
    id: typeof subnet.id === 'string' ? parseInt(subnet.id, 10) : subnet.id,
    name: subnet.name,
    description: subnet.description || null,
    tier: subnet.tier,
    neurons: subnet.neurons,
    emission: subnet.emission,
    incentive: subnet.incentive,
    created_at: subnet.created_at || new Date().toISOString(),
    updated_at: subnet.updated_at || new Date().toISOString()
  };
};

/**
 * Adapts an array of TaoSubnet from taoSubnetService to match TaoSubnet[] from subnets/types
 */
export const adaptArrayToSubnetTypes = (subnets: TaoSubnetService[]): TaoSubnetTypes[] => {
  return subnets.map(adaptToSubnetTypes);
};
