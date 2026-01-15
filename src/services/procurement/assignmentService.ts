import { supabase } from '@/integrations/supabase/client';

export interface ProcurementAssignment {
  id: string;
  project_id: string;
  supplier_id: string;
  status: string;
  last_email_content: string | null;
  last_reply_content: string | null;
  quoted_price: number | null;
  notes: string | null;
  contacted_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementAssignmentWithSupplier extends ProcurementAssignment {
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    category: string | null;
    trust_score: number | null;
    crm_stage: string | null;
  };
}

export interface ProcurementAssignmentInsert {
  project_id: string;
  supplier_id: string;
  status?: string;
  notes?: string | null;
}

export const assignmentService = {
  async getAssignmentsByProject(projectId: string): Promise<ProcurementAssignmentWithSupplier[]> {
    const { data, error } = await supabase
      .from('procurement_assignments')
      .select(`
        *,
        supplier:suppliers(id, name, email, phone, specialty, category, trust_score, crm_stage)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProcurementAssignmentWithSupplier[];
  },

  async getAssignmentsBySupplier(supplierId: string): Promise<ProcurementAssignment[]> {
    const { data, error } = await supabase
      .from('procurement_assignments')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProcurementAssignment[];
  },

  async createAssignment(assignment: ProcurementAssignmentInsert): Promise<ProcurementAssignment> {
    const { data, error } = await supabase
      .from('procurement_assignments')
      .insert([assignment])
      .select()
      .single();

    if (error) throw error;
    return data as ProcurementAssignment;
  },

  async updateAssignment(id: string, updates: Partial<ProcurementAssignment>): Promise<ProcurementAssignment> {
    const { data, error } = await supabase
      .from('procurement_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProcurementAssignment;
  },

  async updateAssignmentStatus(id: string, status: string): Promise<ProcurementAssignment> {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'contacted') {
      updates.contacted_at = new Date().toISOString();
    } else if (status === 'responded') {
      updates.responded_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('procurement_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProcurementAssignment;
  },

  async deleteAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('procurement_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreateAssignments(projectId: string, supplierIds: string[]): Promise<ProcurementAssignment[]> {
    const assignments = supplierIds.map(supplierId => ({
      project_id: projectId,
      supplier_id: supplierId,
      status: 'to_contact',
    }));

    const { data, error } = await supabase
      .from('procurement_assignments')
      .insert(assignments)
      .select();

    if (error) throw error;
    return (data || []) as ProcurementAssignment[];
  },
};
