export interface ColumnOption {
  label: string;
  color: string;
}

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
  dbField?: string;
  options?: ColumnOption[];
  isBuiltIn?: boolean;
}

export interface DocumentRow {
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
  file_hash: string | null;
  folder_id: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

export interface FolderRow {
  id: string;
  name: string;
  company_id: string;
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

export const DEFAULT_TAG_OPTIONS: ColumnOption[] = [
  { label: "Important", color: "#ef4444" },
  { label: "Urgent", color: "#f97316" },
  { label: "Review", color: "#f59e0b" },
  { label: "Archive", color: "#6b7280" },
  { label: "Legal", color: "#8b5cf6" },
  { label: "Finance", color: "#22c55e" },
  { label: "Contract", color: "#3b82f6" },
  { label: "Invoice", color: "#06b6d4" },
  { label: "Receipt", color: "#14b8a6" },
  { label: "Other", color: "#ec4899" },
];

export const DEFAULT_CATEGORY_OPTIONS: ColumnOption[] = [
  { label: "Invoice", color: "#22c55e" },
  { label: "Contract", color: "#3b82f6" },
  { label: "Proof", color: "#8b5cf6" },
  { label: "Expense", color: "#f59e0b" },
  { label: "Legal", color: "#ef4444" },
  { label: "Report", color: "#06b6d4" },
  { label: "Other", color: "#6b7280" },
];

export const DEFAULT_STATUS_OPTIONS: ColumnOption[] = [
  { label: "Draft", color: "#f59e0b" },
  { label: "Under Review", color: "#3b82f6" },
  { label: "Final", color: "#22c55e" },
  { label: "Filed", color: "#6b7280" },
  { label: "Active", color: "#22c55e" },
  { label: "Closed", color: "#6b7280" },
  { label: "Compliance", color: "#8b5cf6" },
];

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "File", visible: true, required: true },
  { id: "docDate", label: "Date", visible: true },
  { id: "category", label: "Category", visible: true, dbField: "document_type", isBuiltIn: true, options: DEFAULT_CATEGORY_OPTIONS },
  { id: "value", label: "Value", visible: true, isBuiltIn: true },
  { id: "status", label: "Status", visible: true, dbField: "status", isBuiltIn: true, options: DEFAULT_STATUS_OPTIONS },
];

export const DOCUMENT_TYPES = ["All", "Invoice", "Contract", "Proof", "Receipt", "Legal", "Report", "Other"];
export const DOCUMENT_STATUSES = ["All", "Draft", "Under Review", "Final", "Filed"];
