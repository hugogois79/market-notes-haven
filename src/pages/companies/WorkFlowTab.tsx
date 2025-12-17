import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Search, Trash2, Download, FileText, X, Plus, ChevronDown, ChevronUp, MoreHorizontal, Edit3, Columns, Filter, Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { DocumentPreview } from "@/components/companies/DocumentPreview";
import { WorkflowExpensePanel } from "@/components/companies/WorkflowExpensePanel";
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

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

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
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Column state
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(WORKFLOW_COLUMNS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return DEFAULT_COLUMNS.map(def => {
          const savedCol = parsed.find((p: ColumnConfig) => p.id === def.id);
          return savedCol ? { ...def, visible: savedCol.visible, options: savedCol.options || def.options } : def;
        });
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

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

  // Query existing transaction for current file
  const { data: existingTransaction } = useQuery({
    queryKey: ["file-transaction", previewFile?.file_url],
    queryFn: async () => {
      if (!previewFile?.file_url) return null;
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("invoice_file_url", previewFile.file_url)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!previewFile?.file_url,
  });

  // Column management dialogs
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnOptions, setNewColumnOptions] = useState<ColumnOption[]>([]);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);

  // Save columns to localStorage
  useEffect(() => {
    localStorage.setItem(WORKFLOW_COLUMNS_KEY, JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem(WORKFLOW_CUSTOM_COLUMNS_KEY, JSON.stringify(customColumns));
  }, [customColumns]);

  useEffect(() => {
    localStorage.setItem(WORKFLOW_CUSTOM_DATA_KEY, JSON.stringify(customData));
  }, [customData]);

  useEffect(() => {
    localStorage.setItem(WORKFLOW_SORT_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // Fetch workflow files
  const { data: workflowFiles, isLoading } = useQuery({
    queryKey: ["workflow-files"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("workflow_files")
        .select("*")
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
          expense_projects:project_id (
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

  // Create lookup map for transactions by file_url
  const transactionsByFileUrl = linkedTransactions?.reduce((acc, tx) => {
    if (tx.invoice_file_url) {
      acc[tx.invoice_file_url] = {
        transactionId: tx.id,
        projectId: tx.project_id,
        projectName: (tx.expense_projects as any)?.name || null,
        value: tx.total_amount,
      };
    }
    return acc;
  }, {} as Record<string, { transactionId: string; projectId: string | null; projectName: string | null; value: number }>);

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

  // Upload files with progress tracking
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

  const filteredFiles = workflowFiles?.filter(file => {
    // Search filter
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Column filter
    let matchesFilter = true;
    if (filterColumn && filterValue) {
      const col = columns.find(c => c.id === filterColumn);
      if (col) {
        const fileValue = col.isBuiltIn && col.dbField 
          ? (file as any)[col.dbField] 
          : customData[file.id]?.[filterColumn];
        matchesFilter = fileValue === filterValue;
      }
    }
    
    return matchesSearch && matchesFilter;
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
  });

  // Sort handler
  const handleSort = (columnId: string) => {
    setSortConfig(prev => ({
      column: columnId,
      direction: prev.column === columnId && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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

  const getFilterableColumns = () => {
    return columns.filter(c => c.options && c.options.length > 0);
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
        <DropdownMenuContent align="start">
          {options?.map((opt) => (
            <DropdownMenuItem
              key={opt.label}
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
      <div className="flex items-center gap-2">
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
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
        
        {/* Columns Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Columns className="h-4 w-4" />
              Columns
              <ChevronDown className="h-3 w-3" />
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="h-4 w-4" />
                {filterColumn ? columns.find(c => c.id === filterColumn)?.label : "Filter"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuItem onClick={() => { setFilterColumn(""); setFilterValue(""); }}>
                Clear filter
              </DropdownMenuItem>
              {getFilterableColumns().map(col => (
                <DropdownMenuItem 
                  key={col.id} 
                  onClick={() => { setFilterColumn(col.id); setFilterValue(""); }}
                >
                  {col.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {filterColumn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  {filterValue || "Select value"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover">
                <DropdownMenuItem onClick={() => setFilterValue("")}>
                  All
                </DropdownMenuItem>
                {columns.find(c => c.id === filterColumn)?.options?.map(opt => (
                  <DropdownMenuItem 
                    key={opt.label} 
                    onClick={() => setFilterValue(opt.label)}
                  >
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                    >
                      {opt.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {filterColumn && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => { setFilterColumn(""); setFilterValue(""); }}
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
        className={`border rounded-lg bg-white shadow-sm overflow-x-auto transition-colors relative ${
          isDragging ? "border-blue-500 border-2 bg-blue-50" : "border-slate-200"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 z-10 pointer-events-none">
            <div className="text-blue-600 font-medium flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Drop files here to upload
            </div>
          </div>
        )}
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <Checkbox 
                  checked={selectedFiles.size > 0 && selectedFiles.size === filteredFiles?.length}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th 
                className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  File
                  {sortConfig.column === 'name' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              {isColumnVisible("type") && (
                <th 
                  className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs w-16 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Type
                    {sortConfig.column === 'type' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              )}
              {isColumnVisible("date") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs w-28 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortConfig.column === 'date' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              )}
              {isColumnVisible("category") && (
                <th className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs w-28">
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
                </th>
              )}
              {isColumnVisible("status") && (
                <th className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs w-28">
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
                </th>
              )}
              {isColumnVisible("size") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs w-20 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center gap-1">
                    Size
                    {sortConfig.column === 'size' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              )}
              {isColumnVisible("project") && (
                <th 
                  className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs w-32 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('project')}
                >
                  <div className="flex items-center gap-1">
                    Project
                    {sortConfig.column === 'project' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              )}
              {isColumnVisible("value") && (
                <th 
                  className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs w-24 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Value
                    {sortConfig.column === 'value' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
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
                <tr key={file.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="px-3 py-1.5">
                    <Checkbox 
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleSelect(file.id)}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <button 
                        className="text-xs font-medium text-blue-600 truncate max-w-[600px] hover:underline cursor-pointer text-left" 
                        title={file.file_name}
                        onClick={() => setPreviewFile(file)}
                      >
                        {getFileNameWithoutExtension(file.file_name)}
                      </button>
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
                    <td className="px-3 py-1.5 text-slate-600 text-sm">
                      {format(new Date(file.created_at), "dd/MM/yyyy")}
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
                  {isColumnVisible("project") && (
                    <td className="px-3 py-1.5">
                      {transactionsByFileUrl?.[file.file_url] ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-left text-xs text-slate-600 hover:text-foreground hover:bg-slate-100 px-1 py-0.5 rounded cursor-pointer w-full truncate max-w-[120px]">
                              {transactionsByFileUrl[file.file_url]?.projectName || <span className="text-slate-400">—</span>}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto bg-white z-50">
                            <DropdownMenuItem 
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
                        <span className="text-slate-400 text-xs">—</span>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
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
              ))
            )}
          </tbody>
        </table>
        
        {/* Footer */}
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-slate-200 bg-slate-50">
          {filteredFiles?.length || 0} file{(filteredFiles?.length || 0) !== 1 ? 's' : ''}
        </div>
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
        <DialogContent className={cn("h-[90vh] flex flex-col p-0", showExpensePanel ? "max-w-[90vw]" : "max-w-5xl")}>
          <DialogHeader className="p-4 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">Visualizar Documento</DialogTitle>
              <Button
                variant={showExpensePanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowExpensePanel(!showExpensePanel)}
                className="mr-8"
              >
                {existingTransaction ? (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Editar Movimento
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Movimento
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex">
            {/* Document viewer */}
            <div className={cn("flex-1 overflow-hidden p-4", showExpensePanel && "border-r")}>
              {previewFile && (
                <DocumentPreview
                  document={{
                    file_url: previewFile.file_url,
                    name: previewFile.file_name,
                    mime_type: previewFile.mime_type,
                  }}
                  onDownload={() => handleDownload(previewFile)}
                />
              )}
            </div>
            {/* Expense panel */}
            {showExpensePanel && previewFile && (
              <div className="w-[400px] flex-shrink-0">
                <WorkflowExpensePanel
                  file={{
                    id: previewFile.id,
                    file_name: previewFile.file_name,
                    file_url: previewFile.file_url,
                    mime_type: previewFile.mime_type,
                  }}
                  existingTransaction={existingTransaction}
                  onClose={() => setShowExpensePanel(false)}
                  onSaved={() => {
                    setShowExpensePanel(false);
                    queryClient.invalidateQueries({ queryKey: ["file-transaction", previewFile.file_url] });
                    toast.success(existingTransaction ? "Movimento atualizado!" : "Movimento criado!");
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
