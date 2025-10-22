import { supabase } from "@/integrations/supabase/client";

export interface ExpenseClaim {
  id: string;
  employee_id: string;
  claim_number: number;
  claim_type: 'reembolso' | 'justificacao_cartao';
  status: 'rascunho' | 'submetido' | 'aprovado' | 'pago' | 'rejeitado';
  total_amount: number;
  description: string | null;
  requester_id: string | null;
  submission_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  expense_claim_id: string;
  expense_date: string;
  description: string;
  supplier: string;
  amount: number;
  project_id: string | null;
  receipt_image_url: string | null;
  created_at: string;
}

export const expenseClaimService = {
  // Get all expense claims for the current user
  async getExpenseClaims(status?: string) {
    let query = supabase
      .from('expense_claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ExpenseClaim[];
  },

  // Get a single expense claim with expenses
  async getExpenseClaimById(id: string) {
    const { data, error } = await supabase
      .from('expense_claims')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ExpenseClaim;
  },

  // Get expenses for a claim
  async getExpenses(claimId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_claim_id', claimId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return data as Expense[];
  },

  // Create a new expense claim
  async createExpenseClaim(claim: {
    claim_type: 'reembolso' | 'justificacao_cartao';
    description: string;
    status?: 'rascunho' | 'submetido';
  }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('expense_claims')
      .insert([
        {
          employee_id: userData.user.id,
          claim_type: claim.claim_type,
          description: claim.description,
          status: claim.status || 'rascunho',
          total_amount: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseClaim;
  },

  // Update expense claim
  async updateExpenseClaim(id: string, updates: Partial<ExpenseClaim>) {
    const { data, error } = await supabase
      .from('expense_claims')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseClaim;
  },

  // Submit expense claim
  async submitExpenseClaim(id: string) {
    const { data, error } = await supabase
      .from('expense_claims')
      .update({
        status: 'submetido',
        submission_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseClaim;
  },

  // Delete expense claim
  async deleteExpenseClaim(id: string) {
    const { error } = await supabase
      .from('expense_claims')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Add expense to claim
  async addExpense(expense: {
    expense_claim_id: string;
    expense_date: string;
    description: string;
    supplier: string;
    amount: number;
    project_id?: string | null;
    receipt_image_url?: string | null;
  }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();

    if (error) throw error;

    // Update total amount
    await expenseClaimService.updateClaimTotal(expense.expense_claim_id);

    return data as Expense;
  },

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update total amount
    await expenseClaimService.updateClaimTotal(data.expense_claim_id);

    return data as Expense;
  },

  // Delete expense
  async deleteExpense(id: string, claimId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update total amount
    await expenseClaimService.updateClaimTotal(claimId);
  },

  // Update claim total amount
  async updateClaimTotal(claimId: string) {
    const expenses = await this.getExpenses(claimId);
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    await this.updateExpenseClaim(claimId, { total_amount: total });
  },

  // Upload receipt
  async uploadReceipt(file: File, claimId: string) {
    // Get current user ID
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}/${claimId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('Expense Receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('Expense Receipts')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
