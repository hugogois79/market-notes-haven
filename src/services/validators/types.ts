
import { TaoSubnet } from "../subnets/types";

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

export interface TaoValidatorSubnet {
  id: string;
  validator_id: string;
  subnet_id: number;
  created_at: string;
}
