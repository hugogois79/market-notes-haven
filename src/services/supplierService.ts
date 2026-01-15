import { supabase } from '@/integrations/supabase/client';

export interface Supplier {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getOrCreateSupplier(name: string): Promise<Supplier> {
    const trimmedName = name.trim();
    
    // First, try to find existing supplier
    const { data: existing, error: searchError } = await supabase
      .from('suppliers')
      .select('*')
      .ilike('name', trimmedName)
      .single();

    if (!searchError && existing) {
      return existing;
    }

    // If not found, create new supplier
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ name: trimmedName }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        // Try to fetch again (race condition)
        const { data: retry } = await supabase
          .from('suppliers')
          .select('*')
          .ilike('name', trimmedName)
          .single();
        
        if (retry) return retry;
      }
      throw error;
    }

    return data;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrCreateSuppliersByNames(names: string[]): Promise<{
    suppliers: Supplier[];
    created: string[];
    existing: string[];
  }> {
    const suppliers: Supplier[] = [];
    const created: string[] = [];
    const existing: string[] = [];

    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;

      // Check if exists (case-insensitive)
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', trimmed)
        .single();

      if (existingSupplier) {
        suppliers.push(existingSupplier);
        existing.push(trimmed);
      } else {
        // Create new supplier
        const newSupplier = await this.getOrCreateSupplier(trimmed);
        suppliers.push(newSupplier);
        created.push(trimmed);
      }
    }

    return { suppliers, created, existing };
  },
};
