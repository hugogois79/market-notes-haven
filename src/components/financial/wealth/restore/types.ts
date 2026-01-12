import { Json } from "@/integrations/supabase/types";

export interface PlanSnapshot {
  id: string;
  snapshot_date: string;
  name: string | null;
  notes: string | null;
  projected_3m: number | null;
  projected_6m: number | null;
  projected_1y: number | null;
  total_value_at_snapshot: number | null;
  cashflow_snapshot: Json;
  created_at: string;
}

export interface CashflowItem {
  id: string;
  date: string;
  amount: number;
  asset_id: string | null;
  description: string;
  category: string | null;
}

export interface WealthTransaction {
  id: string;
  date: string;
  amount: number;
  asset_id: string | null;
  description: string;
  category: string | null;
}

export interface ComparisonResult {
  onlyInSnapshot: CashflowItem[];
  onlyInCurrent: WealthTransaction[];
  conflicts: Array<{
    snapshot: CashflowItem;
    current: WealthTransaction;
  }>;
  unchanged: CashflowItem[];
}

export type RestoreMode = "replace" | "merge";

export interface ConflictResolution {
  [transactionId: string]: "snapshot" | "current";
}
