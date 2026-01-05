import { supabase } from "@/integrations/supabase/client";

export interface WealthAsset {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  purchase_date: string | null;
  purchase_price: number;
  current_value: number;
  currency: string;
  status: string;
  yield_percent: number | null;
  notes: string | null;
  image_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface WealthTransaction {
  id: string;
  user_id: string | null;
  date: string;
  description: string;
  category: string | null;
  amount: number;
  transaction_type: 'credit' | 'debit';
  asset_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WealthMarketData {
  id: string;
  symbol: string;
  price: number;
  currency: string;
  source: string | null;
  fetched_at: string;
}

export interface WealthPortfolioSnapshot {
  id: string;
  user_id: string | null;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  breakdown: Record<string, number>;
  created_at: string;
}

export interface WealthAssetValuation {
  id: string;
  asset_id: string;
  valuation_date: string;
  value: number;
  notes: string | null;
  created_at: string;
}

export const wealthService = {
  // Assets
  async getAssets(): Promise<WealthAsset[]> {
    const { data, error } = await supabase
      .from('wealth_assets')
      .select('*')
      .order('category', { ascending: true });
    if (error) throw error;
    return data as WealthAsset[];
  },

  async createAsset(asset: {
    user_id: string | null;
    name: string;
    category: string;
    subcategory?: string | null;
    purchase_date?: string | null;
    purchase_price?: number;
    current_value?: number;
    currency?: string;
    status?: string;
    yield_percent?: number | null;
    notes?: string | null;
    image_url?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<WealthAsset> {
    const { data, error } = await supabase
      .from('wealth_assets')
      .insert(asset)
      .select()
      .single();
    if (error) throw error;
    return data as WealthAsset;
  },

  async updateAsset(id: string, updates: Record<string, any>): Promise<WealthAsset> {
    const { data, error } = await supabase
      .from('wealth_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as WealthAsset;
  },

  async deleteAsset(id: string): Promise<void> {
    const { error } = await supabase
      .from('wealth_assets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Transactions
  async getTransactions(): Promise<WealthTransaction[]> {
    const { data, error } = await supabase
      .from('wealth_transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data as WealthTransaction[];
  },

  async createTransaction(transaction: {
    user_id: string | null;
    date: string;
    description: string;
    category?: string | null;
    amount: number;
    transaction_type: 'credit' | 'debit';
    asset_id?: string | null;
    notes?: string | null;
  }): Promise<WealthTransaction> {
    const { data, error } = await supabase
      .from('wealth_transactions')
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;
    return data as WealthTransaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('wealth_transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Market Data
  async getMarketData(): Promise<WealthMarketData[]> {
    const { data, error } = await supabase
      .from('wealth_market_data')
      .select('*')
      .order('fetched_at', { ascending: false });
    if (error) throw error;
    return data as WealthMarketData[];
  },

  async upsertMarketData(symbol: string, price: number, source?: string): Promise<WealthMarketData> {
    const { data, error } = await supabase
      .from('wealth_market_data')
      .upsert({ symbol, price, source, fetched_at: new Date().toISOString() }, { onConflict: 'symbol' })
      .select()
      .single();
    if (error) throw error;
    return data as WealthMarketData;
  },

  // Portfolio Snapshots
  async getSnapshots(): Promise<WealthPortfolioSnapshot[]> {
    const { data, error } = await supabase
      .from('wealth_portfolio_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true });
    if (error) throw error;
    return data as WealthPortfolioSnapshot[];
  },

  async createSnapshot(snapshot: {
    user_id: string | null;
    snapshot_date: string;
    total_assets?: number;
    total_liabilities?: number;
    net_worth?: number;
    breakdown?: Record<string, number>;
  }): Promise<WealthPortfolioSnapshot> {
    const { data, error } = await supabase
      .from('wealth_portfolio_snapshots')
      .insert(snapshot)
      .select()
      .single();
    if (error) throw error;
    return data as WealthPortfolioSnapshot;
  },

  // Asset Valuations
  async getAssetValuations(assetId: string): Promise<WealthAssetValuation[]> {
    const { data, error } = await supabase
      .from('wealth_asset_valuations')
      .select('*')
      .eq('asset_id', assetId)
      .order('valuation_date', { ascending: true });
    if (error) throw error;
    return data as WealthAssetValuation[];
  },

  async createValuation(valuation: {
    asset_id: string;
    valuation_date: string;
    value: number;
    notes?: string | null;
  }): Promise<WealthAssetValuation> {
    const { data, error } = await supabase
      .from('wealth_asset_valuations')
      .insert(valuation)
      .select()
      .single();
    if (error) throw error;
    return data as WealthAssetValuation;
  },
};

// EUR formatter
export const formatEUR = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Calculate P/L
export const calculatePL = (purchasePrice: number, currentValue: number) => {
  const value = currentValue - purchasePrice;
  const percent = purchasePrice > 0 ? ((currentValue - purchasePrice) / purchasePrice) * 100 : 0;
  return { value, percent };
};
