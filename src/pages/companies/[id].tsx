import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDocumentsPaginated } from "@/hooks/useDocumentsPaginated";
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
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileType2,
  User,
  Folder,
  FolderPlus,
  FolderInput,
  Settings,
  ChevronRight,
  Columns,
  Tag,
  X,
  Edit3,
  Calendar,
  Star,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ListChecks
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadDialog from "@/components/companies/DocumentUploadDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DocumentPreview } from "@/components/companies/DocumentPreview";
import { DocumentAIPanel } from "@/components/companies/DocumentAIPanel";

const DEFAULT_TAG_OPTIONS: ColumnOption[] = [
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

const DEFAULT_VALUE_OPTIONS: ColumnOption[] = [
  { label: "€", color: "#22c55e" },
  { label: "$", color: "#3b82f6" },
  { label: "£", color: "#8b5cf6" },
];

const AVAILABLE_TAGS = DEFAULT_TAG_OPTIONS.map(t => t.label);

const DOCUMENT_TYPES = ["All", "Invoice", "Contract", "Proof", "Receipt", "Legal", "Report", "Other"];
const DOCUMENT_STATUSES = ["All", "Draft", "Under Review", "Final", "Filed"];

type SortField = "name" | "updated_at" | "created_at" | "file_size" | "document_type" | "status" | "financial_value";
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
const FOLDER_SORT_SETTINGS_KEY = "company-folder-sort";

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
  { id: "type", label: "Type", visible: true },
  { id: "category", label: "Category", visible: true, dbField: "document_type", isBuiltIn: true, options: DEFAULT_CATEGORY_OPTIONS },
  { id: "value", label: "Value", visible: true, isBuiltIn: true, options: DEFAULT_VALUE_OPTIONS },
  { id: "status", label: "Status", visible: true, dbField: "status", isBuiltIn: true, options: DEFAULT_STATUS_OPTIONS },
  { id: "tags", label: "Tags", visible: true, isBuiltIn: true, options: DEFAULT_TAG_OPTIONS },
  { id: "modified", label: "Modified", visible: false },
  { id: "size", label: "Size", visible: false },
];

// Get human-readable file type like Windows Explorer
const getFileTypeLabel = (mimeType: string | null | undefined, fileName: string): string => {
  if (!mimeType && !fileName) return "File";
  
  // Try to determine by extension if no mime type
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  // MIME type mappings
  if (mimeType?.includes("pdf")) return "Documento do Adobe Acrobat";
  if (mimeType?.includes("word") || ext === "doc" || ext === "docx") return "Documento do Microsoft Word";
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet") || ext === "xls" || ext === "xlsx") return "Folha de Cálculo do Microsoft Excel";
  if (mimeType?.includes("powerpoint") || mimeType?.includes("presentation") || ext === "ppt" || ext === "pptx") return "Apresentação do Microsoft PowerPoint";
  if (mimeType?.startsWith("image/jpeg") || ext === "jpg" || ext === "jpeg") return "Ficheiro JPEG";
  if (mimeType?.startsWith("image/png") || ext === "png") return "Ficheiro PNG";
  if (mimeType?.startsWith("image/gif") || ext === "gif") return "Ficheiro GIF";
  if (mimeType?.startsWith("image/svg") || ext === "svg") return "Ficheiro SVG";
  if (mimeType?.startsWith("image/")) return "Ficheiro de Imagem";
  if (mimeType?.includes("zip") || ext === "zip") return "Pasta Comprimida (ZIP)";
  if (mimeType?.includes("rar") || ext === "rar") return "Arquivo RAR";
  if (mimeType?.includes("7z") || ext === "7z") return "Arquivo 7-Zip";
  if (mimeType?.includes("text/plain") || ext === "txt") return "Documento de Texto";
  if (mimeType?.includes("text/csv") || ext === "csv") return "Ficheiro CSV";
  if (mimeType?.includes("json") || ext === "json") return "Ficheiro JSON";
  if (mimeType?.includes("xml") || ext === "xml") return "Ficheiro XML";
  if (mimeType?.includes("html") || ext === "html" || ext === "htm") return "Documento HTML";
  if (mimeType?.includes("audio/") || ext === "mp3" || ext === "wav" || ext === "ogg") return "Ficheiro de Áudio";
  if (mimeType?.includes("video/") || ext === "mp4" || ext === "avi" || ext === "mkv" || ext === "mov") return "Ficheiro de Vídeo";
  
  return "Ficheiro";
};

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
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [isDropUploading, setIsDropUploading] = useState(false);
  const [dropUploadProgress, setDropUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(`company-columns-${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Always use DEFAULT_COLUMNS as base to ensure all columns exist (including new ones like Type)
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
    const saved = localStorage.getItem(`${CUSTOM_DOC_COLUMNS_KEY}-${id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [customData, setCustomData] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(`${DOC_CUSTOM_DATA_KEY}-${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [newTagInput, setNewTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState<string | null>(null);
  const [valuePopoverOpen, setValuePopoverOpen] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [metadataSheetOpen, setMetadataSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [showDocAIPanel, setShowDocAIPanel] = useState(true);

  // Move document dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [docToMove, setDocToMove] = useState<any>(null);
  const [moveFolderPath, setMoveFolderPath] = useState<string>("__root__");
  const [moveFolderPopoverOpen, setMoveFolderPopoverOpen] = useState(false);
  
  // Bulk move documents dialog state
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [bulkMoveFolderPath, setBulkMoveFolderPath] = useState<string>("__root__");
  const [bulkMoveFolderPopoverOpen, setBulkMoveFolderPopoverOpen] = useState(false);
  
  // Move folder dialog state
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false);
  const [folderToMove, setFolderToMove] = useState<any>(null);
  const [targetFolderPath, setTargetFolderPath] = useState<string>("__root__");
  const [targetFolderPopoverOpen, setTargetFolderPopoverOpen] = useState(false);
  
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

  // AI Insights state
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [insightsContent, setInsightsContent] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsFeedback, setInsightsFeedback] = useState<'positive' | 'negative' | null>(null);
  const [insightsLastReviewed, setInsightsLastReviewed] = useState<Date | null>(null);
  const [insightsId, setInsightsId] = useState<string | null>(null);

  // Load folder insights from database
  useEffect(() => {
    const loadFolderInsights = async () => {
      if (!currentFolderId) {
        setInsightsContent(null);
        setInsightsFeedback(null);
        setInsightsLastReviewed(null);
        setInsightsId(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('folder_insights')
          .select('*')
          .eq('folder_id', currentFolderId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading insights:', error);
          return;
        }

        if (data) {
          setInsightsContent(data.insight_text);
          setInsightsFeedback(data.feedback as 'positive' | 'negative' | null);
          setInsightsLastReviewed(new Date(data.last_reviewed_at));
          setInsightsId(data.id);
        } else {
          setInsightsContent(null);
          setInsightsFeedback(null);
          setInsightsLastReviewed(null);
          setInsightsId(null);
        }
      } catch (error) {
        console.error('Error loading insights:', error);
      }
    };

    loadFolderInsights();
  }, [currentFolderId]);

  // Check if insights need refresh (>60 days old)
  const insightsNeedRefresh = !insightsContent || 
    (insightsLastReviewed && (Date.now() - insightsLastReviewed.getTime()) > 60 * 24 * 60 * 60 * 1000);

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

  // Load sort settings when folder changes
  useEffect(() => {
    const folderKey = currentFolderId || "root";
    const saved = localStorage.getItem(`${FOLDER_SORT_SETTINGS_KEY}-${id}-${folderKey}`);
    if (saved) {
      try {
        const { field, direction } = JSON.parse(saved);
        setSortField(field);
        setSortDirection(direction);
      } catch {
        // Keep default values
      }
    } else {
      // Reset to default for new folders
      setSortField("updated_at");
      setSortDirection("desc");
    }
  }, [currentFolderId, id]);

  // Save sort settings when they change
  useEffect(() => {
    const folderKey = currentFolderId || "root";
    localStorage.setItem(
      `${FOLDER_SORT_SETTINGS_KEY}-${id}-${folderKey}`,
      JSON.stringify({ field: sortField, direction: sortDirection })
    );
  }, [sortField, sortDirection, currentFolderId, id]);

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

  // Build folder paths for move dialog (uses allFolders)
  const getFolderPath = (folderId: string, foldersList: any[]): string => {
    const folder = foldersList.find(f => f.id === folderId);
    if (!folder) return "";
    if (!folder.parent_folder_id) return folder.name;
    const parentPath = getFolderPath(folder.parent_folder_id, foldersList);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  };

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

  const folderOptions = (allFolders || [])
    .map(folder => ({
      id: folder.id as string,
      path: getFolderPath(folder.id, allFolders || []),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
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

  // Get tag options - uses column options (editable via Edit Column)
  const getTagOptions = useCallback((): ColumnOption[] => {
    const tagsColumn = columns.find(c => c.id === "tags");
    return tagsColumn?.options || DEFAULT_TAG_OPTIONS;
  }, [columns]);

  // Get value options - uses column options (editable via Edit Column)
  const getValueOptions = useCallback((): ColumnOption[] => {
    const valueColumn = columns.find(c => c.id === "value");
    return valueColumn?.options || DEFAULT_VALUE_OPTIONS;
  }, [columns]);

  // Helper to get tag color
  const getTagColor = useCallback((tag: string): string | undefined => {
    const options = getTagOptions();
    return options.find(o => o.label === tag)?.color;
  }, [getTagOptions]);

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

  // Server-side paginated documents with filtering and sorting
  const { 
    documents, 
    totalCount: documentsTotalCount,
    isLoading: documentsLoading, 
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    invalidate: invalidateDocuments
  } = useDocumentsPaginated({
    companyId: id,
    folderId: currentFolderId,
    searchQuery,
    typeFilter,
    statusFilter,
    sortField,
    sortDirection,
    pageSize: 50,
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
      queryClient.invalidateQueries({ queryKey: ["company-all-folders", id] });
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
      queryClient.invalidateQueries({ queryKey: ["company-all-folders", id] });
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
      invalidateDocuments();
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
      invalidateDocuments();
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
      invalidateDocuments();
      toast.success("Updated");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({ docId, folderId }: { docId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("company_documents")
        .update({ folder_id: folderId })
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDocuments();
      toast.success("Ficheiro movido");
      setMoveDialogOpen(false);
      setDocToMove(null);
      setMoveFolderPath("__root__");
    },
    onError: (error) => {
      toast.error("Erro ao mover: " + error.message);
    },
  });

  const bulkMoveDocumentsMutation = useMutation({
    mutationFn: async ({ docIds, folderId }: { docIds: string[]; folderId: string | null }) => {
      const { error } = await supabase
        .from("company_documents")
        .update({ folder_id: folderId })
        .in("id", docIds);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDocuments();
      toast.success(`${selectedDocs.size} ficheiro(s) movido(s)`);
      setBulkMoveDialogOpen(false);
      setSelectedDocs(new Set());
      setBulkMoveFolderPath("__root__");
    },
    onError: (error) => {
      toast.error("Erro ao mover: " + error.message);
    },
  });

  const handleConfirmMove = () => {
    if (!docToMove?.id) return;
    const targetFolderId =
      moveFolderPath === "__root__"
        ? null
        : (folderOptions.find((f) => f.path === moveFolderPath)?.id ?? null);

    moveDocumentMutation.mutate({ docId: docToMove.id, folderId: targetFolderId });
  };

  const handleConfirmBulkMove = () => {
    if (selectedDocs.size === 0) return;
    const targetFolderId =
      bulkMoveFolderPath === "__root__"
        ? null
        : (folderOptions.find((f) => f.path === bulkMoveFolderPath)?.id ?? null);

    bulkMoveDocumentsMutation.mutate({ docIds: Array.from(selectedDocs), folderId: targetFolderId });
  };

  // Helper function to build folder path from hierarchy
  const buildFolderPath = useCallback((folderId: string, folders: { id: string; name: string; parent_folder_id: string | null }[]): string => {
    const pathParts: string[] = [];
    let currentId: string | null = folderId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      pathParts.unshift(folder.name);
      currentId = folder.parent_folder_id;
    }
    
    return pathParts.join("/");
  }, []);

  // Helper to get all descendant folder IDs
  const getDescendantFolderIds = useCallback((parentId: string, folders: { id: string; parent_folder_id: string | null }[]): string[] => {
    const descendants: string[] = [];
    const findDescendants = (pId: string) => {
      folders.forEach(f => {
        if (f.parent_folder_id === pId) {
          descendants.push(f.id);
          findDescendants(f.id);
        }
      });
    };
    findDescendants(parentId);
    return descendants;
  }, []);

  // Move folder mutation (supports multiple folders)
  const moveFolderMutation = useMutation({
    mutationFn: async ({ folderIds, targetParentId }: { folderIds: string[]; targetParentId: string | null }) => {
      for (const folderId of folderIds) {
        // Prevent moving folder into itself or its descendants
        if (targetParentId) {
          let checkId: string | null = targetParentId;
          while (checkId) {
            if (checkId === folderId) {
              throw new Error("Não é possível mover uma pasta para dentro de si mesma ou das suas subpastas");
            }
            const parentFolder = allFolders?.find(f => f.id === checkId);
            checkId = parentFolder?.parent_folder_id || null;
          }
        }

        const { error } = await supabase
          .from("company_folders")
          .update({ parent_folder_id: targetParentId })
          .eq("id", folderId);
        if (error) throw error;
      }

      // After moving folders, update workflow_storage_locations folder_path
      // First, refetch all folders to get updated hierarchy
      const { data: updatedFolders } = await supabase
        .from("company_folders")
        .select("id, name, parent_folder_id, company_id")
        .eq("company_id", id);

      if (!updatedFolders) return;

      // Collect all affected folder IDs (moved folders + their descendants)
      const affectedFolderIds = new Set<string>();
      for (const folderId of folderIds) {
        affectedFolderIds.add(folderId);
        const descendants = getDescendantFolderIds(folderId, updatedFolders);
        descendants.forEach(d => affectedFolderIds.add(d));
      }

      // Find all workflow_storage_locations that reference affected folders
      const { data: affectedLocations } = await supabase
        .from("workflow_storage_locations")
        .select("id, folder_id")
        .in("folder_id", Array.from(affectedFolderIds));

      if (affectedLocations && affectedLocations.length > 0) {
        // Update folder_path for each affected location
        for (const location of affectedLocations) {
          if (location.folder_id) {
            const newPath = buildFolderPath(location.folder_id, updatedFolders);
            await supabase
              .from("workflow_storage_locations")
              .update({ folder_path: newPath })
              .eq("id", location.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-folders"] });
      queryClient.invalidateQueries({ queryKey: ["company-all-folders"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-storage-locations"] });
      toast.success(selectedFolders.size > 1 ? "Pastas movidas" : "Pasta movida");
      setMoveFolderDialogOpen(false);
      setFolderToMove(null);
      setSelectedFolders(new Set());
      setTargetFolderPath("__root__");
    },
    onError: (error: any) => {
      toast.error("Erro ao mover: " + error.message);
    },
  });

  const handleConfirmMoveFolder = () => {
    const folderIds = folderToMove?.id 
      ? [folderToMove.id] 
      : Array.from(selectedFolders);
    
    if (folderIds.length === 0) return;
    
    const targetParentId =
      targetFolderPath === "__root__"
        ? null
        : (folderOptions.find((f) => f.path === targetFolderPath)?.id ?? null);

    moveFolderMutation.mutate({ folderIds, targetParentId });
  };

  // Get available destination folders (excluding all selected folders and their descendants)
  const getAvailableFolderDestinations = useCallback((folderIdsToMove: string[]) => {
    if (!allFolders) return [];
    
    const descendants = new Set<string>();
    const findDescendants = (parentId: string) => {
      allFolders.forEach(f => {
        if (f.parent_folder_id === parentId) {
          descendants.add(f.id);
          findDescendants(f.id);
        }
      });
    };
    
    folderIdsToMove.forEach(folderId => {
      descendants.add(folderId);
      findDescendants(folderId);
    });
    
    return allFolders.filter(f => !descendants.has(f.id));
  }, [allFolders]);

  const folderMoveOptions = (() => {
    const folderIds = folderToMove?.id 
      ? [folderToMove.id] 
      : Array.from(selectedFolders);
    
    if (folderIds.length === 0) return [];
    
    return getAvailableFolderDestinations(folderIds).map(folder => ({
      id: folder.id,
      name: folder.name,
      path: getFolderPath(folder.id, allFolders || [])
    })).sort((a, b) => a.path.localeCompare(b.path));
  })();

  // Toggle folder selection
  const toggleFolderSelection = useCallback((folderId: string) => {
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Select/deselect all folders
  const toggleSelectAllFolders = useCallback(() => {
    if (selectedFolders.size === folders?.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(folders?.map(f => f.id) || []));
    }
  }, [folders, selectedFolders.size]);

  // Open bulk move folders dialog
  const openBulkMoveFolders = useCallback(() => {
    setFolderToMove(null);
    setTargetFolderPath("__root__");
    setMoveFolderDialogOpen(true);
  }, []);
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
                // If this doc is selected and there are multiple selected, update all selected
                const docsToUpdate = selectedDocs.has(doc.id) && selectedDocs.size > 1
                  ? Array.from(selectedDocs)
                  : [doc.id];
                
                if (column.isBuiltIn && column.dbField) {
                  docsToUpdate.forEach(docId => {
                    updateDocFieldMutation.mutate({ docId, field: column.dbField!, value: opt.label });
                  });
                } else {
                  setCustomData(prev => {
                    const updated = { ...prev };
                    docsToUpdate.forEach(docId => {
                      updated[docId] = { ...updated[docId], [column.id]: opt.label };
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

  // Calculate SHA-256 hash for file integrity
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Helper to recursively read folder entries - also returns empty folders
  const readAllEntries = async (
    entry: FileSystemEntry, 
    basePath: string = ""
  ): Promise<{ files: { file: File; path: string }[]; emptyFolders: string[] }> => {
    const files: { file: File; path: string }[] = [];
    const emptyFolders: string[] = [];
    
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      files.push({ file, path: basePath });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        const allEntries: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries((batch) => {
            if (batch.length === 0) {
              resolve(allEntries);
            } else {
              allEntries.push(...batch);
              readBatch();
            }
          }, reject);
        };
        readBatch();
      });
      
      const currentFolderPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      // If directory is empty, track it as an empty folder
      if (entries.length === 0) {
        emptyFolders.push(currentFolderPath);
      } else {
        for (const childEntry of entries) {
          const childResults = await readAllEntries(childEntry, currentFolderPath);
          files.push(...childResults.files);
          emptyFolders.push(...childResults.emptyFolders);
        }
      }
    }
    
    return { files, emptyFolders };
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const items = e.dataTransfer.items;
    const filesToUpload: { file: File; folderPath: string }[] = [];
    const emptyFoldersToCreate: string[] = [];
    
    // Check if any item is a folder using webkitGetAsEntry
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) {
        entries.push(entry);
      }
    }
    
    // If no entries (browser doesn't support), fall back to files
    if (entries.length === 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        filesToUpload.push({ file, folderPath: "" });
      }
    } else {
      // Process entries (may include folders)
      for (const entry of entries) {
        const results = await readAllEntries(entry, "");
        for (const r of results.files) {
          filesToUpload.push({ file: r.file, folderPath: r.path });
        }
        emptyFoldersToCreate.push(...results.emptyFolders);
      }
    }
    
    // Continue even if no files but there are empty folders to create
    if (filesToUpload.length === 0 && emptyFoldersToCreate.length === 0) return;
    
    setIsDropUploading(true);
    const totalItems = filesToUpload.length + emptyFoldersToCreate.length;
    setDropUploadProgress({ current: 0, total: totalItems });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Track created folders to avoid duplicates
      const createdFolders: Record<string, string> = {}; // path -> folder id
      
      // Helper to create a folder path
      const createFolderPath = async (folderPath: string) => {
        const pathParts = folderPath.split("/").filter(Boolean);
        let parentId = currentFolderId;
        let currentPath = "";
        
        for (const folderName of pathParts) {
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          
          if (createdFolders[currentPath]) {
            parentId = createdFolders[currentPath];
          } else {
            // Check if folder already exists
            let folderQuery = supabase
              .from("company_folders")
              .select("id")
              .eq("company_id", id)
              .eq("name", folderName);
            
            if (parentId) {
              folderQuery = folderQuery.eq("parent_folder_id", parentId);
            } else {
              folderQuery = folderQuery.is("parent_folder_id", null);
            }
            
            const { data: existingFolder } = await folderQuery.maybeSingle();
            
            if (existingFolder) {
              createdFolders[currentPath] = existingFolder.id;
              parentId = existingFolder.id;
            } else {
              // Create new folder
              const { data: newFolder, error: folderError } = await supabase
                .from("company_folders")
                .insert({
                  company_id: id,
                  name: folderName,
                  parent_folder_id: parentId || null,
                })
                .select("id")
                .single();
              
              if (folderError) {
                console.error("Failed to create folder:", folderError);
                return null;
              }
              
              createdFolders[currentPath] = newFolder.id;
              parentId = newFolder.id;
            }
          }
        }
        
        return parentId;
      };
      
      // First, create all empty folders
      let processedCount = 0;
      for (const emptyFolderPath of emptyFoldersToCreate) {
        processedCount++;
        setDropUploadProgress({ current: processedCount, total: totalItems });
        await createFolderPath(emptyFolderPath);
      }
      
      // Then process files
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, folderPath } = filesToUpload[i];
        processedCount++;
        setDropUploadProgress({ current: processedCount, total: totalItems });
        
        // Determine target folder
        let targetFolderId = currentFolderId;
        
        if (folderPath) {
          targetFolderId = await createFolderPath(folderPath);
        }
        
        // Calculate SHA-256 hash for forensic integrity
        const fileHash = await calculateFileHash(file);
        
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
            folder_id: targetFolderId || null,
            name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            document_type: "Other",
            status: "Draft",
            uploaded_by: user.id,
            file_hash: fileHash,
          });
        
        if (insertError) {
          toast.error(`Failed to save ${file.name}: ${insertError.message}`);
        }
      }
      
      invalidateDocuments();
      queryClient.invalidateQueries({ queryKey: ["company-folders", id] });
      
      const foldersCreated = emptyFoldersToCreate.length;
      const filesUploaded = filesToUpload.length;
      if (filesUploaded > 0 && foldersCreated > 0) {
        toast.success(`${filesUploaded} file(s) and ${foldersCreated} folder(s) created`);
      } else if (foldersCreated > 0) {
        toast.success(`${foldersCreated} empty folder(s) created`);
      } else {
        toast.success(`${filesUploaded} file(s) uploaded successfully`);
      }
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsDropUploading(false);
      setDropUploadProgress(null);
    }
  }, [id, currentFolderId, queryClient]);

  const handleDownload = async (doc: any) => {
    if (doc.server_path) {
      window.open(`/api/work-files/download?file=${encodeURIComponent(doc.server_path)}`, '_blank');
      return;
    }
    try {
      const fileUrl = String(doc.file_url || "");
      if (!fileUrl) throw new Error("URL do ficheiro em falta");

      const url = new URL(fileUrl);

      // Supports:
      // /storage/v1/object/public/<bucket>/<path>
      // /storage/v1/object/<bucket>/<path>
      // /storage/v1/object/sign/<bucket>/<path>
      const match = url.pathname.match(
        /\/storage\/v1\/object\/(?:public\/|sign\/)?([^/]+)\/(.+)$/
      );

      let blob: Blob | null = null;
      let downloadName: string = doc.name || "document";

      if (match) {
        const [, bucket, encodedPath] = match;
        const filePath = decodeURIComponent(encodedPath);

        // 1) Prefer Storage download (keeps auth + avoids CORS issues)
        const { data, error } = await supabase.storage.from(bucket).download(filePath);
        if (!error && data) blob = data;

        // 2) If we got a tiny blob (often an error body), fallback to signed URL fetch
        if (!blob || blob.size < 2048) {
          const { data: signed, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 60);

          if (!signError && signed?.signedUrl) {
            const res = await fetch(signed.signedUrl);
            if (res.ok) {
              const b = await res.blob();
              if (b.size >= 2048) blob = b;
            }
          }
        }
      }

      // 3) Last resort: fetch the URL directly
      if (!blob || blob.size < 2048) {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Falha ao descarregar o ficheiro");
        blob = await res.blob();
      }

      if (!blob || blob.size < 2048) {
        throw new Error("Ficheiro descarregado inválido (tamanho muito pequeno)");
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (error: any) {
      const message = error?.message ? String(error.message) : JSON.stringify(error);
      toast.error("Download failed: " + message);
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

  const generateInsights = async (forceRefresh = false) => {
    if (insightsLoading || !currentFolderId) return;
    
    // Only generate if forced, no content exists, or >60 days old
    if (!forceRefresh && insightsContent && insightsLastReviewed) {
      const daysSinceReview = (Date.now() - insightsLastReviewed.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceReview < 60) return;
    }
    
    setInsightsLoading(true);
    
    try {
      const folderName = folderPath?.length ? folderPath[folderPath.length - 1]?.name : 'Root';
      
      const response = await fetch(`https://zyziolikudoczsthyoja.supabase.co/functions/v1/folder-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5emlvbGlrdWRvY3pzdGh5b2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMjAxMzAsImV4cCI6MjA1NDg5NjEzMH0.d5XzCu7fxA18vPNw8XxkB_heIip9yzsQXh2atSx0OwY`,
        },
        body: JSON.stringify({
          folderName,
          companyName: company?.name || 'Unknown',
          documents: documents?.map(d => ({
            name: d.name,
            document_type: d.document_type,
            status: d.status,
            created_at: d.created_at,
          })),
          subfolders: folders?.map(f => ({ name: f.name })),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate insights');
      
      const data = await response.json();
      const insightText = data.insight;
      
      // Save or update insight in database
      if (insightsId) {
        await supabase
          .from('folder_insights')
          .update({ 
            insight_text: insightText, 
            last_reviewed_at: new Date().toISOString(),
            feedback: null 
          })
          .eq('id', insightsId);
      } else {
        const { data: newInsight } = await supabase
          .from('folder_insights')
          .insert({ 
            folder_id: currentFolderId, 
            insight_text: insightText 
          })
          .select()
          .single();
        
        if (newInsight) {
          setInsightsId(newInsight.id);
        }
      }
      
      setInsightsContent(insightText);
      setInsightsFeedback(null);
      setInsightsLastReviewed(new Date());
    } catch (error: any) {
      console.error('Insights error:', error);
      toast.error('Failed to generate insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  const saveFeedback = async (feedback: 'positive' | 'negative' | null) => {
    if (!insightsId) return;
    
    setInsightsFeedback(feedback);
    
    try {
      await supabase
        .from('folder_insights')
        .update({ feedback })
        .eq('id', insightsId);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === documents?.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents?.map(d => d.id)));
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

  // Documents are now filtered and sorted server-side via useDocumentsPaginated

  // Sort folders with natural sort (numeric: true) so "2" comes before "10"
  const sortedFolders = folders
    ?.slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const getFileIcon = (mimeType: string | null, name: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    
    // PDF - red
    if (mimeType?.includes("pdf") || ext === "pdf") {
      return <File className="h-4 w-4 text-red-600" />;
    }
    // Spreadsheets - green
    if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || ext === "xlsx" || ext === "xls" || ext === "csv") {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    // Word documents - blue
    if (mimeType?.includes("word") || ext === "doc" || ext === "docx") {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    // PowerPoint - orange
    if (mimeType?.includes("powerpoint") || mimeType?.includes("presentation") || ext === "ppt" || ext === "pptx") {
      return <FileType2 className="h-4 w-4 text-orange-500" />;
    }
    // Images - purple
    if (mimeType?.includes("image") || ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext || "")) {
      return <FileImage className="h-4 w-4 text-purple-600" />;
    }
    // Video - pink
    if (mimeType?.includes("video") || ["mp4", "avi", "mkv", "mov", "wmv", "webm"].includes(ext || "")) {
      return <FileVideo className="h-4 w-4 text-pink-600" />;
    }
    // Audio - cyan
    if (mimeType?.includes("audio") || ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext || "")) {
      return <FileAudio className="h-4 w-4 text-cyan-600" />;
    }
    // Archives - amber
    if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("7z") || ["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return <FileArchive className="h-4 w-4 text-amber-600" />;
    }
    // Code files - slate
    if (["js", "ts", "tsx", "jsx", "html", "css", "json", "xml", "py", "java", "cpp", "c", "h"].includes(ext || "")) {
      return <FileCode className="h-4 w-4 text-slate-600" />;
    }
    // Text files - gray
    if (mimeType?.includes("text") || ext === "txt") {
      return <FileText className="h-4 w-4 text-gray-600" />;
    }
    // Default
    return <File className="h-4 w-4 text-slate-500" />;
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
                      className="h-8 gap-1"
                      onClick={() => setBulkMoveDialogOpen(true)}
                    >
                      <FolderInput className="h-4 w-4" />
                      Mover para... ({selectedDocs.size})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1 text-primary hover:text-primary"
                      onClick={async () => {
                        const selectedDocsList = documents?.filter(d => selectedDocs.has(d.id)) || [];
                        let successCount = 0;
                        for (const doc of selectedDocsList) {
                          try {
                            // Extract bucket and path from Supabase URL
                            const url = new URL(doc.file_url);
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
                              a.download = doc.name;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(blobUrl);
                              successCount++;
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            window.open(doc.file_url, '_blank');
                          }
                          // Small delay between downloads
                          await new Promise(resolve => setTimeout(resolve, 300));
                        }
                        toast.success(`Downloaded ${successCount} of ${selectedDocsList.length} file(s)`);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download ({selectedDocs.size})
                    </Button>
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
                    onClick={(e) => { e.preventDefault(); navigate("/companies?tab=workflow"); }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Workflow
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); navigate("/companies?tab=entity"); }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Entity
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

          {/* AI Insights Section */}
          <div className="px-1 py-2">
            <div className="border border-slate-200 rounded-lg bg-slate-50/50">
              <button
                onClick={() => {
                  setInsightsExpanded(!insightsExpanded);
                  if (!insightsExpanded && insightsNeedRefresh && !insightsLoading && currentFolderId) {
                    generateInsights();
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-100/50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", insightsExpanded && "rotate-180")} />
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">Insights from GPT</span>
                </div>
              </button>
              
              {insightsExpanded && (
                <div className="px-4 pb-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ListChecks className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Folder highlights</span>
                        </div>
                        {insightsLoading ? (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Generating insights...</span>
                          </div>
                        ) : insightsContent ? (
                          <p className="text-sm text-slate-600 leading-relaxed">{insightsContent}</p>
                        ) : (
                          <p className="text-sm text-slate-400">Click to generate insights about this folder.</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveFeedback(insightsFeedback === 'positive' ? null : 'positive');
                          }}
                          className={cn(
                            "p-1.5 rounded hover:bg-slate-100 transition-colors",
                            insightsFeedback === 'positive' && "bg-green-100 text-green-600"
                          )}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveFeedback(insightsFeedback === 'negative' ? null : 'negative');
                          }}
                          className={cn(
                            "p-1.5 rounded hover:bg-slate-100 transition-colors",
                            insightsFeedback === 'negative' && "bg-red-100 text-red-600"
                          )}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2 h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInsights(true);
                          }}
                          disabled={insightsLoading}
                        >
                          {insightsLoading ? 'Loading...' : 'Refresh'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar for Folders */}
          {selectedFolders.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedFolders.size === folders?.length && folders.length > 0}
                  onCheckedChange={toggleSelectAllFolders}
                />
                <span className="text-sm font-medium">
                  {selectedFolders.size} pasta{selectedFolders.size > 1 ? 's' : ''} selecionada{selectedFolders.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openBulkMoveFolders}
                >
                  <FolderInput className="h-4 w-4 mr-2" />
                  Mover para...
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedFolders(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* SharePoint-style Dense Data Grid */}
          <div 
            className={cn(
              "bg-background border border-slate-200 rounded-b-lg overflow-hidden shadow-sm transition-colors relative",
              isDragOver && "border-primary border-2 bg-primary/5"
            )}
            onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
          >
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg z-10 pointer-events-none">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-primary">Drop files or folders here</p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox 
                        checked={selectedDocs.size === documents?.length && documents?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                      <SortHeader field="name">File</SortHeader>
                    </th>
                    {isColumnVisible("docDate") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        <SortHeader field="created_at">Date</SortHeader>
                      </th>
                    )}
                    {isColumnVisible("type") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs tracking-wider w-52">
                        Type
                      </th>
                    )}
                    {isColumnVisible("category") && (
                      <th className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        {renderColumnHeader(columns.find(c => c.id === "category")!)}
                      </th>
                    )}
                    {isColumnVisible("value") && (
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-32">
                        Value
                      </th>
                    )}
                    {isColumnVisible("status") && (
                      <th className="text-center px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-28">
                        {renderColumnHeader(columns.find(c => c.id === "status")!)}
                      </th>
                    )}
                    {isColumnVisible("tags") && (
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider w-48">
                        Tags
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
                  {sortedFolders?.map((folder) => (
                    <tr 
                      key={folder.id} 
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group",
                        selectedFolders.has(folder.id) && "bg-primary/10"
                      )}
                      onDoubleClick={() => setCurrentFolderId(folder.id)}
                    >
                      <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedFolders.has(folder.id)}
                          onCheckedChange={() => toggleFolderSelection(folder.id)}
                        />
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
                      {isColumnVisible("type") && (
                        <td className="px-3 py-1.5 text-slate-500 text-xs">Pasta de Ficheiros</td>
                      )}
                      {isColumnVisible("category") && (
                        <td className="px-3 py-1.5 text-center">
                          {renderFolderCellDropdown(folder, columns.find(c => c.id === "category")!)}
                        </td>
                      )}
                      {isColumnVisible("value") && (
                        <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      )}
                      {isColumnVisible("status") && (
                        <td className="px-3 py-1.5 text-center">
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
                            <DropdownMenuItem onClick={() => {
                              setRenamingFolderId(folder.id);
                              setRenameFolderName(folder.name);
                            }}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFavorite(folder.id)}>
                              <Star className={cn("h-4 w-4 mr-2", favoriteFolders.has(folder.id) && "fill-amber-400 text-amber-400")} />
                              {favoriteFolders.has(folder.id) ? "Remove from Favorites" : "Add to Favorites"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditFolderCategories(folder.id)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Categories
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFolderToMove(folder);
                              setTargetFolderPath("__root__");
                              setMoveFolderDialogOpen(true);
                            }}>
                              <FolderInput className="h-4 w-4 mr-2" />
                              Move to...
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
                  ) : (folders?.length === 0 && documents?.length === 0) ? (
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
                    documents?.map((doc) => (
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
                              onClick={() => setViewingDocument(doc)}
                              className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm text-left"
                            >
                              {doc.name.replace(/\.[^/.]+$/, '')}
                            </button>
                          </div>
                        </td>
                        {isColumnVisible("docDate") && (
                          <td className="px-3 py-2 text-slate-600 text-sm tabular-nums">
                            {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : "—"}
                          </td>
                        )}
                        {isColumnVisible("type") && (
                          <td className="px-3 py-2 text-slate-500 text-xs">
                            {getFileTypeLabel(doc.mime_type, doc.name)}
                          </td>
                        )}
                        {isColumnVisible("category") && (
                          <td className="px-3 py-2 text-center">
                            {renderCellDropdown(doc, columns.find(c => c.id === "category")!)}
                          </td>
                        )}
                        {isColumnVisible("value") && (
                          <td className="px-3 py-2 text-right">
                            <Popover 
                              open={valuePopoverOpen === doc.id} 
                              onOpenChange={(open) => {
                                setValuePopoverOpen(open ? doc.id : null);
                                if (open) {
                                  setEditingValue(doc.financial_value?.toString() || "");
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <button className="cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1 min-w-[60px] text-right">
                                  {doc.financial_value ? (
                                    <span className="font-mono text-sm font-medium text-slate-800">
                                      {formatCurrency(doc.financial_value)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-2" align="end">
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const numValue = parseFloat(editingValue) || null;
                                        updateDocFieldMutation.mutate({
                                          docId: doc.id,
                                          field: "financial_value",
                                          value: numValue as any
                                        });
                                        setValuePopoverOpen(null);
                                      }
                                    }}
                                    className="h-8 text-sm font-mono"
                                  />
                                  <Button 
                                    size="sm" 
                                    className="w-full h-7"
                                    onClick={() => {
                                      const numValue = parseFloat(editingValue) || null;
                                      updateDocFieldMutation.mutate({
                                        docId: doc.id,
                                        field: "financial_value",
                                        value: numValue as any
                                      });
                                      setValuePopoverOpen(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        )}
                        {isColumnVisible("status") && (
                          <td className="px-3 py-2 text-center">
                            {renderCellDropdown(doc, columns.find(c => c.id === "status")!)}
                          </td>
                        )}
                        {isColumnVisible("tags") && (
                          <td className="px-3 py-2">
                            <Popover open={tagPopoverOpen === doc.id} onOpenChange={(open) => setTagPopoverOpen(open ? doc.id : null)}>
                              <PopoverTrigger asChild>
                                <button className="flex flex-wrap items-center gap-1 min-h-[24px] cursor-pointer hover:bg-slate-50 rounded px-1 -mx-1">
                                  {doc.tags && doc.tags.length > 0 ? (
                                    doc.tags.map((tag: string) => {
                                      const tagColor = getTagColor(tag);
                                      return (
                                        <span 
                                          key={tag}
                                          className="inline-flex items-center gap-1 px-1.5 py-0 rounded text-xs font-medium"
                                          style={{ 
                                            backgroundColor: tagColor ? `${tagColor}20` : '#e5e7eb',
                                            color: tagColor || '#374151',
                                            borderColor: tagColor ? `${tagColor}40` : '#d1d5db',
                                            borderWidth: '1px'
                                          }}
                                        >
                                          {tag}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveTag(doc.id, doc.tags, tag);
                                            }}
                                            className="hover:opacity-70 rounded-full"
                                          >
                                            <X className="h-2.5 w-2.5" />
                                          </button>
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      Add tag
                                    </span>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2" align="start">
                                <div className="space-y-2">
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="New tag..."
                                      value={newTagInput}
                                      onChange={(e) => setNewTagInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddTag(doc.id, doc.tags, newTagInput);
                                        }
                                      }}
                                      className="h-7 text-xs"
                                    />
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-2"
                                      onClick={() => handleAddTag(doc.id, doc.tags, newTagInput)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {getTagOptions().length > 0 && (
                                    <div className="border-t pt-2">
                                      <p className="text-xs text-muted-foreground mb-1">Quick add:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {getTagOptions().filter(t => !doc.tags?.includes(t.label)).slice(0, 6).map((tagOpt) => (
                                          <span
                                            key={tagOpt.label}
                                            className="inline-flex items-center px-1.5 py-0 rounded text-xs font-medium cursor-pointer hover:opacity-80"
                                            style={{ 
                                              backgroundColor: `${tagOpt.color}20`,
                                              color: tagOpt.color,
                                              borderColor: `${tagOpt.color}40`,
                                              borderWidth: '1px'
                                            }}
                                            onClick={() => handleAddTag(doc.id, doc.tags, tagOpt.label)}
                                          >
                                            {tagOpt.label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
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
                                <DropdownMenuItem onClick={() => {
                                  setDocToMove(doc);
                                  setMoveFolderPath("__root__");
                                  setMoveDialogOpen(true);
                                }}>
                                  <FolderInput className="h-4 w-4 mr-2" />
                                  Mover para Pasta
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
            {((folders?.length || 0) + (documents?.length || 0)) > 0 && (
              <div className="px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                <div>
                  {folders?.length ? `${folders.length} folder${folders.length !== 1 ? 's' : ''}` : ''}
                  {folders?.length && documents?.length ? ', ' : ''}
                  {documents?.length ? `${documents.length} of ${documentsTotalCount} file${documentsTotalCount !== 1 ? 's' : ''}` : ''}
                  {selectedDocs.size > 0 && ` • ${selectedDocs.size} selected`}
                </div>
                {hasNextPage && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={loadMore}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading..." : "Load More"}
                  </Button>
                )}
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

      {/* Rename Folder Dialog */}
      <Dialog open={!!renamingFolderId} onOpenChange={(open) => !open && setRenamingFolderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="renameFolderName">Folder Name</Label>
            <Input
              id="renameFolderName"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Enter new folder name..."
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameFolderName.trim() && renamingFolderId) {
                  updateFolderFieldMutation.mutate({
                    folderId: renamingFolderId,
                    field: "name",
                    value: renameFolderName.trim()
                  });
                  setRenamingFolderId(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolderId(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (renamingFolderId && renameFolderName.trim()) {
                  updateFolderFieldMutation.mutate({
                    folderId: renamingFolderId,
                    field: "name",
                    value: renameFolderName.trim()
                  });
                  setRenamingFolderId(null);
                }
              }}
              disabled={!renameFolderName.trim() || updateFolderFieldMutation.isPending}
            >
              Rename
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

      {/* Move Document Dialog */}
      <Dialog
        open={moveDialogOpen}
        onOpenChange={(open) => {
          setMoveDialogOpen(open);
          if (!open) {
            setDocToMove(null);
            setMoveFolderPath("__root__");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mover para Pasta</DialogTitle>
            <DialogDescription>
              Selecione a pasta de destino para este ficheiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/20 rounded-lg border">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ficheiro</Label>
              <p className="mt-1 text-sm font-medium break-all">{docToMove?.name}</p>
            </div>

            <div className="space-y-2">
              <Label>Pasta de Destino</Label>
              <Popover open={moveFolderPopoverOpen} onOpenChange={setMoveFolderPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {moveFolderPath === "__root__" 
                      ? "📁 Raiz (sem pasta)" 
                      : `📂 ${moveFolderPath}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar pasta..." />
                    <CommandList className="max-h-48 overflow-y-auto">
                      <CommandEmpty>Nenhuma pasta encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          value="__root__"
                          onSelect={() => {
                            setMoveFolderPath("__root__");
                            setMoveFolderPopoverOpen(false);
                          }}
                        >
                          📁 Raiz (sem pasta)
                        </CommandItem>
                        {folderOptions.map((f) => (
                          <CommandItem 
                            key={f.id} 
                            value={f.path}
                            onSelect={() => {
                              setMoveFolderPath(f.path);
                              setMoveFolderPopoverOpen(false);
                            }}
                          >
                            📂 {f.path}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMove} disabled={moveDocumentMutation.isPending}>
              {moveDocumentMutation.isPending ? "A mover..." : "Mover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Documents Dialog */}
      <Dialog
        open={bulkMoveDialogOpen}
        onOpenChange={(open) => {
          setBulkMoveDialogOpen(open);
          if (!open) {
            setBulkMoveFolderPath("__root__");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mover {selectedDocs.size} Ficheiro(s) para Pasta</DialogTitle>
            <DialogDescription>
              Selecione a pasta de destino para os ficheiros selecionados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/20 rounded-lg border">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ficheiros Selecionados</Label>
              <p className="mt-1 text-sm font-medium">{selectedDocs.size} ficheiro(s)</p>
            </div>

            <div className="space-y-2">
              <Label>Pasta de Destino</Label>
              <Popover open={bulkMoveFolderPopoverOpen} onOpenChange={setBulkMoveFolderPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {bulkMoveFolderPath === "__root__" 
                      ? "📁 Raiz (sem pasta)" 
                      : `📂 ${bulkMoveFolderPath}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar pasta..." />
                    <CommandList className="max-h-48 overflow-y-auto">
                      <CommandEmpty>Nenhuma pasta encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          value="__root__"
                          onSelect={() => {
                            setBulkMoveFolderPath("__root__");
                            setBulkMoveFolderPopoverOpen(false);
                          }}
                        >
                          📁 Raiz (sem pasta)
                        </CommandItem>
                        {folderOptions.map((f) => (
                          <CommandItem 
                            key={f.id} 
                            value={f.path}
                            onSelect={() => {
                              setBulkMoveFolderPath(f.path);
                              setBulkMoveFolderPopoverOpen(false);
                            }}
                          >
                            📂 {f.path}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmBulkMove} disabled={bulkMoveDocumentsMutation.isPending}>
              {bulkMoveDocumentsMutation.isPending ? "A mover..." : `Mover ${selectedDocs.size} ficheiro(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Folder Dialog */}
      <Dialog
        open={moveFolderDialogOpen}
        onOpenChange={(open) => {
          setMoveFolderDialogOpen(open);
          if (!open) {
            setFolderToMove(null);
            setTargetFolderPath("__root__");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {folderToMove 
                ? `Mover Pasta "${folderToMove.name}"` 
                : `Mover ${selectedFolders.size} Pasta${selectedFolders.size > 1 ? 's' : ''}`}
            </DialogTitle>
            <DialogDescription>
              Selecione a pasta de destino.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/20 rounded-lg border">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {folderToMove ? 'Pasta' : `${selectedFolders.size} Pasta${selectedFolders.size > 1 ? 's' : ''} Selecionada${selectedFolders.size > 1 ? 's' : ''}`}
              </Label>
              {folderToMove ? (
                <p className="mt-1 text-sm font-medium break-all flex items-center gap-2">
                  <Folder className="h-4 w-4 text-amber-500" />
                  {folderToMove.name}
                </p>
              ) : (
                <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                  {Array.from(selectedFolders).map(folderId => {
                    const folder = allFolders?.find(f => f.id === folderId);
                    return folder ? (
                      <p key={folderId} className="text-sm font-medium flex items-center gap-2">
                        <Folder className="h-4 w-4 text-amber-500" />
                        {folder.name}
                      </p>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Pasta de Destino</Label>
              <Popover open={targetFolderPopoverOpen} onOpenChange={setTargetFolderPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {targetFolderPath === "__root__" 
                      ? "📁 Raiz (sem pasta)" 
                      : `📂 ${targetFolderPath}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar pasta..." />
                    <CommandList className="max-h-48 overflow-y-auto">
                      <CommandEmpty>Nenhuma pasta encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          value="__root__"
                          onSelect={() => {
                            setTargetFolderPath("__root__");
                            setTargetFolderPopoverOpen(false);
                          }}
                        >
                          📁 Raiz (sem pasta)
                        </CommandItem>
                        {folderMoveOptions.map((f) => (
                          <CommandItem 
                            key={f.id} 
                            value={f.path}
                            onSelect={() => {
                              setTargetFolderPath(f.path);
                              setTargetFolderPopoverOpen(false);
                            }}
                          >
                            📂 {f.path}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMoveFolder} disabled={moveFolderMutation.isPending}>
              {moveFolderMutation.isPending ? "A mover..." : "Mover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Document Preview Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className={cn("h-[90vh] flex flex-col p-0", showDocAIPanel ? "max-w-[90vw]" : "max-w-4xl")}>
          <DialogHeader className="p-4 pb-0 flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              Visualizar Documento
              <div className="flex items-center gap-2 mr-8">
                <Button
                  variant={showDocAIPanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDocAIPanel(!showDocAIPanel)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Análise AI
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingDocument(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingDocument && (
            <div className="flex-1 overflow-hidden flex">
              <div className={cn("flex-1 overflow-hidden p-4", showDocAIPanel && "border-r")}>
                <DocumentPreview 
                  document={viewingDocument}
                  onDownload={() => handleDownload(viewingDocument)}
                />
              </div>
              {showDocAIPanel && (
                <div className="w-[350px] flex-shrink-0">
                  <DocumentAIPanel
                    fileUrl={viewingDocument.file_url}
                    fileName={viewingDocument.name}
                    mimeType={viewingDocument.mime_type}
                    documentId={viewingDocument.id}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Upload Progress Indicator */}
      {dropUploadProgress && (
        <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Uploading files...</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{dropUploadProgress.current} of {dropUploadProgress.total} files</span>
              <span>{Math.round((dropUploadProgress.current / dropUploadProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${(dropUploadProgress.current / dropUploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
