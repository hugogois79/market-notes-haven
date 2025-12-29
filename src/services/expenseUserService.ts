import { supabase } from "@/integrations/supabase/client";

export interface FeaturePermissions {
  expenses: boolean;
  receipt_generator: boolean;
  calendar: boolean;
  finance: boolean;
  legal: boolean;
  projects: boolean;
  notes: boolean;
  tao: boolean;
}

export interface ExpenseUser {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  assigned_project_ids: string[] | null;
  is_active: boolean;
  is_requester: boolean;
  feature_permissions: FeaturePermissions | null;
  created_at: string;
  updated_at: string;
}

// Helper to map DB row to ExpenseUser type
const mapRowToExpenseUser = (row: any): ExpenseUser => ({
  ...row,
  feature_permissions: row.feature_permissions as FeaturePermissions | null,
});

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
    return (data || []).map(mapRowToExpenseUser);
  },

  async getRequesters(): Promise<ExpenseUser[]> {
    const { data, error } = await supabase
      .from("expense_users")
      .select("*")
      .eq("is_requester", true)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return (data || []).map(mapRowToExpenseUser);
  },

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    assigned_project_ids?: string[];
    is_requester?: boolean;
    feature_permissions?: FeaturePermissions;
  }): Promise<ExpenseUser> {
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: {
        action: "create",
        email: userData.email,
        password: userData.password,
        name: userData.name,
        assigned_project_ids: userData.assigned_project_ids || [],
        is_requester: userData.is_requester || false,
        feature_permissions: userData.feature_permissions || null,
      },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return mapRowToExpenseUser(data.user);
  },

  async updateUser(id: string, updates: Partial<Omit<ExpenseUser, 'feature_permissions'>> & { feature_permissions?: FeaturePermissions | null }): Promise<ExpenseUser> {
    const { data, error } = await supabase
      .from("expense_users")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToExpenseUser(data);
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from("expense_users")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async resetPassword(email: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: {
        action: "reset_password",
        email,
      },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
  },

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: {
        action: "change_password",
        user_id: userId,
        new_password: newPassword,
      },
    });

    if (error) throw error;
    if (data.error) {
      // Provide clearer error message for users not in auth system
      if (data.error.includes("não encontrado") || data.error.includes("not found")) {
        throw new Error("Este utilizador não tem conta de autenticação. Elimine e recrie o utilizador com uma password.");
      }
      throw new Error(data.error);
    }
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
    return data ? mapRowToExpenseUser(data) : null;
  },
};
