import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Upload, 
  Search, 
  FileText, 
  Filter,
  Building2,
  Trash2,
  Download,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Share2,
  File,
  FileSpreadsheet,
  FileImage,
  User,
  Folder,
  FolderPlus,
  Settings,
  ChevronRight,
  Columns,
  Tag,
  X,
  Edit3,
  Calendar,
  Star
} from "lucide-react";
import DocumentMetadataSheet from "@/components/companies/DocumentMetadataSheet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadDialog from "@/components/companies/DocumentUploadDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const AVAILABLE_TAGS = ["Important", "Urgent", "Review", "Archive", "Legal", "Finance", "Contract", "Invoice", "Receipt", "Other"];

const DOCUMENT_TYPES = ["All", "Invoice", "Contract", "Proof", "Receipt", "Legal", "Report", "Other"];
const DOCUMENT_STATUSES = ["All", "Draft", "Under Review", "Final", "Filed"];

type SortField = "name" | "updated_at" | "file_size" | "document_type" | "status";
type SortDirection = "asc" | "desc";

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

const CUSTOM_DOC_COLUMNS_KEY = "company-doc-custom-columns";
const DOC_CUSTOM_DATA_KEY = "company-doc-custom-data";
const FOLDER_CATEGORY_OPTIONS_KEY = "company-folder-category-options";
const FAVORITE_FOLDERS_KEY = "company-favorite-folders";

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
  { label: "Proof", color: "#8b5cf6" },
  { label: "Expense", color: "#f59e0b" },
  { label: "Legal", color: "#ef4444" },
  { label: "Report", color: "#06b6d4" },
  { label: "Other", color: "#6b7280" },
];

const DEFAULT_STATUS_OPTIONS: ColumnOption[] = [
  { label: "Draft", color: "#f59e0b" },
  { label: "Under Review", color: "#3b82f6" },
  { label: "Final", color: "#22c55e" },
  { label: "Filed", color: "#6b7280" },
  { label: "Active", color: "#22c55e" },
  { label: "Closed", color: "#6b7280" },
  { label: "Compliance", color: "#8b5cf6" },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "File", visible: true, required: true },
  { id: "docDate", label: "Date", visible: true },
  { id: "category", label: "Category", visible: true, dbField: "document_type", isBuiltIn: true, options: DEFAULT_CATEGORY_OPTIONS },
  { id: "value", label: "Value", visible: true },
  { id: "status", label: "Status", visible: true, dbField: "status", isBuiltIn: true, options: DEFAULT_STATUS_OPTIONS },
  { id: "modified", label: "Modified", visible: false },
  { id: "size", label: "Size", visible: false },
];

const isDarkColor = (color: string | undefined): boolean => {
  if (!color) return false;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDropUploading, setIsDropUploading] = useState(false);
  const [dropUploadProgress, setDropUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(`company-columns-${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all columns exist with options
        return DEFAULT_COLUMNS.map(def => {
          const saved = parsed.find((p: ColumnConfig) => p.id === def.id);
          return saved ? { ...def, ...saved, options: saved.options || def.options } : def;
        });
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });
  const [customColumns, setCustomColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(`${CUSTOM_DOC_COLUMNS_KEY}-${id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [customData, setCustomData] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(`${DOC_CUSTOM_DATA_KEY}-${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [newTagInput, setNewTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState<string | null>(null);
  const [metadataSheetOpen, setMetadataSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  // Column management dialogs
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnOptions, setNewColumnOptions] = useState<ColumnOption[]>([]);
  const [editColumnDialogOpen, setEditColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [favoriteFolders, setFavoriteFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`${FAVORITE_FOLDERS_KEY}-${id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Save columns to localStorage
  useEffect(() => {
    localStorage.setItem(`company-columns-${id}`, JSON.stringify(columns));
  }, [columns, id]);

  useEffect(() => {
    localStorage.setItem(`${CUSTOM_DOC_COLUMNS_KEY}-${id}`, JSON.stringify(customColumns));
  }, [customColumns, id]);

  useEffect(() => {
    localStorage.setItem(`${DOC_CUSTOM_DATA_KEY}-${id}`, JSON.stringify(customData));
  }, [customData, id]);

  useEffect(() => {
    localStorage.setItem(`${FAVORITE_FOLDERS_KEY}-${id}`, JSON.stringify([...favoriteFolders]));
  }, [favoriteFolders, id]);

  const toggleFavorite = (folderId: string) => {
    setFavoriteFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: folders } = useQuery({
    queryKey: ["company-folders", id, currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from("company_folders")
        .select("*")
        .eq("company_id", id);
      
      if (currentFolderId) {
        query = query.eq("parent_folder_id", currentFolderId);
      } else {
        query = query.is("parent_folder_id", null);
      }
      
      const { data, error } = await query.order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch ALL folders for settings
  const { data: allFolders } = useQuery({
    queryKey: ["company-all-folders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_folders")
        .select("*")
        .eq("company_id", id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get category options for a specific folder from allFolders data
  const getFolderCategoryOptions = useCallback((folderId: string | null): ColumnOption[] => {
    if (!folderId) return DEFAULT_CATEGORY_OPTIONS;
    const folder = allFolders?.find(f => f.id === folderId);
    const options = folder?.category_options as unknown as ColumnOption[] | null;
    if (options && Array.isArray(options) && options.length > 0) {
      return options;
    }
    return DEFAULT_CATEGORY_OPTIONS;
  }, [allFolders]);

  // Get status options for a specific folder from allFolders data
  const getFolderStatusOptions = useCallback((folderId: string | null): ColumnOption[] => {
    if (!folderId) return DEFAULT_STATUS_OPTIONS;
    const folder = allFolders?.find(f => f.id === folderId);
    const options = folder?.status_options as unknown as ColumnOption[] | null;
    if (options && Array.isArray(options) && options.length > 0) {
      return options;
    }
    return DEFAULT_STATUS_OPTIONS;
  }, [allFolders]);

  const { data: folderPath } = useQuery({
    queryKey: ["folder-path", currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return [];
      
      const path: { id: string; name: string }[] = [];
      let folderId: string | null = currentFolderId;
      
      while (folderId) {
        const { data } = await supabase
          .from("company_folders")
          .select("id, name, parent_folder_id")
          .eq("id", folderId)
          .single();
        
        if (data) {
          path.unshift({ id: data.id, name: data.name });
          folderId = data.parent_folder_id;
        } else {
          break;
        }
      }
      
      return path;
    },
    enabled: !!currentFolderId,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["company-documents", id, currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", id);
      
      if (currentFolderId) {
        query = query.eq("folder_id", currentFolderId);
      } else {
        query = query.is("folder_id", null);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("company_folders").insert({
        company_id: id,
        name,
        parent_folder_id: currentFolderId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-folders", id] });
      setFolderDialogOpen(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase.from("company_folders").delete().eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-folders", id] });
      toast.success("Folder deleted");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateFolderFieldMutation = useMutation({
    mutationFn: async ({ folderId, field, value }: { folderId: string; field: string; value: unknown }) => {
      const { error } = await supabase
        .from("company_folders")
        .update({ [field]: value })
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-folders", id] });
      queryClient.invalidateQueries({ queryKey: ["company-all-folders", id] });
      toast.success("Updated");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docIds: string[]) => {
      for (const docId of docIds) {
        const doc = documents?.find(d => d.id === docId);
        if (doc?.file_url) {
          const path = doc.file_url.split("/").slice(-2).join("/");
          await supabase.storage.from("company-documents").remove([path]);
        }
        const { error } = await supabase
          .from("company_documents")
          .delete()
          .eq("id", docId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", id] });
      setSelectedDocs(new Set());
      toast.success("Document(s) deleted");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateDocTagsMutation = useMutation({
    mutationFn: async ({ docId, tags }: { docId: string; tags: string[] }) => {
      const { error } = await supabase
        .from("company_documents")
        .update({ tags })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", id] });
      toast.success("Tags updated");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateDocFieldMutation = useMutation({
    mutationFn: async ({ docId, field, value }: { docId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("company_documents")
        .update({ [field]: value })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", id] });
      toast.success("Updated");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Column management functions
  const addNewColumn = () => {
    if (!newColumnName.trim()) return;
    const newColumn: ColumnConfig = {
      id: `custom_${Date.now()}`,
      label: newColumnName.trim(),
      visible: true,
      isBuiltIn: false,
      options: newColumnOptions.length > 0 ? newColumnOptions : [
        { label: "Option 1", color: "#3b82f6" },
        { label: "Option 2", color: "#22c55e" },
      ],
    };
    setCustomColumns([...customColumns, newColumn]);
    setNewColumnName("");
    setNewColumnOptions([]);
    setAddColumnDialogOpen(false);
  };

  const openEditColumnDialog = (column: ColumnConfig) => {
    // For category column, use folder-specific options
    if (column.id === 'category') {
      setEditingColumn({ ...column, options: getFolderCategoryOptions(currentFolderId) });
    } else if (column.id === 'status') {
      setEditingColumn({ ...column, options: getFolderStatusOptions(currentFolderId) });
    } else {
      setEditingColumn({ ...column });
    }
    setEditingFolderId(currentFolderId);
    setEditColumnDialogOpen(true);
  };

  const saveColumnSettings = async () => {
    if (!editingColumn) return;
    
    // Check if it's a folder-specific category edit (from folder menu)
    if (editingColumn.id.startsWith('category-folder-')) {
      const folderId = editingColumn.id.replace('category-folder-', '');
      const options = editingColumn.options || DEFAULT_CATEGORY_OPTIONS;
      if (folderId !== 'root') {
        await updateFolderFieldMutation.mutateAsync({ folderId, field: 'category_options', value: options });
      }
    } else if (editingColumn.id.startsWith('status-folder-')) {
      const folderId = editingColumn.id.replace('status-folder-', '');
      const options = editingColumn.options || DEFAULT_STATUS_OPTIONS;
      if (folderId !== 'root') {
        await updateFolderFieldMutation.mutateAsync({ folderId, field: 'status_options', value: options });
      }
    } else if (editingColumn.id === 'category' && editingFolderId) {
      const options = editingColumn.options || DEFAULT_CATEGORY_OPTIONS;
      await updateFolderFieldMutation.mutateAsync({ folderId: editingFolderId, field: 'category_options', value: options });
    } else if (editingColumn.id === 'status' && editingFolderId) {
      const options = editingColumn.options || DEFAULT_STATUS_OPTIONS;
      await updateFolderFieldMutation.mutateAsync({ folderId: editingFolderId, field: 'status_options', value: options });
    } else if (editingColumn.isBuiltIn) {
      setColumns(columns.map(c => c.id === editingColumn.id ? editingColumn : c));
    } else {
      setCustomColumns(customColumns.map(c => c.id === editingColumn.id ? editingColumn : c));
    }
    setEditColumnDialogOpen(false);
    setEditingColumn(null);
    setEditingFolderId(null);
  };

  // Edit category options for a specific folder
  const openEditFolderCategories = (folderId: string) => {
    const categoryColumn = columns.find(c => c.id === 'category');
    const folderOptions = getFolderCategoryOptions(folderId);
    setEditingColumn({ 
      ...categoryColumn!, 
      options: folderOptions,
      id: `category-folder-${folderId}`
    });
    setEditColumnDialogOpen(true);
  };

  const deleteColumn = (columnId: string) => {
    setCustomColumns(customColumns.filter(c => c.id !== columnId));
    const newData = { ...customData };
    Object.keys(newData).forEach(docId => {
      delete newData[docId][columnId];
    });
    setCustomData(newData);
  };

  const addOption = () => {
    if (editingColumn) {
      const newOptions = [...(editingColumn.options || []), { label: `Option ${(editingColumn.options?.length || 0) + 1}`, color: "#6b7280" }];
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const removeOption = (index: number) => {
    if (editingColumn && editingColumn.options) {
      const newOptions = editingColumn.options.filter((_, i) => i !== index);
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const updateOptionColor = (index: number, color: string) => {
    if (editingColumn && editingColumn.options) {
      const newOptions = [...editingColumn.options];
      newOptions[index] = { ...newOptions[index], color };
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const updateOptionLabel = (index: number, label: string) => {
    if (editingColumn && editingColumn.options) {
      const newOptions = [...editingColumn.options];
      newOptions[index] = { ...newOptions[index], label };
      setEditingColumn({ ...editingColumn, options: newOptions });
    }
  };

  const getColumnValue = (doc: any, column: ColumnConfig) => {
    if (column.isBuiltIn && column.dbField) {
      return doc[column.dbField] || null;
    }
    return customData[doc.id]?.[column.id] || null;
  };

  const renderCellDropdown = (doc: any, column: ColumnConfig) => {
    const value = getColumnValue(doc, column);
    // Use folder-specific options for category/status columns
    const options = column.id === 'category' 
      ? getFolderCategoryOptions(currentFolderId)
      : column.id === 'status'
        ? getFolderStatusOptions(currentFolderId)
        : column.options;
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
                if (column.isBuiltIn && column.dbField) {
                  updateDocFieldMutation.mutate({ docId: doc.id, field: column.dbField, value: opt.label });
                } else {
                  setCustomData(prev => ({
                    ...prev,
                    [doc.id]: { ...prev[doc.id], [column.id]: opt.label }
                  }));
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

  const renderFolderCellDropdown = (folder: any, column: ColumnConfig) => {
    const value = folder[column.id] || null;
    // Use folder-specific options for category/status columns
    const options = column.id === 'category' 
      ? getFolderCategoryOptions(folder.parent_folder_id)
      : column.id === 'status'
        ? getFolderStatusOptions(folder.parent_folder_id)
        : column.options;
    const option = options?.find(o => o.label === value);
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={(e) => {
                e.stopPropagation();
                updateFolderFieldMutation.mutate({ folderId: folder.id, field: column.id, value: opt.label });
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

  const handleAddTag = (docId: string, currentTags: string[] | null, newTag: string) => {
    const tags = currentTags || [];
    if (!tags.includes(newTag)) {
      updateDocTagsMutation.mutate({ docId, tags: [...tags, newTag] });
    }
    setNewTagInput("");
    setTagPopoverOpen(null);
  };

  const handleRemoveTag = (docId: string, currentTags: string[] | null, tagToRemove: string) => {
    const tags = (currentTags || []).filter(t => t !== tagToRemove);
    updateDocTagsMutation.mutate({ docId, tags });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    setIsDropUploading(true);
    setDropUploadProgress({ current: 0, total: files.length });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setDropUploadProgress({ current: i + 1, total: files.length });
        
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${id}/${timestamp}-${safeFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("company-documents")
          .upload(filePath, file);
        
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from("company-documents")
          .getPublicUrl(filePath);
        
        const { error: insertError } = await supabase
          .from("company_documents")
          .insert({
            company_id: id,
            folder_id: currentFolderId || null,
            name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            document_type: "Other",
            status: "Draft",
            uploaded_by: user.id,
          });
        
        if (insertError) {
          toast.error(`Failed to save ${file.name}: ${insertError.message}`);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["company-documents", id, currentFolderId] });
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsDropUploading(false);
      setDropUploadProgress(null);
    }
  }, [id, currentFolderId, queryClient]);

  const handleDownload = async (doc: any) => {
    try {
      const path = doc.file_url.split("/").slice(-2).join("/");
      const { data, error } = await supabase.storage
        .from("company-documents")
        .download(path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Download failed: " + error.message);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments?.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments?.map(d => d.id)));
    }
  };

  const toggleSelect = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleColumn = (columnId: string) => {
    setColumns(cols => cols.map(col => 
      col.id === columnId && !col.required ? { ...col, visible: !col.visible } : col
    ));
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
  };

  const filteredDocuments = documents
    ?.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All" || doc.document_type === typeFilter;
      const matchesStatus = statusFilter === "All" || doc.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "file_size":
          comparison = (a.file_size || 0) - (b.file_size || 0);
          break;
        case "document_type":
          comparison = (a.document_type || "").localeCompare(b.document_type || "");
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const getFileIcon = (mimeType: string | null, name: string) => {
    if (mimeType?.includes("spreadsheet") || name.endsWith(".xlsx") || name.endsWith(".csv")) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    if (mimeType?.includes("image")) {
      return <FileImage className="h-4 w-4 text-purple-600" />;
    }
    if (mimeType?.includes("pdf")) {
      return <File className="h-4 w-4 text-red-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Draft: "bg-amber-50 text-amber-700 border-amber-200",
      "Under Review": "bg-blue-50 text-blue-700 border-blue-200",
      Final: "bg-green-50 text-green-700 border-green-200",
      Filed: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        styles[status] || styles.Draft
      )}>
        {status}
      </span>
    );
  };

  const formatModifiedDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return format(d, "MMMM d");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
  };

  const isColumnVisible = (columnId: string) => columns.find(c => c.id === columnId)?.visible ?? true;

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors text-left w-full"
    >
      {children}
      {sortField === field && (
        sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );

  if (companyLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading company...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Company Header */}
      <div className="bg-background border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/companies")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{company.name}</h1>
              <p className="text-xs text-muted-foreground">Tax ID: {company.tax_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="px-6 pt-4">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-4">
          <TabsTrigger 
            value="documents" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 pb-2"
          >
            Document Library
          </TabsTrigger>
          <TabsTrigger 
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 pb-2"
          >
            Company Details
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 pb-2"
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </TabsTrigger>
          
          {/* Favorite Folders Links */}
          {allFolders?.filter(f => favoriteFolders.has(f.id)).map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolderId(folder.id)}
              className="flex items-center gap-1.5 px-2 pb-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {folder.name}
            </button>
          ))}
        </TabsList>

        <TabsContent value="documents" className="mt-0 pt-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-4",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : isDropUploading
                  ? "border-blue-500 bg-blue-50"
                  : "border-muted-foreground/20 bg-background"
            )}
          >
            {isDropUploading ? (
              <>
                <div className="h-6 w-6 mx-auto mb-1 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-600 font-medium">
                  Uploading {dropUploadProgress?.current} of {dropUploadProgress?.total} files...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag files here or{" "}
                  <button onClick={() => setUploadDialogOpen(true)} className="text-primary hover:underline">
                    browse
                  </button>
                </p>
              </>
            )}
          </div>

          {/* SharePoint Command Bar */}
          <div className="bg-background border rounded-t-lg border-b-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-8 gap-1 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      New
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setFolderDialogOpen(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Column Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                      <Columns className="h-4 w-4" />
                      Columns
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.visible}
                        disabled={col.required}
                        onCheckedChange={(checked) => {
                          setColumns(columns.map(c => 
                            c.id === col.id ? { ...c, visible: checked } : c
                          ));
                        }}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedDocs.size > 0 && (
                  <>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete ${selectedDocs.size} document(s)?`)) {
                          deleteMutation.mutate(Array.from(selectedDocs));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete ({selectedDocs.size})
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 pl-8 text-sm"
                  />
                </div>
                <Button 
                  variant={showFilters ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            {showFilters && (
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b">
                <span className="text-xs text-muted-foreground">Filters:</span>
                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-7 text-xs border rounded px-2 bg-background"
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type === "All" ? "All Types" : type}</option>
                  ))}
                </select>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 text-xs border rounded px-2 bg-background"
                >
                  {DOCUMENT_STATUSES.map(status => (
                    <option key={status} value={status}>{status === "All" ? "All Statuses" : status}</option>
                  ))}
                </select>
                {(typeFilter !== "All" || statusFilter !== "All") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => { setTypeFilter("All"); setStatusFilter("All"); }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Breadcrumbs - Above Table */}
          <div className="px-1 py-2">
            <Breadcrumb>
              <BreadcrumbList className="text-sm">
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); navigate("/companies"); }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Companies
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setCurrentFolderId(null); }}
                    className="text-primary hover:underline"
                  >
                    {company.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentFolderId && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setCurrentFolderId(null); }}
                        className="text-primary hover:underline"
                      >
                        Documents
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                {folderPath?.map((folder, index) => (
                  <span key={folder.id} className="flex items-center">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === folderPath.length - 1 ? (
                        <BreadcrumbPage className="text-foreground font-medium">{folder.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentFolderId(folder.id); }}
                          className="text-primary hover:underline"
                        >
                          {folder.name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
                {!currentFolderId && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-foreground font-medium">Documents</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* SharePoint-style Dense Data Grid */}
          <div className="bg-background border border-slate-200 rounded-b-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox 
                        checked={selectedDocs.size === filteredDocuments?.length && filteredDocuments?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                      <SortHeader field="name">File</SortHeader>
                    </th>
                    {isColumnVisible("docDate") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        Date
                      </th>
                    )}
                    {isColumnVisible("category") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        {renderColumnHeader(columns.find(c => c.id === "category")!)}
                      </th>
                    )}
                    {isColumnVisible("value") && (
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-32">
                        Value
                      </th>
                    )}
                    {isColumnVisible("status") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        {renderColumnHeader(columns.find(c => c.id === "status")!)}
                      </th>
                    )}
                    {isColumnVisible("modified") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        <SortHeader field="updated_at">Modified</SortHeader>
                      </th>
                    )}
                    {isColumnVisible("size") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-20">
                        <SortHeader field="file_size">Size</SortHeader>
                      </th>
                    )}
                    {/* Custom columns headers */}
                    {customColumns.map((col) => (
                      <th key={col.id} className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
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
                  {/* Folders */}
                  {folders?.map((folder) => (
                    <tr 
                      key={folder.id} 
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onDoubleClick={() => setCurrentFolderId(folder.id)}
                    >
                      <td className="px-3 py-1.5">
                        <Checkbox disabled />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          {favoriteFolders.has(folder.id) && (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                          <Folder className="h-4 w-4 text-amber-500" />
                          <button 
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {folder.name}
                          </button>
                        </div>
                      </td>
                      {isColumnVisible("docDate") && (
                        <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      )}
                      {isColumnVisible("category") && (
                        <td className="px-3 py-1.5">
                          {renderFolderCellDropdown(folder, columns.find(c => c.id === "category")!)}
                        </td>
                      )}
                      {isColumnVisible("value") && (
                        <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      )}
                      {isColumnVisible("status") && (
                        <td className="px-3 py-1.5">
                          {renderFolderCellDropdown(folder, columns.find(c => c.id === "status")!)}
                        </td>
                      )}
                      {isColumnVisible("tags") && (
                        <td className="px-3 py-1.5" />
                      )}
                      {isColumnVisible("modified") && (
                        <td className="px-3 py-1.5 text-slate-500 text-sm">
                          {formatModifiedDate(folder.updated_at)}
                        </td>
                      )}
                      {isColumnVisible("size") && (
                        <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      )}
                      {/* Custom columns - empty for folders */}
                      {customColumns.map((col) => (
                        <td key={col.id} className="px-3 py-1.5 text-slate-400 text-xs">—</td>
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
                            <DropdownMenuItem onClick={() => setCurrentFolderId(folder.id)}>
                              <ChevronRight className="h-4 w-4 mr-2" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFavorite(folder.id)}>
                              <Star className={cn("h-4 w-4 mr-2", favoriteFolders.has(folder.id) && "fill-amber-400 text-amber-400")} />
                              {favoriteFolders.has(folder.id) ? "Remove from Favorites" : "Add to Favorites"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditFolderCategories(folder.id)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Categories
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Delete this folder and all its contents?")) {
                                  deleteFolderMutation.mutate(folder.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  
                  
                  {/* Documents */}
                  {documentsLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-muted-foreground">
                        Loading documents...
                      </td>
                    </tr>
                  ) : (folders?.length === 0 && filteredDocuments?.length === 0) ? (
                    <tr>
                      <td colSpan={10} className="p-4">
                        <div 
                          className="border-2 border-dashed border-slate-300 rounded-lg py-12 text-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add("border-primary", "bg-primary/5");
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                            handleDrop(e);
                          }}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.multiple = true;
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files) {
                                const dataTransfer = new DataTransfer();
                                Array.from(files).forEach(f => dataTransfer.items.add(f));
                                const fakeEvent = { preventDefault: () => {}, dataTransfer } as unknown as React.DragEvent;
                                handleDrop(fakeEvent);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Drag files here or <span className="text-primary font-medium">browse</span></p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderDialogOpen(true);
                              }}
                            >
                              Create folder
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments?.map((doc) => (
                      <tr 
                        key={doc.id} 
                        className={cn(
                          "border-b border-slate-100 hover:bg-slate-50/80 transition-colors group",
                          selectedDocs.has(doc.id) && "bg-blue-50/50"
                        )}
                      >
                        <td className="px-3 py-2">
                          <Checkbox 
                            checked={selectedDocs.has(doc.id)}
                            onCheckedChange={() => toggleSelect(doc.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.mime_type, doc.name)}
                            <button 
                              onClick={() => handleDownload(doc)}
                              className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm text-left"
                            >
                              {doc.name}
                            </button>
                          </div>
                        </td>
                        {isColumnVisible("docDate") && (
                          <td className="px-3 py-2 text-slate-600 text-sm tabular-nums">
                            {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : "—"}
                          </td>
                        )}
                        {isColumnVisible("category") && (
                          <td className="px-3 py-2">
                            {renderCellDropdown(doc, columns.find(c => c.id === "category")!)}
                          </td>
                        )}
                        {isColumnVisible("value") && (
                          <td className="px-3 py-2 text-right">
                            {doc.financial_value ? (
                              <span className="font-mono text-sm font-medium text-slate-800">
                                {formatCurrency(doc.financial_value)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        )}
                        {isColumnVisible("status") && (
                          <td className="px-3 py-2">
                            {renderCellDropdown(doc, columns.find(c => c.id === "status")!)}
                          </td>
                        )}
                        {isColumnVisible("modified") && (
                          <td className="px-3 py-2 text-slate-500 text-sm">
                            {formatModifiedDate(doc.updated_at)}
                          </td>
                        )}
                        {isColumnVisible("size") && (
                          <td className="px-3 py-2 text-slate-500 text-sm tabular-nums">
                            {formatFileSize(doc.file_size)}
                          </td>
                        )}
                        {/* Custom columns cells */}
                        {customColumns.map((col) => (
                          <td key={col.id} className="px-3 py-2">
                            {renderCellDropdown(doc, col)}
                          </td>
                        ))}
                        {/* Empty cell for add column button */}
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setMetadataSheetOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4 text-slate-500" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedDocument(doc);
                                  setMetadataSheetOpen(true);
                                }}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Properties
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm("Delete this document?")) {
                                      deleteMutation.mutate([doc.id]);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {((folders?.length || 0) + (filteredDocuments?.length || 0)) > 0 && (
              <div className="px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
                {folders?.length ? `${folders.length} folder${folders.length !== 1 ? 's' : ''}` : ''}
                {folders?.length && filteredDocuments?.length ? ', ' : ''}
                {filteredDocuments?.length ? `${filteredDocuments.length} file${filteredDocuments.length !== 1 ? 's' : ''}` : ''}
                {selectedDocs.size > 0 && ` • ${selectedDocs.size} selected`}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <div className="bg-background border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{company.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax ID</p>
                <p className="font-medium font-mono">{company.tax_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jurisdiction</p>
                <p className="font-medium">{company.jurisdiction || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{company.status || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{company.country || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Rating</p>
                <p className="font-medium">{company.risk_rating || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{company.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{company.phone || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{company.address || "—"}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-6">
          {/* Favorite Folders Section */}
          <div className="bg-background border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Favorite Folders</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Quick access to your most used folders. Click the star icon next to folders to add them here.
            </p>
            
            <div className="space-y-3">
              {allFolders?.filter(f => favoriteFolders.has(f.id)).map((folder) => (
                <div key={folder.id} className="flex items-center justify-between py-3 px-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <Folder className="h-4 w-4 text-amber-500" />
                    <button 
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {folder.name}
                    </button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleFavorite(folder.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
              
              {(!allFolders || allFolders.filter(f => favoriteFolders.has(f.id)).length === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No favorite folders yet. Hover over folders and click the star icon to add favorites.
                </p>
              )}
            </div>
          </div>

          {/* Folder Categories Section */}
          <div className="bg-background border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Folder Categories</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure category options for each folder. Files within a folder will use these categories.
            </p>
            
            <div className="space-y-3">
              {/* All folders */}
              {allFolders?.map((folder) => {
                const folderCategories = getFolderCategoryOptions(folder.id);
                const hasCustomOptions = folder.category_options && Array.isArray(folder.category_options) && (folder.category_options as unknown as ColumnOption[]).length > 0;
                return (
                  <div key={folder.id} className="flex items-center justify-between py-3 px-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {folderCategories.length} categories
                          {hasCustomOptions && (
                            <span className="ml-1 text-primary">(customized)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditFolderCategories(folder.id)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                );
              })}
              
              {(!allFolders || allFolders.length === 0) && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No folders created yet. Create folders in the Document Library.
                </p>
              )}
            </div>
          </div>

          {/* Custom Columns Section */}
          <div className="bg-background border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Custom Columns</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add custom columns to track additional document metadata.
                </p>
              </div>
              <Button size="sm" onClick={() => setAddColumnDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            </div>
            
            <div className="space-y-3">
              {customColumns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No custom columns. Click "Add Column" to create one.
                </p>
              ) : (
                customColumns.map((column) => (
                  <div key={column.id} className="flex items-center justify-between py-3 px-4 border rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium">{column.label}</p>
                      <div className="flex gap-1 mt-1">
                        {column.options?.slice(0, 4).map((opt) => (
                          <span 
                            key={opt.label}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                          >
                            {opt.label}
                          </span>
                        ))}
                        {(column.options?.length || 0) > 4 && (
                          <span className="text-xs text-muted-foreground">+{(column.options?.length || 0) - 4} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditColumnDialog(column)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete column "${column.label}"?`)) {
                            deleteColumn(column.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column Visibility Section */}
          <div className="bg-background border rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Column Visibility</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose which columns to display in the Document Library grid.
            </p>
            
            <div className="space-y-4">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <Label className="font-medium">{column.label}</Label>
                    {column.required && (
                      <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                    )}
                  </div>
                  <Switch
                    checked={column.visible}
                    onCheckedChange={() => toggleColumn(column.id)}
                    disabled={column.required}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={resetColumns}>
                Reset to Default
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolderMutation.mutate(newFolderName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        companyId={id!}
        folderId={currentFolderId}
      />

      <DocumentMetadataSheet
        open={metadataSheetOpen}
        onOpenChange={setMetadataSheetOpen}
        document={selectedDocument}
        companyId={id!}
      />

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
            <DialogTitle>
              {editingColumn?.id.startsWith('category-folder-') ? (
                <>
                  Edit Categories
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (for folder: {
                      editingColumn.id === 'category-folder-root' 
                        ? 'Root (Documents)' 
                        : (allFolders?.find(f => f.id === editingColumn.id.replace('category-folder-', ''))?.name || folders?.find(f => f.id === editingColumn.id.replace('category-folder-', ''))?.name)
                    })
                  </span>
                </>
              ) : (
                <>
                  Edit Column: {editingColumn?.label}
                  {editingColumn?.id === 'category' && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      (for this folder)
                    </span>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {!editingColumn?.isBuiltIn && !editingColumn?.id.startsWith('category-folder-') && (
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
            <Button onClick={saveColumnSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
