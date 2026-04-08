import { supabase } from '@/integrations/supabase/client';

export interface ProcurementProject {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  status: string;
  deadline: string | null;
  category: string | null;
  company_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementProjectInsert {
  title: string;
  description?: string | null;
  budget?: number | null;
  status?: string;
  deadline?: string | null;
  category?: string | null;
  company_id?: string | null;
}

export const projectService = {
  async getProjects(): Promise<ProcurementProject[]> {
    const { data, error } = await supabase
      .from('procurement_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProcurementProject[];
  },

  async getProjectById(id: string): Promise<ProcurementProject | null> {
    const { data, error } = await supabase
      .from('procurement_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ProcurementProject;
  },

  async createProject(project: ProcurementProjectInsert): Promise<ProcurementProject> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('procurement_projects')
      .insert([{ ...project, created_by: userData?.user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data as ProcurementProject;
  },

  async updateProject(id: string, updates: Partial<ProcurementProjectInsert>): Promise<ProcurementProject> {
    const { data, error } = await supabase
      .from('procurement_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProcurementProject;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('procurement_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProjectsByStatus(status: string): Promise<ProcurementProject[]> {
    const { data, error } = await supabase
      .from('procurement_projects')
      .select('*')
      .eq('status', status)
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as ProcurementProject[];
  },
};
