import { supabase } from "@/integrations/supabase/client";

export interface ExpenseUser {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  assigned_project_ids: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const expenseUserService = {
  async getUsers(includeInactive = false): Promise<ExpenseUser[]> {
    let query = supabase
      .from("expense_users")
      .select("*")
      .order("name");

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createUser(userData: {
    user_id: string;
    name: string;
    email?: string | null;
    assigned_project_ids?: string[];
  }): Promise<ExpenseUser> {
    const { data, error } = await supabase
      .from("expense_users")
      .insert({
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email || null,
        assigned_project_ids: userData.assigned_project_ids || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: Partial<ExpenseUser>): Promise<ExpenseUser> {
    const { data, error } = await supabase
      .from("expense_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from("expense_users")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getCurrentUserExpenseRecord(): Promise<ExpenseUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("expense_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
