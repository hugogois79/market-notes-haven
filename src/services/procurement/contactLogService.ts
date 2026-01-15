import { supabase } from '@/integrations/supabase/client';

export interface SupplierContactLog {
  id: string;
  supplier_id: string;
  project_id: string | null;
  contact_date: string;
  method: string | null;
  direction: string;
  subject: string | null;
  summary: string | null;
  next_steps: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierContactLogInsert {
  supplier_id: string;
  project_id?: string | null;
  contact_date?: string;
  method?: string | null;
  direction?: string;
  subject?: string | null;
  summary?: string | null;
  next_steps?: string | null;
}

export const contactLogService = {
  async getLogsBySupplier(supplierId: string): Promise<SupplierContactLog[]> {
    const { data, error } = await supabase
      .from('supplier_contact_logs')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('contact_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SupplierContactLog[];
  },

  async getLogsByProject(projectId: string): Promise<SupplierContactLog[]> {
    const { data, error } = await supabase
      .from('supplier_contact_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('contact_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SupplierContactLog[];
  },

  async createLog(log: SupplierContactLogInsert): Promise<SupplierContactLog> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('supplier_contact_logs')
      .insert([{ ...log, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    
    // Update supplier's last_interaction_at
    await supabase
      .from('suppliers')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', log.supplier_id);
    
    return data as SupplierContactLog;
  },

  async updateLog(id: string, updates: Partial<SupplierContactLogInsert>): Promise<SupplierContactLog> {
    const { data, error } = await supabase
      .from('supplier_contact_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SupplierContactLog;
  },

  async deleteLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplier_contact_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getRecentLogs(limit: number = 10): Promise<SupplierContactLog[]> {
    const { data, error } = await supabase
      .from('supplier_contact_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as SupplierContactLog[];
  },
};
