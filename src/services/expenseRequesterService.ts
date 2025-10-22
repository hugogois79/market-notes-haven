import { supabase } from "@/integrations/supabase/client";

export interface ExpenseRequester {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  assigned_project_ids: string[];
  created_at: string;
  updated_at: string;
}

export const expenseRequesterService = {
  async getRequesters(includeInactive = false) {
    let query = supabase
      .from('expense_requesters')
      .select('*')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ExpenseRequester[];
  },

  async createRequester(requester: {
    name: string;
    email?: string | null;
    assigned_project_ids?: string[];
  }) {
    const { data, error } = await supabase
      .from('expense_requesters')
      .insert([requester])
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseRequester;
  },

  async updateRequester(id: string, updates: Partial<ExpenseRequester>) {
    const { data, error } = await supabase
      .from('expense_requesters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseRequester;
  },

  async deleteRequester(id: string) {
    const { error } = await supabase
      .from('expense_requesters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
