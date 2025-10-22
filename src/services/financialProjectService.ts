import { supabase } from "@/integrations/supabase/client";

export interface FinancialProject {
  id: string;
  name: string;
  description: string | null;
  company_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  budget: number | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export const financialProjectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('financial_projects')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as FinancialProject[];
  },

  async getProjectsByIds(ids: string[]) {
    if (ids.length === 0) return [];
    
    const { data, error } = await supabase
      .from('financial_projects')
      .select('*')
      .in('id', ids);

    if (error) throw error;
    return data as FinancialProject[];
  },
};
