import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Search, Trash2, Download, FileText, X, Plus, ChevronDown, ChevronUp, MoreHorizontal, Edit3, Columns, Filter, Printer, CheckCircle2, AlertTriangle, CreditCard, Bookmark, Save, FolderInput, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { DocumentPreview } from "@/components/companies/DocumentPreview";
import { WorkflowExpensePanel } from "@/components/companies/WorkflowExpensePanel";
import DocumentPaymentDialog from "@/components/companies/DocumentPaymentDialog";
import { DocumentAIPanel } from "@/components/companies/DocumentAIPanel";
import { cn } from "@/lib/utils";

interface WorkflowFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  notes: string | null;
  priority: string;
  created_at: string;
  completed_at: string | null;
  category?: string | null;
  company_id?: string | null;
  companies?: { id: string; name: string } | null;
  // OCR data from n8n
  invoice_date?: string | null;
  invoice_number?: string | null;
  vendor_name?: string | null;
  vendor_vat?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  subtotal?: number | null;
  currency?: string | null;
  payment_method?: string | null;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface ColumnOption {
  label: string;
  color: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
  dbField?: string;
  options?: ColumnOption[];
  isBuiltIn?: boolean;
}

// Fixed color palette (10 colors)
const COLOR_PALETTE = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#6b7280", // gray
];

const DEFAULT_CATEGORY_OPTIONS: ColumnOption[] = [
  { label: "Invoice", color: "#22c55e" },
  { label: "Contract", color: "#3b82f6" },
  { label: "Report", color: "#8b5cf6" },
  { label: "Legal", color: "#ef4444" },
  { label: "Other", color: "#6b7280" },
];

const DEFAULT_STATUS_OPTIONS: ColumnOption[] = [
  { label: "Pending", color: "#f59e0b" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Completed", color: "#22c55e" },
  { label: "Archived", color: "#6b7280" },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "File", visible: true, required: true },
  { id: "type", label: "Type", visible: true },
  { id: "date", label: "Date", visible: true },
  { id: "category", label: "Category", visible: true, dbField: "category", isBuiltIn: true, options: DEFAULT_CATEGORY_OPTIONS },
  { id: "status", label: "Status", visible: true, dbField: "status", isBuiltIn: true, options: DEFAULT_STATUS_OPTIONS },
  { id: "size", label: "Size", visible: true },
  { id: "empresa", label: "Empresa", visible: true, isBuiltIn: true },
  { id: "project", label: "Project", visible: true, isBuiltIn: true },
  { id: "value", label: "Value", visible: true, isBuiltIn: true },
];

// Helper to extract file extension
const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
};

// Helper to display file name without extension
const getFileNameWithoutExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return fileName;
  return fileName.substring(0, lastDot);
};

// Helper to get file type badge color
const getFileTypeBadgeStyle = (ext: string): { bg: string; text: string } => {
  const styles: Record<string, { bg: string; text: string }> = {
    pdf: { bg: "#ef4444", text: "white" },
    doc: { bg: "#3b82f6", text: "white" },
    docx: { bg: "#3b82f6", text: "white" },
    xls: { bg: "#22c55e", text: "white" },
    xlsx: { bg: "#22c55e", text: "white" },
    ppt: { bg: "#f97316", text: "white" },
    pptx: { bg: "#f97316", text: "white" },
    jpg: { bg: "#8b5cf6", text: "white" },
    jpeg: { bg: "#8b5cf6", text: "white" },
    png: { bg: "#8b5cf6", text: "white" },
    gif: { bg: "#8b5cf6", text: "white" },
    txt: { bg: "#6b7280", text: "white" },
    csv: { bg: "#14b8a6", text: "white" },
    zip: { bg: "#f59e0b", text: "white" },
    rar: { bg: "#f59e0b", text: "white" },
  };
  return styles[ext] || { bg: "#6b7280", text: "white" };
};

const WORKFLOW_COLUMNS_KEY = "workflow-columns";
const WORKFLOW_CUSTOM_COLUMNS_KEY = "workflow-custom-columns";
const WORKFLOW_CUSTOM_DATA_KEY = "workflow-custom-data";
const WORKFLOW_SORT_KEY = "workflow-sort";
const TABLE_RELATIONS_KEY = "work-table-relations";
const WORKFLOW_SAVED_FILTERS_KEY = "workflow-saved-filters";

interface TableRelationsConfig {
  defaultCompanyId: string | null;
  autoCreateTransaction: boolean;
  linkWorkflowToFinance: boolean;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface FilterCondition {
  column: string;
  values: string[];
  mode: 'include' | 'exclude';
}

interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  isPreset?: boolean; // Preset filters cannot be deleted
}

// Default preset filters that are always available
const DEFAULT_PRESET_FILTERS: SavedFilter[] = [
  { id: "preset-pa", name: "PA", conditions: [{ column: "category", values: ["PA"], mode: "include" }], isPreset: true },
  { id: "preset-payment", name: "Payment", conditions: [{ column: "status", values: ["Payment"], mode: "include" }], isPreset: true },
  { id: "preset-claim", name: "Claim", conditions: [{ column: "status", values: ["Claim"], mode: "include" }], isPreset: true },
  { id: "preset-work", name: "Work", conditions: [{ column: "category", values: ["Work"], mode: "include" }], isPreset: true },
];

// Sanitize filename to remove special characters
const sanitizeFileName = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.substring(lastDot) : '';
  const nameWithoutExt = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
  
  const sanitized = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return sanitized + ext;
};

export default function WorkFlowTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  
  // Keyboard navigation - focused file row
  const [focusedFileId, setFocusedFileId] = useState<string | null>(null);
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for action buttons (to scroll into view when pressing E)
  const actionBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Resizable column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("workflow-column-widths");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { name: 400 };
      }
    }
    return { name: 400 };
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(400);
  // Current filter being edited
  const [currentFilterColumn, setCurrentFilterColumn] = useState<string>("");
  
  // Saved filters state - now loaded from Supabase
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Query to fetch saved filters from Supabase
  const { data: supabaseSavedFilters, refetch: refetchSavedFilters } = useQuery({
    queryKey: ["user-saved-filters", "workflow"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_saved_filters")
        .select("*")
        .eq("user_id", user.id)
        .eq("filter_type", "workflow")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[WorkFlowTab] Error loading saved filters:", error);
        return [];
      }
      
      // Map to SavedFilter format
      return data.map((f: any) => ({
        id: f.id,
        name: f.name,
        conditions: f.conditions || []
      })) as SavedFilter[];
    },
  });

  // Sync Supabase filters to local state
  useEffect(() => {
    if (supabaseSavedFilters) {
      setSavedFilters(supabaseSavedFilters);
    }
  }, [supabaseSavedFilters]);
  
  // Track deleted preset filter IDs
  const [deletedPresetIds, setDeletedPresetIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("workflow-deleted-preset-filters");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Column state - initialize with defaults, will be updated from Supabase
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [columnsInitialized, setColumnsInitialized] = useState(false);

  const [customColumns, setCustomColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(WORKFLOW_CUSTOM_COLUMNS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [customData, setCustomData] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(WORKFLOW_CUSTOM_DATA_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(WORKFLOW_SORT_KEY);
    return saved ? JSON.parse(saved) : { column: 'date', direction: 'desc' };
  });

  // Document preview state
  const [previewFile, setPreviewFile] = useState<WorkflowFile | null>(null);
  const [showExpensePanel, setShowExpensePanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Mark as completed state
  const [markCompleteWarningOpen, setMarkCompleteWarningOpen] = useState(false);
  const [fileToComplete, setFileToComplete] = useState<WorkflowFile | null>(null);
  const [missingStorageCompanyName, setMissingStorageCompanyName] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Move file to folder state
  const [moveFileDialogOpen, setMoveFileDialogOpen] = useState(false);
  const [fileToMove, setFileToMove] = useState<WorkflowFile | null>(null);
  const [moveForm, setMoveForm] = useState<{
    company_id: string;
    folder_id: string | null;
    folder_path: string;
  }>({ company_id: "", folder_id: null, folder_path: "" });

  // Rename file state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<WorkflowFile | null>(null);
  const [newFileName, setNewFileName] = useState("");

  // Skip payment confirmation state
  const [showSkipPaymentConfirmation, setShowSkipPaymentConfirmation] = useState(false);
  const [fileToSkipPayment, setFileToSkipPayment] = useState<WorkflowFile | null>(null);

  // Query existing transaction for current file using document_file_id
  // Also check for loans linked via file_url in company_documents
  const { data: existingTransaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ["file-transaction", previewFile?.id, previewFile?.file_url],
    queryFn: async () => {
      if (!previewFile?.id && !previewFile?.file_url) return null;
      
      // First try to find a financial_transaction by document_file_id
      if (previewFile?.id) {
        const { data: transactionData, error: transactionError } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("document_file_id", previewFile.id)
          .maybeSingle();
        
        if (transactionError) throw transactionError;
        if (transactionData) return transactionData;
      }
      
      // Fallback: try to find by invoice_file_url
      if (previewFile?.file_url) {
        const { data: transactionByUrl, error: urlError } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("invoice_file_url", previewFile.file_url)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (urlError) throw urlError;
        if (transactionByUrl) {
          // Auto-relink: if found by URL but missing document_file_id, update it
          if (previewFile?.id && !transactionByUrl.document_file_id) {
            await supabase
              .from("financial_transactions")
              .update({ document_file_id: previewFile.id })
              .eq("id", transactionByUrl.id);
          }
          return transactionByUrl;
        }
      }
      
      // If no financial_transaction, check for loan via source_file_id
      if (previewFile?.id) {
        const { data: loanData, error: loanError } = await supabase
          .from("company_loans")
          .select("*")
          .eq("source_file_id", previewFile.id)
          .maybeSingle();
        
        if (loanError) throw loanError;
        if (loanData) {
          // Return loan data in a format compatible with WorkflowExpensePanel
          return {
            id: loanData.id,
            type: "loan",
            date: loanData.start_date,
            lending_company_id: loanData.lending_company_id,
            borrowing_company_id: loanData.borrowing_company_id,
            total_amount: loanData.amount,
            interest_rate: loanData.interest_rate,
            monthly_payment: loanData.monthly_payment,
            end_date: loanData.end_date,
            loan_status: loanData.status,
            description: loanData.description,
            notes: loanData.description,
            // Mark as loan type for proper form handling
            _isLoan: true,
          };
        }
      }
      
      // Check for document in company_documents by file_url
      if (previewFile?.file_url) {
        const { data: docData, error: docError } = await supabase
          .from("company_documents")
          .select("*")
          .eq("file_url", previewFile.file_url)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (docError) throw docError;
        if (docData) {
          // Return document data in a format compatible with WorkflowExpensePanel
          return {
            id: docData.id,
            date: docData.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
            type: "document",
            company_id: docData.company_id,
            target_folder_id: docData.folder_id,
            notes: docData.notes,
            description: docData.name,
            _isDocument: true,
          };
        }
      }
      
      return null;
    },
    enabled: !!(previewFile?.id || previewFile?.file_url),
    staleTime: 0, // Always refetch when file changes
  });


  // Column management dialogs
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnOptions, setNewColumnOptions] = useState<ColumnOption[]>([]);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);

  // Fetch column config from Supabase
  const { data: columnConfig } = useQuery({
    queryKey: ["workflow-column-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("workflow_column_config")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
  });

  // Apply column config from Supabase when loaded
  useEffect(() => {
    if (columnConfig && !columnsInitialized) {
      setColumns(prevColumns => {
        return prevColumns.map(col => {
          const savedConfig = columnConfig.find(c => c.column_id === col.id);
          if (savedConfig && savedConfig.options) {
            return { ...col, options: savedConfig.options as unknown as ColumnOption[] };
          }
          return col;
        });
      });
      setColumnsInitialized(true);
    }
  }, [columnConfig, columnsInitialized]);

  // Mutation to save column config to Supabase
  const saveColumnConfigMutation = useMutation({
    mutationFn: async ({ columnId, options }: { columnId: string; options: ColumnOption[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Check if config exists
      const { data: existing } = await supabase
        .from("workflow_column_config")
        .select("id")
        .eq("user_id", user.id)
        .eq("column_id", columnId)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from("workflow_column_config")
          .update({
            options: options as unknown as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workflow_column_config")
          .insert({
            user_id: user.id,
            column_id: columnId,
            options: options as unknown as any,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-column-config"] });
    },
    onError: (error) => {
      toast.error("Failed to save column config: " + error.message);
    },
  });

  useEffect(() => {
    localStorage.setItem(WORKFLOW_CUSTOM_COLUMNS_KEY, JSON.stringify(customColumns));
  }, [customColumns]);

  useEffect(() => {
    localStorage.setItem(WORKFLOW_CUSTOM_DATA_KEY, JSON.stringify(customData));
  }, [customData]);

  useEffect(() => {
    localStorage.setItem(WORKFLOW_SORT_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // Mutation to save a new filter to Supabase
  const saveFilterMutation = useMutation({
    mutationFn: async (newFilter: { name: string; conditions: FilterCondition[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_saved_filters")
        .insert([{
          user_id: user.id,
          filter_type: "workflow",
          name: newFilter.name,
          conditions: newFilter.conditions as unknown as import("@/integrations/supabase/types").Json
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchSavedFilters();
      setNewFilterName("");
      setSaveFilterDialogOpen(false);
      toast.success("Filtro guardado");
    },
    onError: (error) => {
      toast.error("Erro ao guardar filtro: " + error.message);
    },
  });

  // Mutation to delete a filter from Supabase
  const deleteFilterMutation = useMutation({
    mutationFn: async (filterId: string) => {
      const { error } = await supabase
        .from("user_saved_filters")
        .delete()
        .eq("id", filterId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchSavedFilters();
      toast.success("Filtro eliminado");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar filtro: " + error.message);
    },
  });

  // Save filter functions
  const handleSaveFilter = () => {
    if (!newFilterName.trim() || activeFilters.length === 0) {
      toast.error("Por favor selecione um filtro antes de guardar");
      return;
    }
    
    if (savedFilters.length >= 5) {
      toast.error("Máximo de 5 filtros guardados. Elimine um para adicionar outro.");
      return;
    }
    
    saveFilterMutation.mutate({
      name: newFilterName.trim(),
      conditions: [...activeFilters],
    });
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    const conditions = filter.conditions || [];
    setActiveFilters([...conditions]);
    setCurrentFilterColumn("");
    toast.success(`Filtro "${filter.name}" aplicado`);
  };

  const deleteSavedFilter = (filterId: string) => {
    deleteFilterMutation.mutate(filterId);
  };

  // Add or update a filter condition
  const addOrUpdateFilter = (column: string, values: string[], mode: 'include' | 'exclude') => {
    setActiveFilters(prev => {
      const existing = prev.findIndex(f => f.column === column);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { column, values, mode };
        return updated;
      }
      return [...prev, { column, values, mode }];
    });
  };

  // Remove a filter condition
  const removeFilter = (column: string) => {
    setActiveFilters(prev => prev.filter(f => f.column !== column));
  };

  // Get current filter for a column
  const getFilterForColumn = (column: string) => {
    return activeFilters.find(f => f.column === column);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
    setCurrentFilterColumn("");
  };

  // Fetch workflow files with company info
  const { data: workflowFiles, isLoading } = useQuery({
    queryKey: ["workflow-files"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("workflow_files")
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as WorkflowFile[];
    },
  });

  // Fetch transactions linked to workflow files (by invoice_file_url)
  const { data: linkedTransactions } = useQuery({
    queryKey: ["workflow-linked-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select(`
          id,
          invoice_file_url,
          total_amount,
          project_id,
          company_id,
          expense_projects:project_id (
            id,
            name
          ),
          companies:company_id (
            id,
            name
          )
        `)
        .not("invoice_file_url", "is", null);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all projects for dropdown
  const { data: allProjects } = useQuery({
    queryKey: ["expense-projects-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch storage locations for mark as complete
  const { data: storageLocations } = useQuery({
    queryKey: ["workflow-storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_storage_locations")
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch companies for mark as complete
  const { data: allCompanies } = useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch folders for selected company in move file dialog
  const { data: moveFolders } = useQuery({
    queryKey: ["company-folders-for-move", moveForm.company_id],
    queryFn: async () => {
      if (!moveForm.company_id) return [];
      const { data, error } = await supabase
        .from("company_folders")
        .select("*")
        .eq("company_id", moveForm.company_id)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!moveForm.company_id,
  });

  // Build folder paths recursively for move dialog
  const getMoveFolderPath = (folderId: string, folders: any[]): string => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return "";
    if (!folder.parent_folder_id) return folder.name;
    const parentPath = getMoveFolderPath(folder.parent_folder_id, folders);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  };

  const moveFolderOptions = moveFolders?.map(folder => ({
    id: folder.id,
    name: folder.name,
    path: getMoveFolderPath(folder.id, moveFolders || [])
  })).sort((a, b) => a.path.localeCompare(b.path)) || [];

  // Create lookup map for transactions by file_url
  const transactionsByFileUrl = linkedTransactions?.reduce((acc, tx) => {
    if (tx.invoice_file_url) {
      acc[tx.invoice_file_url] = {
        transactionId: tx.id,
        projectId: tx.project_id,
        projectName: (tx.expense_projects as any)?.name || null,
        companyId: tx.company_id,
        companyName: (tx.companies as any)?.name || null,
        value: tx.total_amount,
      };
    }
    return acc;
  }, {} as Record<string, { transactionId: string; projectId: string | null; projectName: string | null; companyId: string | null; companyName: string | null; value: number }>);

  // State for inline editing
  const [editingCell, setEditingCell] = useState<{ fileUrl: string; field: 'project' | 'value' } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Mutation to update transaction
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, updates }: { transactionId: string; updates: { project_id?: string | null; total_amount?: number } }) => {
      const { error } = await supabase
        .from("financial_transactions")
        .update(updates)
        .eq("id", transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-linked-transactions"] });
      setEditingCell(null);
      toast.success("Updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Mutation to create transaction with project for unlinked files
  const createTransactionForFileMutation = useMutation({
    mutationFn: async ({ fileUrl, projectId }: { fileUrl: string; projectId: string }) => {
      // Read table relations settings
      const settingsStr = localStorage.getItem(TABLE_RELATIONS_KEY);
      const settings: TableRelationsConfig = settingsStr 
        ? JSON.parse(settingsStr) 
        : { defaultCompanyId: null, autoCreateTransaction: true, linkWorkflowToFinance: true };
      
      // If auto-create transaction is disabled, just skip silently
      if (!settings.autoCreateTransaction) {
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use default company from settings, or fall back to first available
      let companyId = settings.defaultCompanyId;
      
      if (!companyId) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id")
          .limit(1);

        if (!companies || companies.length === 0) {
          throw new Error("No company found. Please configure a default company in Settings.");
        }
        companyId = companies[0].id;
      }

      // Update existing transaction with project_id if it exists
      const { data: existingTx } = await supabase
        .from("financial_transactions")
        .select("id")
        .eq("invoice_file_url", fileUrl)
        .maybeSingle();

      if (existingTx) {
        const { error } = await supabase
          .from("financial_transactions")
          .update({ project_id: projectId })
          .eq("id", existingTx.id);
        
        if (error) throw error;
      }
      // If no transaction exists yet, project will be assigned when payment is created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-linked-transactions"] });
      toast.success("Project assigned");
    },
    onError: (error) => {
      toast.error("Failed to assign project: " + error.message);
    },
  });

  // Move file to company folder mutation
  const moveFileMutation = useMutation({
    mutationFn: async ({ file, companyId, folderId }: { file: WorkflowFile; companyId: string; folderId: string | null }) => {
      // 1. Download the file from attachments bucket
      const url = new URL(file.file_url);
      const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      
      if (!match) {
        throw new Error("Invalid file URL format");
      }
      
      const [, bucket, encodedPath] = match;
      const filePath = decodeURIComponent(encodedPath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(filePath);
      
      if (downloadError) throw downloadError;
      
      // 2. Upload to company-documents bucket
      const newPath = `${companyId}/${folderId || 'root'}/${Date.now()}-${sanitizeFileName(file.file_name)}`;
      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(newPath, fileData);
      
      if (uploadError) throw uploadError;
      
      // 3. Get the public URL of the new file
      const { data: { publicUrl } } = supabase.storage
        .from("company-documents")
        .getPublicUrl(newPath);
      
      // 4. Create document record in company_documents
      const { error: insertError } = await supabase
        .from("company_documents")
        .insert({
          company_id: companyId,
          folder_id: folderId,
          name: file.file_name,
          file_url: publicUrl,
          file_size: file.file_size,
          mime_type: file.mime_type,
          status: "Final",
        });
      
      if (insertError) throw insertError;
      
      // 5. Delete the workflow file record
      const { error: deleteError } = await supabase
        .from("workflow_files")
        .delete()
        .eq("id", file.id);
      
      if (deleteError) throw deleteError;
      
      // 6. Optionally delete the old file from storage
      await supabase.storage.from(bucket).remove([filePath]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
      setMoveFileDialogOpen(false);
      setFileToMove(null);
      setMoveForm({ company_id: "", folder_id: null, folder_path: "" });
      toast.success("Ficheiro movido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao mover ficheiro: " + error.message);
    },
  });

  // Handler to open move dialog
  const handleOpenMoveDialog = (file: WorkflowFile) => {
    setFileToMove(file);
    setMoveForm({ company_id: "", folder_id: null, folder_path: "" });
    setMoveFileDialogOpen(true);
  };

  // Handler to execute move
  const handleMoveFile = () => {
    if (!fileToMove || !moveForm.company_id) {
      toast.error("Selecione uma empresa");
      return;
    }
    
    // If user selected __root__, pass null as folder_id
    const folderId = moveForm.folder_path === "__root__" ? null : moveForm.folder_id;
    
    moveFileMutation.mutate({
      file: fileToMove,
      companyId: moveForm.company_id,
      folderId: folderId,
    });
  };


  const uploadFiles = async (files: FileList | File[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileArray = Array.from(files);
    const initialProgress: UploadProgress[] = fileArray.map(f => ({
      fileName: f.name,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploadProgress(initialProgress);
    setIsUploading(true);

    const uploadedFiles: string[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const sanitizedName = sanitizeFileName(file.name);
      const storagePath = `${user.id}/${Date.now()}-${sanitizedName}`;
      
      try {
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 30 } : p
        ));

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(storagePath, file);
        
        if (uploadError) throw uploadError;

        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 70 } : p
        ));
        
        const { data: { publicUrl } } = supabase.storage
          .from("attachments")
          .getPublicUrl(storagePath);

        const { error: insertError } = await supabase
          .from("workflow_files")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            status: "Pending",
            priority: "normal",
          });
        
        if (insertError) throw insertError;
        
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, progress: 100, status: 'completed' } : p
        ));
        
        uploadedFiles.push(file.name);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'error' } : p
        ));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
    
    if (uploadedFiles.length > 0) {
      toast.success(`Uploaded ${uploadedFiles.length} file(s)`);
    }
    
    setTimeout(() => {
      setUploadProgress([]);
      setIsUploading(false);
    }, 3000);
  };

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("workflow_files")
        .update({ [field]: value })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workflow_files")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
      toast.success("File removed");
    },
  });

  // Mark file as completed handler
  const handleMarkAsComplete = async (file: WorkflowFile) => {
    // First, check if there's an existing transaction for this file to get actual expense date, company AND bank_account_id
    const { data: existingTransaction } = await supabase
      .from("financial_transactions")
      .select("date, company_id, bank_account_id, total_amount")
      .eq("invoice_file_url", file.file_url)
      .maybeSingle();

    // If no transaction or transaction has zero value, show confirmation dialog
    if (!existingTransaction || existingTransaction.total_amount === 0) {
      setFileToSkipPayment(file);
      setShowSkipPaymentConfirmation(true);
      return;
    }

    // Use transaction date if available, otherwise fall back to file upload date
    const dateToUse = existingTransaction?.date 
      ? new Date(existingTransaction.date) 
      : new Date(file.created_at);
    
    const fileMonth = dateToUse.getMonth() + 1; // 1-indexed
    const fileYear = dateToUse.getFullYear();

    // Read table relations settings
    const settingsStr = localStorage.getItem(TABLE_RELATIONS_KEY);
    const settings: TableRelationsConfig = settingsStr
      ? JSON.parse(settingsStr)
      : { defaultCompanyId: null, autoCreateTransaction: true, linkWorkflowToFinance: true };

    // Determine the company to use: transaction company > settings default company
    const targetCompanyId = existingTransaction?.company_id || settings.defaultCompanyId;

    // Query storage locations filtering by company if available
    let query = supabase
      .from("workflow_storage_locations")
      .select("*")
      .eq("year", fileYear)
      .eq("month", fileMonth);
    
    // If we have a target company, filter by it
    if (targetCompanyId) {
      query = query.eq("company_id", targetCompanyId);
    }

    const { data: matchingLocations, error } = await query;

    if (error) throw error;

    // Get the first matching location (should be unique per company+month+year)
    const matchingLocation = matchingLocations && matchingLocations.length > 0 
      ? matchingLocations[0] 
      : null;

    if (!matchingLocation) {
      // Fetch company name for the warning message
      let companyName = "Unknown Company";
      if (targetCompanyId) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", targetCompanyId)
          .maybeSingle();
        if (companyData?.name) {
          companyName = companyData.name;
        }
      }
      setMissingStorageCompanyName(companyName);
      setFileToComplete(file);
      setMarkCompleteWarningOpen(true);
      return;
    }

    // Find the company that owns the bank account used for payment (for dual-company copy)
    let paymentAccountStorageLocation = null;
    if (existingTransaction?.bank_account_id) {
      // Get the company_id from the bank account
      const { data: bankAccount } = await supabase
        .from("bank_accounts")
        .select("company_id")
        .eq("id", existingTransaction.bank_account_id)
        .maybeSingle();
      
      // If the bank account owner is different from the invoice company
      if (bankAccount?.company_id && bankAccount.company_id !== targetCompanyId) {
        // Find storage location for the bank account owner's company
        const { data: bankAccountOwnerLocation } = await supabase
          .from("workflow_storage_locations")
          .select("*")
          .eq("company_id", bankAccount.company_id)
          .eq("year", fileYear)
          .eq("month", fileMonth)
          .maybeSingle();
        
        if (bankAccountOwnerLocation) {
          paymentAccountStorageLocation = bankAccountOwnerLocation;
        }
      }
    }

    // Proceed with completion (passing both storage locations)
    await completeFile(file, matchingLocation, settings, paymentAccountStorageLocation);
  };

  const completeFile = async (
    file: WorkflowFile, 
    storageLocation: any, 
    settings: TableRelationsConfig,
    supplierStorageLocation?: any
  ) => {
    setIsCompleting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const companyId = storageLocation.company_id;

      // Check if there's a pending loan for this file
      const pendingLoanStr = customData[file.id]?._pendingLoan;
      let loanAttachmentUrl: string | null = null;

      // If there's a pending loan, create it now
      if (pendingLoanStr) {
        const loanData = JSON.parse(pendingLoanStr);
        
        // First, copy file to loans folder
        try {
          const response = await fetch(file.file_url);
          if (response.ok) {
            const blob = await response.blob();
            
            // Generate clean filename for loans folder
            const lendingName = (loanData.lending_company_name || 'Empresa').replace(/[^\w]/g, '_');
            const borrowingName = (loanData.borrowing_company_name || 'Empresa').replace(/[^\w]/g, '_');
            const loanDate = new Date(loanData.start_date);
            const formattedDate = `${String(loanDate.getDate()).padStart(2, '0')}-${String(loanDate.getMonth() + 1).padStart(2, '0')}-${loanDate.getFullYear()}`;
            const amount = Math.round(loanData.amount || 0);
            const fileExt = file.file_name?.split('.').pop() || 'pdf';
            const safeId = crypto.randomUUID().substring(0, 8);
            const newFileName = `${safeId}_${borrowingName}_${formattedDate}_${amount}_${lendingName}.${fileExt}`;
            
            // Upload to loans folder
            const { error: uploadError } = await supabase.storage
              .from('attachments')
              .upload(`loans/${newFileName}`, blob, {
                contentType: file.mime_type || 'application/pdf',
                upsert: true
              });
            
            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(`loans/${newFileName}`);
              loanAttachmentUrl = urlData.publicUrl;
            }
          }
        } catch (copyError) {
          console.error('Error copying file to loans folder:', copyError);
        }

        // Create the loan record
        const { data: newLoan, error: loanError } = await supabase
          .from("company_loans")
          .insert({
            lending_company_id: loanData.lending_company_id,
            borrowing_company_id: loanData.borrowing_company_id,
            amount: loanData.amount,
            interest_rate: loanData.interest_rate || 0,
            monthly_payment: loanData.monthly_payment || null,
            start_date: loanData.start_date,
            end_date: loanData.end_date || null,
            status: loanData.status || "active",
            description: loanData.description,
            attachment_url: loanAttachmentUrl || file.file_url,
            source_file_id: file.id,
          })
          .select()
          .single();

        if (loanError) {
          console.error('Error creating loan:', loanError);
          throw loanError;
        }

        // Get storage locations for both companies based on loan date
        const loanDate = new Date(loanData.start_date);
        const loanMonth = loanDate.getMonth() + 1;
        const loanYear = loanDate.getFullYear();

        // Fetch folder_id for lending company
        const { data: lendingStorageLocation } = await supabase
          .from("workflow_storage_locations")
          .select("folder_id")
          .eq("company_id", loanData.lending_company_id)
          .eq("year", loanYear)
          .eq("month", loanMonth)
          .maybeSingle();

        // Fetch folder_id for borrowing company
        const { data: borrowingStorageLocation } = await supabase
          .from("workflow_storage_locations")
          .select("folder_id")
          .eq("company_id", loanData.borrowing_company_id)
          .eq("year", loanYear)
          .eq("month", loanMonth)
          .maybeSingle();

        // Create document record for LENDING company
        await supabase.from("company_documents").insert({
          company_id: loanData.lending_company_id,
          folder_id: lendingStorageLocation?.folder_id || null,
          name: file.file_name,
          file_url: loanAttachmentUrl || file.file_url,
          document_type: "Loan",
          status: "Final",
          uploaded_by: user.id,
          notes: `Empréstimo para ${loanData.borrowing_company_name || "empresa"}`,
          mime_type: file.mime_type || "application/pdf",
        });

        // Create document record for BORROWING company
        await supabase.from("company_documents").insert({
          company_id: loanData.borrowing_company_id,
          folder_id: borrowingStorageLocation?.folder_id || null,
          name: file.file_name,
          file_url: loanAttachmentUrl || file.file_url,
          document_type: "Loan",
          status: "Final",
          uploaded_by: user.id,
          notes: `Empréstimo de ${loanData.lending_company_name || "empresa"}`,
          mime_type: file.mime_type || "application/pdf",
        });

        // Clear pending loan from customData
        setCustomData(prev => {
          const updated = { ...prev };
          if (updated[file.id]) {
            delete updated[file.id]._pendingLoan;
            // If no other data, remove the file entry entirely
            if (Object.keys(updated[file.id]).length === 0) {
              delete updated[file.id];
            }
          }
          return updated;
        });

        // Invalidate loan queries
        queryClient.invalidateQueries({ queryKey: ["company-loans"] });
        
        toast.success("Empréstimo registado com sucesso!");
      }

      // Helper function to copy file to a company's folder
      const copyToCompanyFolder = async (targetStorageLocation: any) => {
        if (!targetStorageLocation?.folder_id) return false;
        
        const targetCompanyId = targetStorageLocation.company_id;
        
        // Fetch the file blob from storage
        const url = new URL(file.file_url);
        const pathParts = url.pathname.split('/storage/v1/object/public/');
        
        if (pathParts.length > 1) {
          const [bucket, ...fileParts] = pathParts[1].split('/');
          const filePath = fileParts.join('/');
          
          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (downloadError) {
            console.error("Download error:", downloadError);
            return false;
          }
          
          if (fileData) {
            // Upload to company-documents bucket
            const sanitizedName = sanitizeFileName(file.file_name);
            const newPath = `${targetCompanyId}/${targetStorageLocation.folder_id}/${Date.now()}-${sanitizedName}`;
            
            const { error: uploadError } = await supabase.storage
              .from("company-documents")
              .upload(newPath, fileData);
            
            if (uploadError) {
              console.error("Upload to company docs error:", uploadError);
              return false;
            }
            
            // Get public URL and insert company document record
            const { data: { publicUrl } } = supabase.storage
              .from("company-documents")
              .getPublicUrl(newPath);
            
            // Get category from customData (workflow column values)
            const workflowCategory = customData[file.id]?.category;
            
            const { error: docError } = await supabase
              .from("company_documents")
              .insert({
                company_id: targetCompanyId,
                folder_id: targetStorageLocation.folder_id,
                name: file.file_name,
                file_url: publicUrl,
                file_size: file.file_size,
                mime_type: file.mime_type,
                uploaded_by: user.id,
                status: 'Final',
                document_type: workflowCategory || 'Other',
              });
            
            if (docError) {
              console.error("Company document insert error:", docError);
              return false;
            }
            
            return true;
          }
        }
        return false;
      };

      // 2. Copy file to primary company documents
      let copiedCount = 0;
      if (storageLocation.folder_id) {
        const copied = await copyToCompanyFolder(storageLocation);
        if (copied) copiedCount++;
      }

      // 3. Copy file to supplier company documents (if available and different)
      if (supplierStorageLocation && supplierStorageLocation.company_id !== storageLocation.company_id) {
        const copied = await copyToCompanyFolder(supplierStorageLocation);
        if (copied) copiedCount++;
      }

      // 4. Delete workflow file from storage and database
      const url = new URL(file.file_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/');
      
      if (pathParts.length > 1) {
        const [bucket, ...fileParts] = pathParts[1].split('/');
        const filePath = fileParts.join('/');
        
        // Delete from storage
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
      }

      // Delete workflow file record
      const { error: deleteError } = await supabase
        .from("workflow_files")
        .delete()
        .eq("id", file.id);
      
      if (deleteError) throw deleteError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-linked-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["company-documents"] });

      if (copiedCount > 1) {
        toast.success(`Ficheiro copiado para ${copiedCount} empresas!`);
      } else {
        toast.success("Ficheiro movido para documentos da empresa!");
      }
    } catch (error: any) {
      console.error("Error completing file:", error);
      toast.error("Failed to complete file: " + error.message);
    } finally {
      setIsCompleting(false);
      setFileToComplete(null);
      setMissingStorageCompanyName(null);
      setMarkCompleteWarningOpen(false);
    }
  };

  // Handle completing file without payment registration
  const handleCompleteWithoutPayment = async () => {
    if (!fileToSkipPayment) return;
    
    const file = fileToSkipPayment;
    setShowSkipPaymentConfirmation(false);
    setFileToSkipPayment(null);
    
    // Use file date for storage location lookup
    const dateToUse = new Date(file.created_at);
    const fileMonth = dateToUse.getMonth() + 1;
    const fileYear = dateToUse.getFullYear();

    // Read table relations settings
    const settingsStr = localStorage.getItem(TABLE_RELATIONS_KEY);
    const settings: TableRelationsConfig = settingsStr
      ? JSON.parse(settingsStr)
      : { defaultCompanyId: null, autoCreateTransaction: true, linkWorkflowToFinance: true };

    const targetCompanyId = settings.defaultCompanyId;

    // Query storage locations
    let query = supabase
      .from("workflow_storage_locations")
      .select("*")
      .eq("year", fileYear)
      .eq("month", fileMonth);
    
    if (targetCompanyId) {
      query = query.eq("company_id", targetCompanyId);
    }

    const { data: matchingLocations, error } = await query;

    if (error) {
      toast.error("Erro ao procurar localização de armazenamento");
      return;
    }

    const matchingLocation = matchingLocations && matchingLocations.length > 0 
      ? matchingLocations[0] 
      : null;

    if (!matchingLocation) {
      let companyName = "Unknown Company";
      if (targetCompanyId) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", targetCompanyId)
          .maybeSingle();
        if (companyData?.name) {
          companyName = companyData.name;
        }
      }
      setMissingStorageCompanyName(companyName);
      setFileToComplete(file);
      setMarkCompleteWarningOpen(true);
      return;
    }

    // Complete without looking for payment account storage
    await completeFile(file, matchingLocation, settings);
    toast.success("Ficheiro movido sem registo financeiro");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await uploadFiles(files);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    await uploadFiles(Array.from(files));
  }, []);

  // Column resize limits
  const COLUMN_LIMITS: Record<string, { min: number; max: number }> = {
    name: { min: 80, max: 800 },
    type: { min: 50, max: 120 },
    date: { min: 80, max: 200 },
    category: { min: 80, max: 200 },
    status: { min: 80, max: 200 },
    size: { min: 60, max: 120 },
    empresa: { min: 80, max: 300 },
    project: { min: 80, max: 300 },
    value: { min: 70, max: 150 },
  };

  // Resize handlers for columns
  const handleColumnResizeStart = useCallback((e: React.MouseEvent, columnId: string, defaultWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnId] ?? defaultWidth;
    // Global cursor lock during resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  useEffect(() => {
    if (!resizingColumn) return;
    
    const limits = COLUMN_LIMITS[resizingColumn] || { min: 80, max: 800 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(limits.min, Math.min(limits.max, resizeStartWidth.current + delta));
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    };
    
    const handleMouseUp = () => {
      setColumnWidths(prev => {
        localStorage.setItem("workflow-column-widths", JSON.stringify(prev));
        return prev;
      });
      setResizingColumn(null);
      // Clear global cursor lock
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn]);
  
  // Helper to get column width
  const getColumnWidth = (columnId: string, defaultWidth: number) => columnWidths[columnId] ?? defaultWidth;

  const handleDownload = async (file: WorkflowFile) => {
    try {
      const url = new URL(file.file_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/');
      if (pathParts.length > 1) {
        const [bucket, ...fileParts] = pathParts[1].split('/');
        const filePath = fileParts.join('/');
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filePath);
        
        if (error) throw error;
        
        const blobUrl = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Download error:', error);
      window.open(file.file_url, '_blank');
    }
  };

  const filteredFiles = useMemo(() => workflowFiles?.filter(file => {
    // Search filter
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Multiple filter conditions (AND logic)
    let matchesAllFilters = true;
    for (const filter of activeFilters) {
      let fileValue: string | undefined;
      
      // Special handling for empresa filter (prefer direct company_id, fallback to transaction)
      if (filter.column === 'empresa') {
        fileValue = file.companies?.name || transactionsByFileUrl?.[file.file_url]?.companyName || '';
      } else {
        const col = columns.find(c => c.id === filter.column);
        if (col) {
          fileValue = col.isBuiltIn && col.dbField 
            ? (file as any)[col.dbField] 
            : customData[file.id]?.[filter.column];
        }
      }
      
      const isMatch = filter.values.includes(fileValue || '');
      const passesFilter = filter.mode === 'include' ? isMatch : !isMatch;
      
      if (!passesFilter) {
        matchesAllFilters = false;
        break;
      }
    }
    
    return matchesSearch && matchesAllFilters;
  })?.sort((a, b) => {
    const { column, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    
    let aValue: any;
    let bValue: any;
    
    switch (column) {
      case 'name':
        aValue = a.file_name.toLowerCase();
        bValue = b.file_name.toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'size':
        aValue = a.file_size || 0;
        bValue = b.file_size || 0;
        break;
      case 'type':
        aValue = getFileExtension(a.file_name);
        bValue = getFileExtension(b.file_name);
        break;
      case 'category':
        aValue = a.category || '';
        bValue = b.category || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'project':
        aValue = transactionsByFileUrl?.[a.file_url]?.projectName || '';
        bValue = transactionsByFileUrl?.[b.file_url]?.projectName || '';
        break;
      case 'empresa':
        aValue = a.companies?.name || transactionsByFileUrl?.[a.file_url]?.companyName || '';
        bValue = b.companies?.name || transactionsByFileUrl?.[b.file_url]?.companyName || '';
        break;
      case 'value':
        aValue = transactionsByFileUrl?.[a.file_url]?.value || 0;
        bValue = transactionsByFileUrl?.[b.file_url]?.value || 0;
        break;
      default:
        // For custom columns
        aValue = customData[a.id]?.[column] || '';
        bValue = customData[b.id]?.[column] || '';
    }
    
    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  }), [workflowFiles, searchQuery, activeFilters, transactionsByFileUrl, columns, customData, sortConfig]);

  // Sort handler
  const handleSort = (columnId: string) => {
    setSortConfig(prev => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Keyboard navigation for file list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // If dropdown menu is open, don't handle arrow navigation
      // (let the menu handle its own keyboard navigation)
      if (openMenuFileId && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        return;
      }
      
      if (!filteredFiles || filteredFiles.length === 0) return;
      
      const currentIndex = focusedFileId 
        ? filteredFiles.findIndex(f => f.id === focusedFileId)
        : -1;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredFiles.length - 1) {
            const nextFile = filteredFiles[currentIndex + 1];
            setFocusedFileId(nextFile.id);
            // Scroll row into view - preserve horizontal scroll position
            const container = document.querySelector('[data-workflow-table-container]') as HTMLElement;
            const prevScrollLeft = container?.scrollLeft ?? 0;
            const row = document.querySelector(`[data-file-id="${nextFile.id}"]`);
            row?.scrollIntoView({ block: 'nearest' });
            if (container) {
              requestAnimationFrame(() => { container.scrollLeft = prevScrollLeft; });
            }
          } else if (currentIndex === -1 && filteredFiles.length > 0) {
            const firstFile = filteredFiles[0];
            setFocusedFileId(firstFile.id);
            const container = document.querySelector('[data-workflow-table-container]') as HTMLElement;
            const prevScrollLeft = container?.scrollLeft ?? 0;
            const row = document.querySelector(`[data-file-id="${firstFile.id}"]`);
            row?.scrollIntoView({ block: 'nearest' });
            if (container) {
              requestAnimationFrame(() => { container.scrollLeft = prevScrollLeft; });
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevFile = filteredFiles[currentIndex - 1];
            setFocusedFileId(prevFile.id);
            // Scroll row into view - preserve horizontal scroll position
            const container = document.querySelector('[data-workflow-table-container]') as HTMLElement;
            const prevScrollLeft = container?.scrollLeft ?? 0;
            const row = document.querySelector(`[data-file-id="${prevFile.id}"]`);
            row?.scrollIntoView({ block: 'nearest' });
            if (container) {
              requestAnimationFrame(() => { container.scrollLeft = prevScrollLeft; });
            }
          }
          break;
        case 'Enter':
          if (focusedFileId) {
            const file = filteredFiles.find(f => f.id === focusedFileId);
            if (file) {
              if (showExpensePanel) {
                toast.warning("Feche o painel 'Novo Movimento' antes de abrir outro ficheiro");
                break;
              }
              setPreviewFile(file);
            }
          }
          break;
        case 'Escape':
          setFocusedFileId(null);
          break;
        case 'n':
        case 'N':
          // Open new movement panel when viewing a document
          if (previewFile) {
            e.preventDefault();
            setShowExpensePanel(true);
          }
          break;
        case 'e':
        case 'E':
          // Open action menu for focused file - always prevent default to avoid scrolling
          e.preventDefault();
          {
            // Determine target file: focused > single selected > first visible
            let targetId = focusedFileId;
            if (!targetId && selectedFiles.size === 1) {
              targetId = Array.from(selectedFiles)[0];
            }
            if (!targetId && filteredFiles.length > 0) {
              targetId = filteredFiles[0].id;
            }
            if (targetId) {
              setFocusedFileId(targetId);
              // Open menu directly - Radix portal handles positioning
              setOpenMenuFileId(targetId);
            }
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredFiles, focusedFileId, previewFile, openMenuFileId, selectedFiles]);

  // Bulk actions
  const handleBulkDownload = async () => {
    const filesToDownload = workflowFiles?.filter(f => selectedFiles.has(f.id)) || [];
    for (const file of filesToDownload) {
      await handleDownload(file);
    }
    toast.success(`Downloaded ${filesToDownload.length} files`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedFiles.size} files?`)) return;
    
    for (const id of selectedFiles) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedFiles(new Set());
    toast.success(`Deleted ${selectedFiles.size} files`);
  };

  // Get unique company names from workflow files and transactions for empresa filter
  const uniqueCompanyOptions = (): ColumnOption[] => {
    const companyNames = new Set<string>();
    // Add company names from direct company_id relationship
    workflowFiles?.forEach(file => {
      if (file.companies?.name) companyNames.add(file.companies.name);
    });
    // Also add from transactions for backwards compatibility
    if (transactionsByFileUrl) {
      Object.values(transactionsByFileUrl).forEach(tx => {
        if (tx.companyName) companyNames.add(tx.companyName);
      });
    }
    return Array.from(companyNames).map(name => ({ label: name, color: "#3b82f6" }));
  };

  const getFilterableColumns = () => {
    const filterableCols = columns.filter(c => c.options && c.options.length > 0);
    // Add empresa as a special filterable column with dynamic options
    const empresaOptions = uniqueCompanyOptions();
    if (empresaOptions.length > 0) {
      filterableCols.push({ id: 'empresa', label: 'Empresa', visible: true, options: empresaOptions });
    }
    return filterableCols;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isColumnVisible = (id: string) => columns.find(c => c.id === id)?.visible ?? true;

  const toggleColumnVisibility = (id: string) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const getColumnValue = (file: WorkflowFile, column: ColumnConfig) => {
    if (column.isBuiltIn && column.dbField) {
      return (file as any)[column.dbField] || null;
    }
    return customData[file.id]?.[column.id] || null;
  };

  const renderCellDropdown = (file: WorkflowFile, column: ColumnConfig) => {
    const value = getColumnValue(file, column);
    const options = column.options;
    const option = options?.find(o => o.label === value);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer hover:opacity-80 transition-opacity">
            {value ? (
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: option?.color ? `${option.color}20` : '#e5e7eb',
                  color: option?.color || '#374151',
                  borderColor: option?.color ? `${option.color}40` : '#d1d5db',
                  borderWidth: '1px'
                }}
              >
                {value}
              </span>
            ) : (
              <span className="text-slate-400 text-xs">—</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="bg-white z-50">
          {options?.map((opt) => (
            <DropdownMenuItem
              key={opt.label}
              className="flex justify-center"
              onClick={() => {
                const filesToUpdate = selectedFiles.has(file.id) && selectedFiles.size > 1
                  ? Array.from(selectedFiles)
                  : [file.id];
                
                if (column.isBuiltIn && column.dbField) {
                  filesToUpdate.forEach(fileId => {
                    updateFieldMutation.mutate({ id: fileId, field: column.dbField!, value: opt.label });
                  });
                } else {
                  setCustomData(prev => {
                    const updated = { ...prev };
                    filesToUpdate.forEach(fileId => {
                      updated[fileId] = { ...updated[fileId], [column.id]: opt.label };
                    });
                    return updated;
                  });
                }
              }}
            >
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  backgroundColor: `${opt.color}20`,
                  color: opt.color,
                }}
              >
                {opt.label}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderColumnHeader = (column: ColumnConfig, isCustom = false) => {
    const canEdit = column.options && column.options.length > 0;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors text-left w-full">
            {column.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {canEdit && (
            <DropdownMenuItem onClick={() => openEditColumnDialog(column)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Column
            </DropdownMenuItem>
          )}
          {isCustom && (
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => deleteColumn(column.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Column management functions
  const addNewColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newCol: ColumnConfig = {
      id: `custom-${Date.now()}`,
      label: newColumnName.trim(),
      visible: true,
      options: newColumnOptions.length > 0 ? newColumnOptions : [{ label: "Option 1", color: COLOR_PALETTE[0] }],
    };
    
    setCustomColumns([...customColumns, newCol]);
    setNewColumnName("");
    setNewColumnOptions([]);
    setAddColumnDialogOpen(false);
    toast.success("Column added");
  };

  const deleteColumn = (columnId: string) => {
    if (confirm("Delete this column?")) {
      setCustomColumns(customColumns.filter(c => c.id !== columnId));
      toast.success("Column deleted");
    }
  };

  const openEditColumnDialog = (column: ColumnConfig) => {
    setEditingColumn({ ...column, options: column.options ? [...column.options] : [] });
    setEditColumnDialogOpen(true);
  };

  const saveColumnEdits = () => {
    if (!editingColumn) return;
    
    if (editingColumn.isBuiltIn) {
      setColumns(columns.map(c => c.id === editingColumn.id ? editingColumn : c));
      // Save to Supabase for built-in columns (category, status)
      if (editingColumn.options && editingColumn.options.length > 0) {
        saveColumnConfigMutation.mutate({
          columnId: editingColumn.id,
          options: editingColumn.options,
        });
      }
    } else {
      setCustomColumns(customColumns.map(c => c.id === editingColumn.id ? editingColumn : c));
    }
    
    setEditColumnDialogOpen(false);
    setEditingColumn(null);
    toast.success("Column updated");
  };

  const addOption = () => {
    if (editingColumn) {
      const newOptions = [...(editingColumn.options || []), { 
        label: `Option ${(editingColumn.options?.length || 0) + 1}`, 
        color: COLOR_PALETTE[(editingColumn.options?.length || 0) % COLOR_PALETTE.length] 
      }];
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const removeOption = (index: number) => {
    if (editingColumn?.options) {
      const newOptions = editingColumn.options.filter((_, i) => i !== index);
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const updateOptionColor = (index: number, color: string) => {
    if (editingColumn?.options) {
      const newOptions = [...editingColumn.options];
      newOptions[index] = { ...newOptions[index], color };
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const updateOptionLabel = (index: number, label: string) => {
    if (editingColumn?.options) {
      const newOptions = [...editingColumn.options];
      newOptions[index] = { ...newOptions[index], label };
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles?.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles?.map(f => f.id) || []));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFiles(newSelected);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          multiple
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
        
        {/* Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs px-2 flex-shrink-0">
              <Columns className="h-3 w-3" />
              Columns
              <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {columns.filter(col => !col.required).map((col) => (
              <DropdownMenuItem
                key={col.id}
                onClick={(e) => {
                  e.preventDefault();
                  toggleColumnVisibility(col.id);
                }}
                className="flex items-center gap-2"
              >
                <Checkbox 
                  checked={col.visible}
                  onCheckedChange={() => toggleColumnVisibility(col.id)}
                />
                <span>{col.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Active Filters Button - only show when filters are active */}
        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => {
              setActiveFilters([]);
              setCurrentFilterColumn("");
              toast.success("Filtros limpos");
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* Preset Filters - Only show if not deleted */}
        {DEFAULT_PRESET_FILTERS
          .filter(filter => !deletedPresetIds.includes(filter.id))
          .map(filter => {
            const conditions = filter.conditions || [];
            const isActive = conditions.length > 0 && conditions.length === activeFilters.length &&
              conditions.every(fc => 
                activeFilters.some(af => 
                  af.column === fc.column && 
                  af.values.length === fc.values.length &&
                  af.values.every(v => fc.values.includes(v))
                )
              );
            return (
              <ContextMenu key={filter.id}>
                <ContextMenuTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1 h-7 text-xs px-2",
                      isActive && "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                    onClick={() => loadSavedFilter(filter)}
                  >
                    <Bookmark className="h-3 w-3" />
                    {filter.name}
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      const newDeletedIds = [...deletedPresetIds, filter.id];
                      setDeletedPresetIds(newDeletedIds);
                      localStorage.setItem("workflow-deleted-preset-filters", JSON.stringify(newDeletedIds));
                      toast.success(`Filtro "${filter.name}" eliminado`);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar filtro
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

        {/* User Saved Filters - Quick Access Buttons (show all user-saved filters) */}
        {savedFilters.map(filter => {
            // Check if this saved filter matches current active filters
            const conditions = filter.conditions || [];
            const isActive = conditions.length > 0 && conditions.length === activeFilters.length &&
              conditions.every(fc => 
                activeFilters.some(af => 
                  af.column === fc.column && 
                  af.values.length === fc.values.length &&
                  af.values.every(v => fc.values.includes(v))
                )
              );
            return (
              <ContextMenu key={filter.id}>
                <ContextMenuTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1 h-7 text-xs px-2",
                      isActive && "bg-blue-50 border-blue-200 text-blue-700"
                    )}
                    onClick={() => loadSavedFilter(filter)}
                  >
                    <Bookmark className="h-3 w-3" />
                    {filter.name}
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteSavedFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar filtro
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

        {/* Bulk Actions - shown when files selected */}
        {selectedFiles.size > 0 && (
          <>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleBulkDownload}
            >
              <Download className="h-4 w-4" />
              Download ({selectedFiles.size})
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedFiles.size})
            </Button>
          </>
        )}
        
        <div className="flex-1" />
        
        {/* Horizontal Filter Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Show active filters as badges */}
          {activeFilters.map(filter => {
            const col = getFilterableColumns().find(c => c.id === filter.column);
            return (
              <div key={filter.column} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
                <span className="text-xs text-blue-700 font-medium">{col?.label}:</span>
                <span className="text-xs text-blue-600">
                  {filter.mode === 'exclude' && '!'}
                  {filter.values.join(', ')}
                </span>
                <button 
                  className="ml-1 text-blue-400 hover:text-blue-600"
                  onClick={() => removeFilter(filter.column)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          
          {/* Add filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="h-4 w-4" />
                {currentFilterColumn ? getFilterableColumns().find(c => c.id === currentFilterColumn)?.label : "Adicionar Filtro"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {activeFilters.length > 0 && (
                <>
                  <DropdownMenuItem onClick={clearAllFilters}>
                    Limpar todos filtros
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {getFilterableColumns()
                .filter(col => !activeFilters.some(f => f.column === col.id))
                .map(col => (
                  <DropdownMenuItem 
                    key={col.id} 
                    onClick={() => setCurrentFilterColumn(col.id)}
                  >
                    {col.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Filter mode toggle */}
          {currentFilterColumn && (
            <Button
              variant={(getFilterForColumn(currentFilterColumn)?.mode || 'include') === 'exclude' ? "destructive" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                const existing = getFilterForColumn(currentFilterColumn);
                const newMode = (existing?.mode || 'include') === 'include' ? 'exclude' : 'include';
                if (existing) {
                  addOrUpdateFilter(currentFilterColumn, existing.values, newMode);
                }
              }}
            >
              {(getFilterForColumn(currentFilterColumn)?.mode || 'include') === 'include' ? 'Incluir' : 'Excluir'}
            </Button>
          )}
          
          {/* Value selection dropdown */}
          {currentFilterColumn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  {(() => {
                    const vals = getFilterForColumn(currentFilterColumn)?.values || [];
                    return vals.length === 0 ? "Selecionar" : vals.length === 1 ? vals[0] : `${vals.length} selecionados`;
                  })()}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover min-w-[180px]">
                <DropdownMenuItem onClick={() => removeFilter(currentFilterColumn)}>
                  Limpar seleção
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {getFilterableColumns().find(c => c.id === currentFilterColumn)?.options?.map(opt => {
                  const currentFilter = getFilterForColumn(currentFilterColumn);
                  const isSelected = currentFilter?.values.includes(opt.label) || false;
                  return (
                    <DropdownMenuItem 
                      key={opt.label} 
                      onClick={(e) => {
                        e.preventDefault();
                        const current = currentFilter?.values || [];
                        const mode = currentFilter?.mode || 'include';
                        if (isSelected) {
                          const newValues = current.filter(v => v !== opt.label);
                          if (newValues.length === 0) {
                            removeFilter(currentFilterColumn);
                          } else {
                            addOrUpdateFilter(currentFilterColumn, newValues, mode);
                          }
                        } else {
                          addOrUpdateFilter(currentFilterColumn, [...current, opt.label], mode);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={isSelected} className="h-4 w-4" />
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                      >
                        {opt.label}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                {activeFilters.length > 0 && savedFilters.length < 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSaveFilterDialogOpen(true)}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar filtro atual
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Clear current filter column selection */}
          {currentFilterColumn && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setCurrentFilterColumn("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64 h-9"
          />
        </div>
      </div>

      {/* Files Table with Drag & Drop */}
      <div 
        data-workflow-table-container
        ref={tableContainerRef}
        tabIndex={0}
        className={`border rounded-lg bg-white shadow-sm overflow-auto max-h-[calc(100vh-280px)] transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
          isDragging ? "border-blue-500 border-2 bg-blue-50" : "border-slate-200"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          // Focus the table container when clicking anywhere on it
          tableContainerRef.current?.focus();
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 z-10 pointer-events-none">
            <div className="text-blue-600 font-medium flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Drop files here to upload
            </div>
          </div>
        )}
        <table className="w-full min-w-[1400px] table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <Checkbox 
                  checked={selectedFiles.size > 0 && selectedFiles.size === filteredFiles?.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th 
                className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                style={{ width: getColumnWidth('name', 400), minWidth: 80, maxWidth: 800 }}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  File
                  {sortConfig.column === 'name' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
                {/* Resize handle */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                  onMouseDown={(e) => handleColumnResizeStart(e, 'name', 400)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
              {isColumnVisible("type") && (
                <th 
                  className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('type', 64), minWidth: 50 }}
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Type
                    {sortConfig.column === 'type' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'type', 64)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("date") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('date', 112), minWidth: 80 }}
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortConfig.column === 'date' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'date', 112)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("category") && (
                <th 
                  className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs relative select-none"
                  style={{ width: getColumnWidth('category', 112), minWidth: 80 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="flex items-center justify-center gap-1 w-full hover:text-foreground transition-colors"
                      >
                        Category
                        {sortConfig.column === 'category' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort('category')}>
                        {sortConfig.column === 'category' && sortConfig.direction === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditColumnDialog(columns.find(c => c.id === 'category')!)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'category', 112)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("status") && (
                <th 
                  className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs relative select-none"
                  style={{ width: getColumnWidth('status', 112), minWidth: 80 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="flex items-center justify-center gap-1 w-full hover:text-foreground transition-colors"
                      >
                        Status
                        {sortConfig.column === 'status' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSort('status')}>
                        {sortConfig.column === 'status' && sortConfig.direction === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditColumnDialog(columns.find(c => c.id === 'status')!)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'status', 112)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("size") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('size', 80), minWidth: 60 }}
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center gap-1">
                    Size
                    {sortConfig.column === 'size' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'size', 80)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("empresa") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('empresa', 128), minWidth: 80 }}
                  onClick={() => handleSort('empresa')}
                >
                  <div className="flex items-center gap-1">
                    Empresa
                    {sortConfig.column === 'empresa' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'empresa', 128)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("project") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('project', 128), minWidth: 80 }}
                  onClick={() => handleSort('project')}
                >
                  <div className="flex items-center gap-1">
                    Project
                    {sortConfig.column === 'project' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'project', 128)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {isColumnVisible("value") && (
                <th 
                  className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100 relative select-none"
                  style={{ width: getColumnWidth('value', 96), minWidth: 70 }}
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Value
                    {sortConfig.column === 'value' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors z-10"
                    onMouseDown={(e) => handleColumnResizeStart(e, 'value', 96)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {/* Custom columns headers */}
              {customColumns.map((col) => (
                <th key={col.id} className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs w-28">
                  {renderColumnHeader(col, true)}
                </th>
              ))}
              {/* Add column button */}
              <th className="w-10 px-3 py-2.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setAddColumnDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </th>
              <th className="w-20 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-muted-foreground">
                  Loading files...
                </td>
              </tr>
            ) : filteredFiles?.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-slate-300" />
                    <span>No files found. Drag & drop files here or click Upload.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFiles?.map((file) => (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild>
                    <tr 
                      data-file-id={file.id}
                      tabIndex={0}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                        focusedFileId === file.id && "bg-blue-50 ring-1 ring-blue-200"
                      )}
                      onMouseDown={() => setFocusedFileId(file.id)}
                      onFocus={() => setFocusedFileId(file.id)}
                      onDoubleClick={() => {
                        if (showExpensePanel) {
                          toast.warning("Feche o painel 'Novo Movimento' antes de abrir outro ficheiro");
                          return;
                        }
                        setPreviewFile(file);
                      }}
                    >
                      <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={() => toggleSelect(file.id)}
                        />
                      </td>
                      <td 
                        className="px-3 py-1.5" 
                        style={{ width: getColumnWidth('name', 400), minWidth: 80, maxWidth: 800 }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden min-w-0">
                          <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span 
                            className="text-xs font-medium text-blue-600 text-left truncate min-w-0 block" 
                            title={file.file_name}
                          >
                            {getFileNameWithoutExtension(file.file_name)}
                          </span>
                          {/* Pending loan indicator */}
                          {customData[file.id]?._pendingLoan && (
                            <Badge 
                              variant="outline" 
                              className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300 flex-shrink-0"
                              title="Empréstimo pendente - será registado ao confirmar envio"
                            >
                              Empréstimo
                            </Badge>
                          )}
                        </div>
                      </td>
                      {isColumnVisible("type") && (
                        <td className="px-3 py-1.5 text-center">
                          {(() => {
                            const ext = getFileExtension(file.file_name);
                            const style = getFileTypeBadgeStyle(ext);
                            return ext ? (
                              <Badge 
                                className="text-[10px] px-1.5 py-0 uppercase font-medium"
                                style={{ backgroundColor: style.bg, color: style.text }}
                              >
                                {ext}
                              </Badge>
                            ) : <span className="text-slate-400">—</span>;
                          })()}
                        </td>
                      )}
                      {isColumnVisible("date") && (
                        <td className="px-3 py-1.5 text-slate-600 text-sm whitespace-nowrap">
                          {format(new Date(file.created_at), "dd/MM/yyyy HH:mm")}
                        </td>
                      )}
                      {isColumnVisible("category") && (
                        <td className="px-3 py-1.5 text-center">
                          {renderCellDropdown(file, columns.find(c => c.id === "category")!)}
                        </td>
                      )}
                      {isColumnVisible("status") && (
                        <td className="px-3 py-1.5 text-center">
                          {renderCellDropdown(file, columns.find(c => c.id === "status")!)}
                        </td>
                      )}
                      {isColumnVisible("size") && (
                        <td className="px-3 py-1.5 text-slate-600 text-xs">
                          {formatFileSize(file.file_size)}
                        </td>
                      )}
                      {isColumnVisible("empresa") && (
                        <td className="px-3 py-1.5">
                          <span className="text-xs text-slate-600 whitespace-nowrap">
                            {file.companies?.name || transactionsByFileUrl?.[file.file_url]?.companyName || <span className="text-slate-400">—</span>}
                          </span>
                        </td>
                      )}
                      {isColumnVisible("project") && (
                        <td className="px-3 py-1.5">
                          {transactionsByFileUrl?.[file.file_url] ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-left text-xs text-slate-600 hover:text-foreground hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer whitespace-nowrap">
                                  {transactionsByFileUrl[file.file_url]?.projectName || <span className="text-slate-400">—</span>}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto bg-white z-50">
                                <DropdownMenuItem 
                                  className="flex justify-center"
                                  onClick={() => updateTransactionMutation.mutate({
                                    transactionId: transactionsByFileUrl[file.file_url].transactionId,
                                    updates: { project_id: null }
                                  })}
                                >
                                  <span className="text-slate-400">— None —</span>
                                </DropdownMenuItem>
                                {allProjects?.map((project) => (
                                  <DropdownMenuItem 
                                    key={project.id}
                                    className="flex justify-center"
                                    onClick={() => updateTransactionMutation.mutate({
                                      transactionId: transactionsByFileUrl[file.file_url].transactionId,
                                      updates: { project_id: project.id }
                                    })}
                                  >
                                    {project.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-left text-xs text-slate-400 hover:text-foreground hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer w-full truncate max-w-[120px]">
                                  —
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto bg-white z-50">
                                {allProjects?.map((project) => (
                                  <DropdownMenuItem 
                                    key={project.id}
                                    className="flex justify-center"
                                    onClick={() => createTransactionForFileMutation.mutate({
                                      fileUrl: file.file_url,
                                      projectId: project.id
                                    })}
                                  >
                                    {project.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      )}
                      {isColumnVisible("value") && (
                        <td className="px-3 py-1.5 text-right">
                          {transactionsByFileUrl?.[file.file_url] ? (
                            editingCell?.fileUrl === file.file_url && editingCell?.field === 'value' ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  const numValue = parseFloat(editValue);
                                  if (!isNaN(numValue)) {
                                    updateTransactionMutation.mutate({
                                      transactionId: transactionsByFileUrl[file.file_url].transactionId,
                                      updates: { total_amount: numValue }
                                    });
                                  } else {
                                    setEditingCell(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const numValue = parseFloat(editValue);
                                    if (!isNaN(numValue)) {
                                      updateTransactionMutation.mutate({
                                        transactionId: transactionsByFileUrl[file.file_url].transactionId,
                                        updates: { total_amount: numValue }
                                      });
                                    } else {
                                      setEditingCell(null);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="h-6 w-20 text-xs text-right"
                                autoFocus
                              />
                            ) : (
                              <button
                                className="text-xs font-medium hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer"
                                onClick={() => {
                                  setEditingCell({ fileUrl: file.file_url, field: 'value' });
                                  setEditValue(transactionsByFileUrl[file.file_url].value?.toString() || "0");
                                }}
                              >
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(transactionsByFileUrl[file.file_url].value)}
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      )}
                      {/* Custom columns */}
                      {customColumns.map((col) => (
                        <td key={col.id} className="px-3 py-1.5 text-center">
                          {renderCellDropdown(file, col)}
                        </td>
                      ))}
                      {/* Empty cell for add column button */}
                      <td className="px-3 py-1.5"></td>
                      <td className="px-3 py-1.5">
                        <DropdownMenu 
                          open={openMenuFileId === file.id}
                          onOpenChange={(open) => setOpenMenuFileId(open ? file.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button 
                              ref={(el) => { actionBtnRefs.current[file.id] = el; }}
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white z-50 shadow-md border">
                            <DropdownMenuItem onClick={() => handleMarkAsComplete(file)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFileToRename(file);
                              setNewFileName(file.file_name.replace(/\.[^/.]+$/, ''));
                              setRenameDialogOpen(true);
                            }}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMoveDialog(file)}>
                              <FolderInput className="h-4 w-4 mr-2" />
                              Mover para Pasta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(file.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleMarkAsComplete(file)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                      setFileToRename(file);
                      setNewFileName(file.file_name.replace(/\.[^/.]+$/, ''));
                      setRenameDialogOpen(true);
                    }}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Renomear
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleOpenMoveDialog(file)}>
                      <FolderInput className="h-4 w-4 mr-2" />
                      Mover para Pasta
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                      if (showExpensePanel) {
                        toast.warning("Feche o painel 'Novo Movimento' antes de abrir outro ficheiro");
                        return;
                      }
                      setPreviewFile(file);
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Preview
                    </ContextMenuItem>
                    <ContextMenuItem 
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(file.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <tr className="border-t border-slate-200 bg-slate-50 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
              <td colSpan={2} className="px-3 py-2 text-xs text-muted-foreground">
                {filteredFiles?.length || 0} file{(filteredFiles?.length || 0) !== 1 ? 's' : ''}
              </td>
              {isColumnVisible("type") && <td></td>}
              {isColumnVisible("date") && <td></td>}
              {isColumnVisible("category") && <td></td>}
              {isColumnVisible("status") && <td></td>}
              {isColumnVisible("size") && <td></td>}
              {isColumnVisible("project") && <td></td>}
              {isColumnVisible("value") && (
                <td className="px-3 py-2.5 text-right">
                  <span className="font-semibold text-sm tabular-nums">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
                      filteredFiles?.reduce((sum, file) => {
                        const value = transactionsByFileUrl?.[file.file_url]?.value || 0;
                        return sum + value;
                      }, 0) || 0
                    )}
                  </span>
                </td>
              )}
              {customColumns.map((col) => <td key={col.id}></td>)}
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Upload Progress Panel */}
      {uploadProgress.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Uploading Files</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setUploadProgress([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {uploadProgress.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[180px]">{item.fileName}</span>
                  <span className={
                    item.status === 'completed' ? 'text-green-600' : 
                    item.status === 'error' ? 'text-red-600' : 
                    'text-blue-600'
                  }>
                    {item.status === 'completed' ? '✓' : 
                     item.status === 'error' ? '✗' : 
                     `${item.progress}%`}
                  </span>
                </div>
                <Progress 
                  value={item.progress} 
                  className={`h-1 ${
                    item.status === 'completed' ? '[&>div]:bg-green-500' : 
                    item.status === 'error' ? '[&>div]:bg-red-500' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Column</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="columnName">Column Name</Label>
              <Input
                id="columnName"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2">
                {newColumnOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-8 w-8 rounded border cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              className={`h-6 w-6 rounded border-2 ${opt.color === color ? 'border-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const updated = [...newColumnOptions];
                                updated[i] = { ...updated[i], color };
                                setNewColumnOptions(updated);
                              }}
                            />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const updated = [...newColumnOptions];
                        updated[i] = { ...updated[i], label: e.target.value };
                        setNewColumnOptions(updated);
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNewColumnOptions(newColumnOptions.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewColumnOptions([...newColumnOptions, { label: `Option ${newColumnOptions.length + 1}`, color: COLOR_PALETTE[newColumnOptions.length % COLOR_PALETTE.length] }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewColumn} disabled={!newColumnName.trim()}>
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialogOpen} onOpenChange={setEditColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Column: {editingColumn?.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {!editingColumn?.isBuiltIn && (
              <div>
                <Label htmlFor="editColumnName">Column Name</Label>
                <Input
                  id="editColumnName"
                  value={editingColumn?.label || ""}
                  onChange={(e) => setEditingColumn(prev => prev ? { ...prev, label: e.target.value } : null)}
                  className="mt-2"
                />
              </div>
            )}
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                {editingColumn?.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-8 w-8 rounded border cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-2">
                        <div className="grid grid-cols-5 gap-1">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              className={`h-6 w-6 rounded border-2 ${opt.color === color ? 'border-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                              onClick={() => updateOptionColor(i, color)}
                            />
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOptionLabel(i, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeOption(i)}
                      disabled={(editingColumn?.options?.length || 0) <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveColumnEdits}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => { if (!open) { setPreviewFile(null); setShowExpensePanel(false); } }}>
        <DialogContent className={cn("h-[90vh] flex flex-col p-0", (showExpensePanel || showAIPanel) ? "max-w-[90vw]" : "max-w-5xl")}>
          <DialogHeader className="p-4 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">Visualizar Documento</DialogTitle>
              <div className="flex items-center gap-2 mr-8">
                <Button
                  variant={showAIPanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Análise AI
                </Button>
                <Button
                  variant={showExpensePanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowExpensePanel(!showExpensePanel)}
                >
                  {existingTransaction || (previewFile && customData[previewFile.id]?._pendingLoan) ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {customData[previewFile?.id]?._pendingLoan ? "Editar Empréstimo" : "Editar Movimento"}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Movimento
                    </>
                  )}
                </Button>
                          <Button
                            variant={(existingTransaction as any)?.bank_account_id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowPaymentDialog(true)}
                            disabled={isLoadingTransaction}
                            className={(existingTransaction as any)?.bank_account_id ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                          >
                            {(existingTransaction as any)?.bank_account_id ? (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            ) : (
                              <CreditCard className="h-4 w-4 mr-2" />
                            )}
                            {isLoadingTransaction ? "..." : ((existingTransaction as any)?.bank_account_id ? "Pagamento Registado" : "Registar Pagamento")}
                          </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex">
            {/* Document viewer */}
            <div className={cn("flex-1 overflow-hidden p-4", (showExpensePanel || showAIPanel) && "border-r")}>
              {previewFile && (
                <DocumentPreview
                  key={previewFile.file_url}
                  document={{
                    file_url: previewFile.file_url,
                    name: previewFile.file_name,
                    mime_type: previewFile.mime_type,
                  }}
                  onDownload={() => handleDownload(previewFile)}
                />
              )}
            </div>
            {/* AI Panel */}
            {showAIPanel && previewFile && (
              <div className="w-[350px] flex-shrink-0 border-r">
                <DocumentAIPanel
                  fileUrl={previewFile.file_url}
                  fileName={previewFile.file_name}
                  mimeType={previewFile.mime_type}
                />
              </div>
            )}
            {/* Expense panel */}
            {showExpensePanel && previewFile && (
              <div className="w-[400px] flex-shrink-0">
                <WorkflowExpensePanel
                  file={{
                    id: previewFile.id,
                    file_name: previewFile.file_name,
                    file_url: previewFile.file_url,
                    mime_type: previewFile.mime_type,
                    // OCR data from n8n
                    company_id: previewFile.company_id,
                    category: previewFile.category,
                    notes: previewFile.notes,
                  }}
                  existingTransaction={
                    // If there's pending loan data, convert it to existingTransaction format
                    customData[previewFile.id]?._pendingLoan
                      ? (() => {
                          const pendingLoan = JSON.parse(customData[previewFile.id]._pendingLoan);
                          return {
                            id: "pending",
                            date: pendingLoan.start_date || new Date().toISOString().split("T")[0],
                            type: "loan",
                            lending_company_id: pendingLoan.lending_company_id,
                            borrowing_company_id: pendingLoan.borrowing_company_id,
                            total_amount: pendingLoan.amount,
                            interest_rate: pendingLoan.interest_rate,
                            monthly_payment: pendingLoan.monthly_payment,
                            end_date: pendingLoan.end_date,
                            loan_status: pendingLoan.status,
                            description: pendingLoan.description,
                            notes: pendingLoan.notes,
                            _isLoan: true,
                          };
                        })()
                      : existingTransaction
                  }
                  onClose={() => setShowExpensePanel(false)}
                  onSaved={(payload) => {
                    setShowExpensePanel(false);
                    if (payload?.fileName) {
                      setPreviewFile((prev) => (prev ? { ...prev, file_name: payload.fileName } : prev));
                    }
                    // If it's a pending loan, save to customData - will be created when confirming file send
                    if (payload?.pendingLoanData) {
                      setCustomData(prev => ({
                        ...prev,
                        [previewFile.id]: {
                          ...prev[previewFile.id],
                          _pendingLoan: JSON.stringify(payload.pendingLoanData),
                        }
                      }));
                      toast.success("Dados do empréstimo guardados! Será registado quando confirmar o envio.");
                    } else {
                      queryClient.invalidateQueries({ queryKey: ["file-transaction", previewFile.id, previewFile.file_url] });
                      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
                      // Only show toast for non-loan transactions (loans show their own toast in the panel)
                      const isLoanTransaction = (existingTransaction as any)?._isLoan || customData[previewFile.id]?._pendingLoan;
                      if (!isLoanTransaction) {
                        toast.success(existingTransaction ? "Movimento atualizado!" : "Movimento criado!");
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      {/* Mark as Completed Warning Dialog */}
      <AlertDialog open={markCompleteWarningOpen} onOpenChange={setMarkCompleteWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cannot Complete File
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                No file storage location is configured for company{" "}
                <strong>{missingStorageCompanyName || "Unknown"}</strong> in{" "}
                <strong>
                  {fileToComplete && format(new Date(fileToComplete.created_at), "MMMM yyyy")}
                </strong>.
              </p>
              <p>
                Please go to <strong>Settings → Table Relations → File Storage Locations</strong> and add a storage location for this company and month/year before marking the file as completed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMarkCompleteWarningOpen(false);
              setFileToComplete(null);
              setMissingStorageCompanyName(null);
            }}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Payment Confirmation Dialog */}
      <AlertDialog open={showSkipPaymentConfirmation} onOpenChange={setShowSkipPaymentConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Sem Registo Financeiro
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este documento não tem registo financeiro associado. Deseja mover para a pasta destino sem criar registo financeiro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setShowSkipPaymentConfirmation(false);
              setFileToSkipPayment(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowSkipPaymentConfirmation(false);
                if (fileToSkipPayment) {
                  setPreviewFile(fileToSkipPayment);
                  setShowPaymentDialog(true);
                  setFileToSkipPayment(null);
                }
              }}
            >
              Registar Pagamento
            </Button>
            <AlertDialogAction onClick={handleCompleteWithoutPayment}>
              Continuar sem registo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Payment Dialog */}
      {previewFile && (
        <DocumentPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          workflowFileId={previewFile.id}
          fileName={previewFile.file_name}
          documentFileUrl={previewFile.file_url}
          existingTransaction={existingTransaction}
          onDocumentUrlUpdated={(newUrl) => {
            setPreviewFile((prev) => (prev ? { ...prev, file_url: newUrl } : prev));
          }}
        />
      )}

      {/* Save Filter Dialog */}
      <Dialog open={saveFilterDialogOpen} onOpenChange={setSaveFilterDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Guardar Filtro</DialogTitle>
            <DialogDescription>
              Dê um nome ao filtro para o poder reutilizar mais tarde.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filterName">Nome do filtro</Label>
              <Input
                id="filterName"
                placeholder="Ex: Documentos Pendentes"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveFilter();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Filtros ativos:</p>
              <div className="mt-1 space-y-1">
                {activeFilters.map(filter => {
                  const col = columns.find(c => c.id === filter.column);
                  return (
                    <div key={filter.column} className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{col?.label || filter.column}</Badge>
                      <span className="text-xs">{filter.mode === 'include' ? 'Incluir' : 'Excluir'}:</span>
                      {filter.values.map(v => (
                        <Badge key={v} variant="secondary" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveFilterDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFilter} disabled={!newFilterName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move File to Folder Dialog */}
      <Dialog open={moveFileDialogOpen} onOpenChange={(open) => {
        setMoveFileDialogOpen(open);
        if (!open) {
          setFileToMove(null);
          setMoveForm({ company_id: "", folder_id: null, folder_path: "" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mover para Pasta</DialogTitle>
            <DialogDescription>
              Selecione a empresa e pasta de destino para o ficheiro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File being moved */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ficheiro</Label>
              <p className="text-sm text-foreground mt-1 font-medium truncate">
                {fileToMove?.file_name}
              </p>
            </div>

            {/* Company selection */}
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={moveForm.company_id}
                onValueChange={(value) => setMoveForm(prev => ({ ...prev, company_id: value, folder_id: null, folder_path: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {allCompanies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Folder selection */}
            <div className="space-y-2">
              <Label>Pasta de Destino</Label>
              <p className="text-xs text-slate-500">Selecione a pasta onde o ficheiro será guardado.</p>
              <Select
                value={moveForm.folder_path}
                onValueChange={(value) => {
                  const folder = moveFolderOptions.find(f => f.path === value);
                  setMoveForm(prev => ({ ...prev, folder_path: value, folder_id: folder?.id || null }));
                }}
                disabled={!moveForm.company_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={moveForm.company_id ? "Selecione a pasta..." : "Selecione a empresa primeiro"} />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-60 overflow-y-auto">
                  <SelectItem value="__root__">📁 Raiz (sem pasta)</SelectItem>
                  {moveFolderOptions.length === 0 ? (
                    <SelectItem value="__none__" disabled>Sem pastas disponíveis</SelectItem>
                  ) : (
                    moveFolderOptions.map(folder => (
                      <SelectItem key={folder.id} value={folder.path}>📂 {folder.path}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Preview */}
            {moveForm.company_id && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Destino</Label>
                <p className="text-sm text-slate-700 mt-1 font-mono">
                  {allCompanies?.find(c => c.id === moveForm.company_id)?.name} → Documents → <span className="text-blue-600">{moveForm.folder_path === "__root__" ? "(Raiz)" : moveForm.folder_path || "..."}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveFileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleMoveFile}
              disabled={!moveForm.company_id || moveFileMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {moveFileMutation.isPending ? "A mover..." : "Mover Ficheiro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={(open) => {
        setRenameDialogOpen(open);
        if (!open) {
          setFileToRename(null);
          setNewFileName("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Ficheiro</DialogTitle>
            <DialogDescription>
              Introduza o novo nome para o ficheiro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Ficheiro</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Novo nome..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFileName.trim() && fileToRename) {
                      const ext = fileToRename.file_name.match(/\.[^/.]+$/)?.[0] || '';
                      updateFieldMutation.mutate(
                        { id: fileToRename.id, field: 'file_name', value: newFileName.trim() + ext },
                        { onSuccess: () => {
                          toast.success("Ficheiro renomeado");
                          setRenameDialogOpen(false);
                          setFileToRename(null);
                          setNewFileName("");
                        }}
                      );
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {fileToRename?.file_name.match(/\.[^/.]+$/)?.[0] || ''}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (fileToRename && newFileName.trim()) {
                  const ext = fileToRename.file_name.match(/\.[^/.]+$/)?.[0] || '';
                  updateFieldMutation.mutate(
                    { id: fileToRename.id, field: 'file_name', value: newFileName.trim() + ext },
                    { onSuccess: () => {
                      toast.success("Ficheiro renomeado");
                      setRenameDialogOpen(false);
                      setFileToRename(null);
                      setNewFileName("");
                    }}
                  );
                }
              }}
              disabled={!newFileName.trim() || updateFieldMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateFieldMutation.isPending ? "A renomear..." : "Renomear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
