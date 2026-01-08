import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, addYears, differenceInDays } from "date-fns";

export interface ForecastAsset {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  current_value: number | null;
  profit_loss_value: number | null;
  appreciation_type: string | null;
  annual_rate_percent: number | null;
  consider_appreciation: boolean | null;
}

export interface ForecastTransaction {
  id: string;
  date: string;
  amount: number;
  asset_id: string | null;
  affects_asset_value: boolean | null;
  transaction_type?: string | null;
}

export interface ForecastAdjustment {
  id: string;
  assetId: string;
  assetName: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
}

export function useForecastCalculations(adjustments: ForecastAdjustment[] = []) {
  const today = new Date();

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["wealth-assets-forecast"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wealth_assets")
        .select("id, name, category, subcategory, current_value, profit_loss_value, appreciation_type, annual_rate_percent, consider_appreciation")
        .eq("user_id", user.id)
        .neq("status", "In Recovery")
        .order("category")
        .order("name");

      if (error) throw error;
      return (data || []) as ForecastAsset[];
    },
  });

  // Fetch future transactions with assets (date >= today)
  const { data: futureTransactions = [] } = useQuery({
    queryKey: ["future-transactions-with-assets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const todayStr = today.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("id, date, amount, transaction_type, asset_id, affects_asset_value")
        .eq("user_id", user.id)
        .not("asset_id", "is", null)
        .gte("date", todayStr)
        .order("date");

      if (error) throw error;
      return (data || []) as ForecastTransaction[];
    },
  });

  // Fetch ALL transactions for cashflow calculation
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["all-wealth-transactions-cashflow"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wealth_transactions")
        .select("id, date, amount, asset_id")
        .eq("user_id", user.id)
        .order("date");

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate cashflow position (accumulated balance) up to a target date
  // Excludes future transactions with asset_id (those are counted in asset projections)
  const getCashflowPosition = (targetDate: Date) => {
    return allTransactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        const hasAssetId = tx.asset_id != null;
        const isFuture = txDate > today;
        // Exclude future transactions with asset_id (already counted in getAssetDelta)
        if (hasAssetId && isFuture) return false;
        return txDate <= targetDate;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Get combined delta (manual adjustments + future transactions) for an asset up to a target date
  const getAssetDelta = (assetId: string, targetDate: Date) => {
    // Manual adjustments delta
    const manualDelta = adjustments
      .filter((adj) => adj.assetId === assetId && new Date(adj.date) <= targetDate)
      .reduce((delta, adj) => {
        return adj.type === "credit" ? delta + adj.amount : delta - adj.amount;
      }, 0);

    // Future transactions delta
    // O amount já tem sinal: positivo (crédito/venda) ou negativo (débito/compra)
    // Inverter para o impacto no ativo: venda reduz, compra aumenta
    // Only include transactions that affect asset value
    const transactionDelta = futureTransactions
      .filter((tx) => tx.asset_id === assetId && new Date(tx.date) <= targetDate && tx.affects_asset_value !== false)
      .reduce((delta, tx) => delta - tx.amount, 0);

    return manualDelta + transactionDelta;
  };

  // Get total delta for all assets (for totals row)
  const getTotalDelta = (targetDate: Date) => {
    const manualDelta = adjustments
      .filter((adj) => new Date(adj.date) <= targetDate)
      .reduce((sum, adj) => sum + (adj.type === "credit" ? adj.amount : -adj.amount), 0);

    // Only include transactions that affect asset value
    const transactionDelta = futureTransactions
      .filter((tx) => new Date(tx.date) <= targetDate && tx.affects_asset_value !== false)
      .reduce((sum, tx) => sum - tx.amount, 0);

    return manualDelta + transactionDelta;
  };

  // Calculate projected value for a single asset at a future date
  const calculateProjectedAssetValue = (asset: ForecastAsset, targetDate: Date) => {
    const value = asset.current_value || 0;
    
    const useAppreciation = asset.consider_appreciation !== false;
    const annualRate = asset.annual_rate_percent ?? 5;
    const isDepreciation = asset.appreciation_type === "depreciates";
    const effectiveRate = useAppreciation ? (isDepreciation ? -annualRate : annualRate) / 100 : 0;
    
    // Appreciate base value from today to target
    const daysToTarget = differenceInDays(targetDate, today);
    const baseGrowthFactor = Math.pow(1 + effectiveRate, daysToTarget / 365);
    let projectedValue = value * baseGrowthFactor;
    
    // Add manual adjustments with proportional appreciation
    const assetAdjustments = adjustments.filter(
      (adj) => adj.assetId === asset.id && new Date(adj.date) <= targetDate
    );
    for (const adj of assetAdjustments) {
      const adjDate = new Date(adj.date);
      const daysFromAdjToTarget = Math.max(0, differenceInDays(targetDate, adjDate));
      const adjGrowthFactor = Math.pow(1 + effectiveRate, daysFromAdjToTarget / 365);
      const adjAmount = adj.type === "credit" ? adj.amount : -adj.amount;
      projectedValue += adjAmount * adjGrowthFactor;
    }
    
    // Add future transactions with proportional appreciation (from tx date to target)
    const assetTransactions = futureTransactions.filter(
      (tx) => tx.asset_id === asset.id && new Date(tx.date) <= targetDate && tx.affects_asset_value !== false
    );
    for (const tx of assetTransactions) {
      const txDate = new Date(tx.date);
      const daysFromTxToTarget = Math.max(0, differenceInDays(targetDate, txDate));
      const txGrowthFactor = Math.pow(1 + effectiveRate, daysFromTxToTarget / 365);
      // tx.amount is negative for debits (investment), so -tx.amount adds to asset
      projectedValue += (-tx.amount) * txGrowthFactor;
    }
    
    return projectedValue;
  };

  // Calculate projected total for a future date
  const calculateProjectedTotal = (targetDate: Date) => {
    let projectedAssetsTotal = 0;
    for (const asset of assets) {
      projectedAssetsTotal += calculateProjectedAssetValue(asset, targetDate);
    }
    return projectedAssetsTotal + getCashflowPosition(targetDate);
  };

  // Dates for forecasts
  const date3M = addMonths(today, 3);
  const date6M = addMonths(today, 6);
  const date1Y = addYears(today, 1);

  // Calculate all projections
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const projectedTotalCurrent = totalValue + getCashflowPosition(today);
  const projectedTotal3M = assets.length > 0 ? calculateProjectedTotal(date3M) : 0;
  const projectedTotal6M = assets.length > 0 ? calculateProjectedTotal(date6M) : 0;
  const projectedTotal1Y = assets.length > 0 ? calculateProjectedTotal(date1Y) : 0;

  return {
    // Data
    assets,
    futureTransactions,
    allTransactions,
    
    // Loading state
    isLoading: assetsLoading,
    
    // Dates
    today,
    date3M,
    date6M,
    date1Y,
    
    // Calculated values
    totalValue,
    projectedTotalCurrent,
    projectedTotal3M,
    projectedTotal6M,
    projectedTotal1Y,
    
    // Helper functions (for custom date calculations)
    getCashflowPosition,
    getAssetDelta,
    getTotalDelta,
    calculateProjectedTotal,
    calculateProjectedAssetValue,
  };
}
