export interface ColumnOption {
  label: string;
  color: string;
}

export interface WorkDocumentRow {
  id: string;
  name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  document_type: string | null;
  status: string | null;
  tags: string[] | null;
  notes: string | null;
  financial_value: number | null;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  server_path: string | null;
}

export interface WorkFolderRow {
  id: string;
  name: string;
  user_id: string;
  parent_folder_id: string | null;
  category: string | null;
  status: string | null;
  category_options: unknown;
  status_options: unknown;
  created_at: string;
  updated_at: string;
}

export type SortField = "name" | "updated_at" | "created_at" | "file_size" | "document_type" | "status" | "financial_value";
export type SortDirection = "asc" | "desc";

export const DEFAULT_CATEGORY_OPTIONS: ColumnOption[] = [
  { label: "Planning", color: "#3b82f6" },
  { label: "Budget", color: "#22c55e" },
  { label: "Report", color: "#8b5cf6" },
  { label: "Analysis", color: "#f59e0b" },
  { label: "Strategy", color: "#06b6d4" },
  { label: "Other", color: "#6b7280" },
];

export const DEFAULT_STATUS_OPTIONS: ColumnOption[] = [
  { label: "Draft", color: "#f59e0b" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Review", color: "#8b5cf6" },
  { label: "Final", color: "#22c55e" },
  { label: "Paid", color: "#6b7280" },
];

export const DEFAULT_TAG_OPTIONS: ColumnOption[] = [
  { label: "Important", color: "#ef4444" },
  { label: "Urgent", color: "#f97316" },
  { label: "Q1", color: "#22c55e" },
  { label: "Q2", color: "#3b82f6" },
  { label: "Q3", color: "#8b5cf6" },
  { label: "Q4", color: "#f59e0b" },
  { label: "2024", color: "#06b6d4" },
  { label: "2025", color: "#14b8a6" },
  { label: "2026", color: "#ec4899" },
];
