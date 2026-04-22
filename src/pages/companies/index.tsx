import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Edit, Trash2, Eye, Settings, ChevronDown, X, ListTodo, Link2, Bookmark, FolderKanban, HardDrive, ArrowUpFromLine, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkFlowTab from "./WorkFlowTab";
import WorkFilesTab from "./WorkFilesTab";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import CompanyDialog from "@/components/financial/CompanyDialog";
import { ServerFolderPickerDialog } from "@/components/companies/ServerFolderPickerDialog";
import { useFileServerBaseUrl, getWorkFilesListUrl, resolvePublicFileFetchUrl } from "@/hooks/useFileServerBaseUrl";
import { resolveWorkflowDiskRelativePath } from "@/lib/workflowServerPath";

interface ColumnOption {
  label: string;
  color: string;
}

interface CustomColumn {
  id: string;
  label: string;
  dbField: string; // 'status' | 'risk_rating' for built-in, custom id for custom
  options: ColumnOption[];
  isBuiltIn: boolean;
}

const COLOR_PRESETS = [
  "#fecaca", // Light red
  "#dc2626", // Dark red
  "#fed7aa", // Light orange
  "#fef08a", // Light yellow
  "#bbf7d0", // Light green
  "#bae6fd", // Light sky
  "#93c5fd", // Light blue
  "#3b82f6", // Bright blue
  "#1e40af", // Dark blue
  "#ddd6fe", // Light purple
  "#7c3aed", // Dark purple
  "#fbcfe8", // Light pink
];

const isDarkColor = (color: string | undefined): boolean => {
  if (!color) return false;
  const darkColors = ["#1e40af", "#1e3a8a", "#312e81", "#4c1d95", "#831843", "#7f1d1d", "#dc2626", "#b91c1c", "#991b1b", "#7c3aed", "#6d28d9", "#5b21b6", "#3b82f6", "#2563eb", "#ef4444"];
  return darkColors.includes(color.toLowerCase());
};

const DEFAULT_COLUMNS: CustomColumn[] = [
  {
    id: "status",
    label: "Status",
    dbField: "status",
    isBuiltIn: true,
    options: [
      { label: "Active", color: "#bbf7d0" },
      { label: "Liquidated", color: "#fef08a" },
      { label: "Under Investigation", color: "#dc2626" },
      { label: "Closed", color: "#e5e7eb" },
    ],
  },
  {
    id: "riskRating",
    label: "Risk Rating",
    dbField: "risk_rating",
    isBuiltIn: true,
    options: [
      { label: "Low", color: "#bbf7d0" },
      { label: "Medium", color: "#fef08a" },
      { label: "High", color: "#fed7aa" },
      { label: "Critical", color: "#dc2626" },
    ],
  },
];

const CUSTOM_COLUMNS_KEY = "companies-custom-columns";
const COMPANY_CUSTOM_DATA_KEY = "companies-custom-data";
const TABLE_RELATIONS_KEY = "work-table-relations";

/** Pastas na raiz do servidor — ver também `.env` `VITE_WORKFLOW_SERVER_ROOT_PRESETS`. */
const SERVER_ROOT_PRESETS: string[] = String(import.meta.env.VITE_WORKFLOW_SERVER_ROOT_PRESETS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Presets por omissão (disco real em /data/nvme); funde-se com env e BD. */
const DEFAULT_WORK_SERVER_ROOT_PRESETS = ["Splendidoption (PT)", "Splendidoption (PT)/Work"];

/** Subpasta sob WORK_FILES_ROOT para o dropdown «Pasta no servidor» (ex. `Work` ou `Splendidoption`). Vazio = raiz. */
const WORK_FILES_LIST_FOLDER: string = String(import.meta.env.VITE_WORK_FILES_LIST_FOLDER || "").trim();

interface StorageLocation {
  id: string;
  company_id: string;
  folder_id: string | null;
  year: number;
  month: number;
  folder_path: string | null;
  server_root: string | null;
}

interface ProjectStorageLocation {
  id: string;
  project_id: string;
  folder_path: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TableRelationsConfig {
  defaultCompanyId: string | null;
  autoCreateTransaction: boolean;
  linkWorkflowToFinance: boolean;
  storeFilesInCompanyDocs: boolean;
  /** Novos uploads no WorkFlow: servidor (workflow_storage_locations) ou legado Supabase attachments. */
  workflowUploadTarget?: "server" | "supabase";
  /**
   * Movimento Draft com tipo «Documento»: forçar cópia do PDF para o VPS (Pasta de destino / mês)
   * mesmo quando «Novos ficheiros WorkFlow» está em Supabase.
   */
  documentDraftForceServerCopy?: boolean;
  /**
   * Movimento Draft com tipo «Documento»: gravar/atualizar entrada em `company_documents`
   * mesmo quando o WorkFlow está em modo servidor (VPS).
   */
  documentDraftForceCompanyLibrary?: boolean;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

/** Caminho inicial no picker do VPS (sem duplicar prefixo/pasta). */
function workflowServerListInitialPath(
  serverRoot: string | null | undefined,
  folderPath: string | null | undefined
): string {
  return resolveWorkflowDiskRelativePath(serverRoot?.trim() ?? "", folderPath?.trim() ?? "");
}

export default function CompaniesPage() {
  const { user, loading: authLoading } = useAuth();
  const fileServerBaseUrl = useFileServerBaseUrl();

  const { data: apiServerHealth } = useQuery({
    queryKey: ["api-server-health", fileServerBaseUrl],
    queryFn: async () => {
      const base = fileServerBaseUrl?.trim() ? fileServerBaseUrl.replace(/\/$/, "") : "";
      const url = base ? `${base}/api/health` : "/api/health";
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as { work_files_roots?: string[]; status?: string };
    },
    staleTime: 60_000,
    retry: 1,
  });

  const [searchParams] = useSearchParams();

  const [serverFolderPicker, setServerFolderPicker] = useState<{
    open: boolean;
    mode: "row" | "form";
    locationId: string | null;
    initialPath: string;
  }>({ open: false, mode: "row", locationId: null, initialPath: "" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Map URL tab param to internal tab values
  const getInitialTab = () => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "entity") return "list";
    if (urlTab === "workflow") return "workflow";
    if (urlTab === "work") return "work";
    if (urlTab === "settings") return "settings";
    return "workflow";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Sync tab with URL params when they change
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "entity") setActiveTab("list");
    else if (urlTab === "workflow") setActiveTab("workflow");
    else if (urlTab === "work") setActiveTab("work");
    else if (urlTab === "settings") setActiveTab("settings");
  }, [searchParams]);

  // Custom columns (editable columns with options)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>(() => {
    const saved = localStorage.getItem(CUSTOM_COLUMNS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Custom data per company (for non-DB columns)
  const [customData, setCustomData] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(COMPANY_CUSTOM_DATA_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  // Edit dialogs
  const [editColumnDialog, setEditColumnDialog] = useState<{ open: boolean; columnId: string | null; isNew?: boolean }>({ open: false, columnId: null });
  const [editColumnName, setEditColumnName] = useState("");
  const [editColumnOptions, setEditColumnOptions] = useState<ColumnOption[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");
  
  // Add column dialog
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  
  // Storage location dialog
  const [storageLocationDialog, setStorageLocationDialog] = useState<{ open: boolean; editingId: string | null }>({ open: false, editingId: null });
  const [storageLocationCompanyFilter, setStorageLocationCompanyFilter] = useState<string>("all");
  const [storageLocationForm, setStorageLocationForm] = useState<{
    company_id: string;
    folder_id: string | null;
    year: number;
    month: number;
    folder_path: string;
    server_root: string;
  }>({
    company_id: "",
    folder_id: null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    folder_path: "",
    server_root: ""
  });
  const [migratingLocationId, setMigratingLocationId] = useState<string | null>(null);

  // Project storage location dialog
  const [projectStorageDialog, setProjectStorageDialog] = useState<{ open: boolean; editingId: string | null }>({ open: false, editingId: null });
  const [projectStorageForm, setProjectStorageForm] = useState<{
    project_id: string;
    folder_path: string;
    description: string;
  }>({
    project_id: "",
    folder_path: "",
    description: ""
  });

  // Generate year options (current year - 2 to current year + 5)
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

  // Table relations config (without storageLocations - those are in Supabase now)
  const [tableRelations, setTableRelations] = useState<TableRelationsConfig>(() => {
    const saved = localStorage.getItem(TABLE_RELATIONS_KEY);
    const defaults: TableRelationsConfig = { 
      defaultCompanyId: null, 
      autoCreateTransaction: true, 
      linkWorkflowToFinance: true,
      storeFilesInCompanyDocs: true,
      workflowUploadTarget: "server",
      documentDraftForceServerCopy: false,
      documentDraftForceCompanyLibrary: false,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Remove storageLocations from localStorage if present (migrated to Supabase)
        const { storageLocations, ...rest } = parsed;
        return { ...defaults, ...rest };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  // Fetch storage locations from Supabase
  const {
    data: storageLocations = [],
    refetch: refetchStorageLocations,
    isLoading: storageLocationsLoading,
    error: storageLocationsError,
  } = useQuery({
    queryKey: ["workflow-storage-locations", user?.id ?? "anon"],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];
      // Mesmas empresas que o utilizador vê na lista (RLS: owner_id ou company_users). Não usar user_id — não existe em companies.
      const { data: visibleCompanies, error: companiesError } = await supabase
        .from("companies")
        .select("id");
      if (companiesError) throw companiesError;
      const companyIds = (visibleCompanies || []).map((c) => c.id);
      if (companyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("workflow_storage_locations")
        .select("*")
        .in("company_id", companyIds)
        .order("company_id", { ascending: true })
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      return data as StorageLocation[];
    },
  });

  // Mutation to create storage location
  const createStorageLocationMutation = useMutation({
    mutationFn: async (location: Omit<StorageLocation, 'id'>) => {
      const { data, error } = await supabase
        .from('workflow_storage_locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchStorageLocations();
      toast.success("Location added");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("A location for this company/year/month already exists");
      } else {
        toast.error("Failed to add location");
      }
    }
  });

  // Mutation to update storage location
  const updateStorageLocationMutation = useMutation({
    mutationFn: async ({ id, ...location }: StorageLocation) => {
      const { data, error } = await supabase
        .from('workflow_storage_locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchStorageLocations();
      toast.success("Location updated");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("A location for this company/year/month already exists");
      } else {
        toast.error("Failed to update location");
      }
    }
  });

  // Mutation to delete storage location
  const deleteStorageLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflow_storage_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchStorageLocations();
      toast.success("Location deleted");
    },
    onError: () => {
      toast.error("Failed to delete location");
    }
  });

  // Fetch expense projects for project storage location dialog
  const { data: expenseProjects = [] } = useQuery({
    queryKey: ["expense-projects-for-storage"],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_projects")
        .select("id, name, color, is_active")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch project storage locations from Supabase
  const {
    data: projectStorageLocations = [],
    refetch: refetchProjectStorageLocations,
    isLoading: projectStorageLoading,
    error: projectStorageError,
  } = useQuery({
    queryKey: ["project-storage-locations", user?.id ?? "anon"],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];
      const userProjectIds = expenseProjects.map(p => p.id);
      if (userProjectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("project_storage_locations")
        .select("*")
        .in("project_id", userProjectIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectStorageLocation[];
    },
  });

  // Mutation to create project storage location
  const createProjectStorageMutation = useMutation({
    mutationFn: async (location: Omit<ProjectStorageLocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('project_storage_locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchProjectStorageLocations();
      toast.success("Project location added");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("This project already has a storage location");
      } else {
        toast.error("Failed to add project location");
      }
    }
  });

  // Mutation to update project storage location
  const updateProjectStorageMutation = useMutation({
    mutationFn: async ({ id, ...location }: ProjectStorageLocation) => {
      const { data, error } = await supabase
        .from('project_storage_locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchProjectStorageLocations();
      toast.success("Project location updated");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("This project already has a storage location");
      } else {
        toast.error("Failed to update project location");
      }
    }
  });

  // Mutation to delete project storage location
  const deleteProjectStorageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_storage_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchProjectStorageLocations();
      toast.success("Project location deleted");
    },
    onError: () => {
      toast.error("Failed to delete project location");
    }
  });
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Persist custom columns
  useEffect(() => {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(customColumns));
  }, [customColumns]);

  // Persist custom data
  useEffect(() => {
    localStorage.setItem(COMPANY_CUSTOM_DATA_KEY, JSON.stringify(customData));
  }, [customData]);

  // Persist table relations
  useEffect(() => {
    localStorage.setItem(TABLE_RELATIONS_KEY, JSON.stringify(tableRelations));
    try {
      window.dispatchEvent(new CustomEvent("work-table-relations-changed"));
    } catch {
      /* ignore */
    }
  }, [tableRelations]);

  const openEditColumnDialog = (columnId: string) => {
    const col = customColumns.find(c => c.id === columnId);
    if (!col) return;
    
    setEditColumnName(col.label);
    setEditColumnOptions([...col.options]);
    setNewOptionInput("");
    setEditColumnDialog({ open: true, columnId });
  };
  
  const saveColumnSettings = () => {
    const columnId = editColumnDialog.columnId;
    if (!columnId) return;
    
    setCustomColumns(prev => prev.map(col => 
      col.id === columnId 
        ? { ...col, label: editColumnName, options: editColumnOptions }
        : col
    ));
    
    setEditColumnDialog({ open: false, columnId: null });
    toast.success("Column settings saved");
  };

  const deleteColumn = (columnId: string) => {
    const col = customColumns.find(c => c.id === columnId);
    if (col?.isBuiltIn) {
      toast.error("Cannot delete built-in columns");
      return;
    }
    
    setCustomColumns(prev => prev.filter(c => c.id !== columnId));
    setEditColumnDialog({ open: false, columnId: null });
    toast.success("Column deleted");
  };

  const addNewColumn = () => {
    if (!newColumnName.trim()) {
      toast.error("Please enter a column name");
      return;
    }
    
    const newId = `custom_${Date.now()}`;
    const newColumn: CustomColumn = {
      id: newId,
      label: newColumnName.trim(),
      dbField: newId,
      isBuiltIn: false,
      options: [
        { label: "Option 1", color: "#bbf7d0" },
        { label: "Option 2", color: "#fef08a" },
      ],
    };
    
    setCustomColumns(prev => [...prev, newColumn]);
    setAddColumnDialog(false);
    setNewColumnName("");
    toast.success("Column added");
    
    // Open edit dialog for the new column
    setTimeout(() => openEditColumnDialog(newId), 100);
  };
  
  const addOption = () => {
    if (newOptionInput.trim() && !editColumnOptions.some(o => o.label === newOptionInput.trim())) {
      setEditColumnOptions([...editColumnOptions, { label: newOptionInput.trim(), color: "#e5e7eb" }]);
      setNewOptionInput("");
    }
  };
  
  const removeOption = (label: string) => {
    setEditColumnOptions(editColumnOptions.filter(o => o.label !== label));
  };

  const updateOptionColor = (label: string, color: string) => {
    setEditColumnOptions(editColumnOptions.map(o => 
      o.label === label ? { ...o, color } : o
    ));
  };

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies", user?.id ?? "anon"],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: serverFolders = [], isError: serverFoldersQueryError } = useQuery({
    queryKey: ["work-server-folders", fileServerBaseUrl, WORK_FILES_LIST_FOLDER],
    queryFn: async () => {
      const res = await fetch(getWorkFilesListUrl(fileServerBaseUrl, WORK_FILES_LIST_FOLDER));
      if (!res.ok) {
        throw new Error(`API work-files/list: HTTP ${res.status}`);
      }
      const data = await res.json();
      return (data.items || [])
        .filter((i: any) => i.type === "dir")
        .map((i: any) => i.name);
    },
    retry: 1,
  });

  const mergedServerFolderOptions = useMemo(() => {
    const fromDb = (storageLocations ?? [])
      .map((l) => l.server_root)
      .filter((s): s is string => !!s && s.trim().length > 0);
    const set = new Set<string>([
      ...DEFAULT_WORK_SERVER_ROOT_PRESETS,
      ...SERVER_ROOT_PRESETS,
      ...fromDb,
      ...serverFolders,
    ]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [storageLocations, serverFolders]);

  const updateServerRootMutation = useMutation({
    mutationFn: async ({ id, server_root }: { id: string; server_root: string | null }) => {
      const { error } = await supabase
        .from("workflow_storage_locations")
        .update({ server_root })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchStorageLocations();
      toast.success("Pasta no servidor actualizada");
    },
    onError: () => {
      toast.error("Não foi possível actualizar a pasta no servidor");
    },
  });

  const handleMigrateFiles = async (location: StorageLocation) => {
    const root = (location.server_root || "").trim();
    if (!root) {
      toast.error("Defina a pasta no servidor para esta linha.");
      return;
    }
    setMigratingLocationId(location.id);
    try {
      const { data: files, error } = await supabase
        .from("workflow_files")
        .select("id, file_name, file_url, server_path")
        .eq("company_id", location.company_id)
        .is("server_path", null);

      if (error) throw error;
      if (!files || files.length === 0) {
        toast.info("Nenhum ficheiro para migrar nesta localização");
        setMigratingLocationId(null);
        return;
      }

      const sub = (location.folder_path || "").trim().replace(/^\/+/, "");
      const targetFolder = sub ? `${root.replace(/\/+$/, "")}/${sub}` : root;
      const migrateUrl = fileServerBaseUrl
        ? `${fileServerBaseUrl.replace(/\/$/, "")}/api/work-files/migrate`
        : "/api/work-files/migrate";
      const res = await fetch(migrateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: fileServerBaseUrl ? "include" : "same-origin",
        body: JSON.stringify({
          files: files.map((f) => ({
            id: f.id,
            file_name: f.file_name,
            file_url: resolvePublicFileFetchUrl(f.file_url),
          })),
          target_folder: targetFolder,
        }),
      });

      if (!res.ok) throw new Error("Pedido de migração falhou");
      const { results } = await res.json();

      let successCount = 0;
      for (const result of results) {
        if (result.server_path) {
          await supabase
            .from("workflow_files")
            .update({ server_path: result.server_path })
            .eq("id", result.id);
          successCount++;
        }
      }

      const errorCount = results.filter((r: any) => r.error).length;
      if (errorCount > 0) {
        toast.warning(`${successCount} migrados, ${errorCount} failed`);
      } else {
        toast.success(`${successCount} ficheiro(s) migrados para o servidor`);
      }
    } catch (err: any) {
      toast.error(`Erro na migração: ${err.message}`);
    } finally {
      setMigratingLocationId(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({ [field]: value })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Updated successfully");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateCustomData = (companyId: string, columnId: string, value: string) => {
    setCustomData(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [columnId]: value,
      },
    }));
    toast.success("Updated successfully");
  };

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.tax_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColumnValue = (company: any, column: CustomColumn): string | null => {
    if (column.isBuiltIn) {
      return (company as any)[column.dbField] || null;
    }
    return customData[company.id]?.[column.id] || null;
  };

  const getBadge = (value: string | null, column: CustomColumn) => {
    const option = column.options.find(o => o.label === value);
    if (option) {
      return (
        <Badge 
          style={{ 
            backgroundColor: option.color,
            color: isDarkColor(option.color) ? '#ffffff' : '#000000',
            borderColor: option.color
          }}
        >
          {option.label}
        </Badge>
      );
    }
    return <Badge className="bg-slate-100 text-slate-600">{value || "—"}</Badge>;
  };
  
  const renderColumnHeader = (col: CustomColumn) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900">
            {col.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => openEditColumnDialog(col.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Column
          </DropdownMenuItem>
          {!col.isBuiltIn && (
            <DropdownMenuItem 
              onClick={() => {
                if (confirm("Delete this column?")) {
                  deleteColumn(col.id);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Options:</div>
          {col.options.map((option) => (
            <DropdownMenuItem key={option.label} disabled className="text-sm flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderCellDropdown = (company: any, column: CustomColumn) => {
    const currentValue = getColumnValue(company, column);
    
    return (
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              {getBadge(currentValue, column)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[120px]">
            {column.options.map((option) => (
              <DropdownMenuItem 
                key={option.label}
                onClick={() => {
                  if (column.isBuiltIn) {
                    updateCompanyMutation.mutate({ 
                      id: company.id, 
                      field: column.dbField, 
                      value: option.label 
                    });
                  } else {
                    updateCustomData(company.id, column.id, option.label);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-[#faf9f8] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Work</h1>
          <p className="text-slate-500 text-sm">Manage corporate entities, assets and recovery dossiers</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Company
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-slate-200 rounded-none p-0 h-auto w-full justify-start">
          <TabsTrigger 
            value="workflow" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <ListTodo className="h-4 w-4 mr-2" />
            WorkFlow
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Entity
          </TabsTrigger>
          <TabsTrigger 
            value="work" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            WorkFinance
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name or Tax ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Companies Table */}
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead>
                    <span className="font-semibold text-slate-700">Company Name</span>
                  </TableHead>
                  <TableHead>
                    <span className="font-semibold text-slate-700">Tax ID</span>
                  </TableHead>
                  <TableHead>
                    <span className="font-semibold text-slate-700">Jurisdiction</span>
                  </TableHead>
                  {customColumns.map((col) => (
                    <TableHead key={col.id}>
                      {renderColumnHeader(col)}
                    </TableHead>
                  ))}
                  <TableHead className="w-10">
                    <button 
                      onClick={() => setAddColumnDialog(true)}
                      className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      title="Add column"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="font-semibold text-slate-700">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5 + customColumns.length} className="text-center py-8 text-muted-foreground">
                      Loading companies...
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5 + customColumns.length} className="text-center py-8 text-muted-foreground">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies?.map((company) => (
                    <TableRow 
                      key={company.id} 
                      className="cursor-pointer hover:bg-slate-50 border-b border-slate-100"
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{company.tax_id}</TableCell>
                      <TableCell>{(company as any).jurisdiction || company.country || "—"}</TableCell>
                      {customColumns.map((col) => renderCellDropdown(company, col))}
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/companies/${company.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCompany(company);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this company?")) {
                                deleteMutation.mutate(company.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Tabs defaultValue="columns" className="w-full">
            <TabsList className="bg-transparent border-b border-slate-200 rounded-none h-auto p-0 w-full justify-start">
              <TabsTrigger 
                value="columns" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                Custom Columns
              </TabsTrigger>
              <TabsTrigger 
                value="relations" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Table Relations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="columns" className="mt-6">
              <div className="border border-slate-200 rounded-lg bg-white p-6 max-w-2xl">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Custom Columns</h2>
                <p className="text-sm text-slate-500 mb-6">Manage editable columns with custom options.</p>
                
                <div className="space-y-4">
                  {customColumns.map((col) => (
                    <div key={col.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium text-slate-700">
                          {col.label}
                          {col.isBuiltIn && <span className="text-slate-400 text-xs ml-2">(Built-in)</span>}
                        </Label>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEditColumnDialog(col.id)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      {!col.isBuiltIn && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this column?")) {
                              deleteColumn(col.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={() => setAddColumnDialog(true)} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="relations" className="mt-6">
              <div className="border border-slate-200 rounded-lg bg-white p-6 w-full max-w-7xl">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="h-5 w-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Table Relations</h2>
                </div>
                <p className="text-sm text-slate-500 mb-6">Configure how WorkFlow, Finance, and Companies are linked.</p>
                
                <div className="space-y-6">
                  {/* Default Company */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Default Company for WorkFlow</Label>
                    <p className="text-xs text-slate-500">Files uploaded to WorkFlow will be associated with this company by default.</p>
                    <Select
                      value={tableRelations.defaultCompanyId || "none"}
                      onValueChange={(value) => setTableRelations(prev => ({
                        ...prev,
                        defaultCompanyId: value === "none" ? null : value
                      }))}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select a company..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default company</SelectItem>
                        {companies?.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Link WorkFlow to Finance */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">Link WorkFlow to Finance</Label>
                      <p className="text-xs text-slate-500">When assigning a project to a file, automatically create a financial transaction.</p>
                    </div>
                    <Switch
                      checked={tableRelations.linkWorkflowToFinance}
                      onCheckedChange={(checked) => setTableRelations(prev => ({
                        ...prev,
                        linkWorkflowToFinance: checked
                      }))}
                    />
                  </div>
                  
                  {/* Auto-create Transaction */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">Auto-create Transaction</Label>
                      <p className="text-xs text-slate-500">Automatically create a draft transaction when a project is assigned to a workflow file.</p>
                    </div>
                    <Switch
                      checked={tableRelations.autoCreateTransaction}
                      onCheckedChange={(checked) => setTableRelations(prev => ({
                        ...prev,
                        autoCreateTransaction: checked
                      }))}
                    />
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Tipo Documento (Movimento Draft)</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Quando escolhe <strong>Documento</strong> no painel lateral e carrega em <strong>Guardar</strong>, por
                        omissão segue o modo «Novos ficheiros WorkFlow → servidor (VPS)» na secção abaixo. Active as opções
                        seguintes apenas se quiser <strong>desacoplar</strong> documentos desse interruptor.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-200/80">
                      <div className="space-y-1 pr-2">
                        <Label className="text-sm font-medium text-slate-700">Documento → sempre copiar para o servidor</Label>
                        <p className="text-xs text-slate-500">
                          Envia o PDF para o VPS (<code className="text-[11px]">/api/work-files/upload</code>), usando a
                          «Pasta de destino» ou a pasta do mês em File Storage Locations, <strong>mesmo</strong> com o
                          WorkFlow em modo Supabase.
                        </p>
                      </div>
                      <Switch
                        checked={tableRelations.documentDraftForceServerCopy === true}
                        onCheckedChange={(checked) =>
                          setTableRelations((prev) => ({
                            ...prev,
                            documentDraftForceServerCopy: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-200/80">
                      <div className="space-y-1 pr-2">
                        <Label className="text-sm font-medium text-slate-700">Documento → registar na biblioteca (Supabase)</Label>
                        <p className="text-xs text-slate-500">
                          Cria ou actualiza <code className="text-[11px]">company_documents</code> com o URL do ficheiro,
                          <strong>mesmo</strong> com o WorkFlow a gravar só no VPS. Útil para o documento aparecer na
                          biblioteca da empresa sem mudar o fluxo geral de uploads.
                        </p>
                      </div>
                      <Switch
                        checked={tableRelations.documentDraftForceCompanyLibrary === true}
                        onCheckedChange={(checked) =>
                          setTableRelations((prev) => ({
                            ...prev,
                            documentDraftForceCompanyLibrary: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                {/* File Storage Section */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-800">File Storage Locations</h3>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setStorageLocationForm({ company_id: "", folder_id: null, year: new Date().getFullYear(), month: new Date().getMonth() + 1, folder_path: "", server_root: "" });
                        setStorageLocationDialog({ open: true, editingId: null });
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Location
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Configure where workflow files are stored in the company's document library based on company and month.</p>

                  <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-xs text-slate-800">
                    <p className="font-medium text-slate-900">Empresa usada nos uploads do WorkFlow</p>
                    <p className="mt-1 text-slate-700">
                      A tabela abaixo filtra por empresa, mas os ficheiros que carregas no separador <strong>WorkFlow</strong> usam a{" "}
                      <strong>Default Company for WorkFlow</strong> (acima, em Table Relations). Essa empresa tem de ser a mesma para a qual
                      configuraste «Pasta no servidor» + «Folder Location» para o <strong>mês civil actual</strong> — caso contrário os ficheiros
                      vão para outra empresa ou o sistema usa a última linha completa (com aviso).
                    </p>
                  </div>

                  {apiServerHealth?.work_files_roots && apiServerHealth.work_files_roots.length > 0 && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-slate-800">
                      <p className="font-medium text-emerald-950 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 shrink-0" />
                        Raiz no servidor (VPS, Linux)
                      </p>
                      <p className="mt-2 font-mono text-[11px] break-all text-slate-900">
                        {apiServerHealth.work_files_roots.join(" · ")}
                      </p>
                      <p className="mt-2 text-slate-700 leading-relaxed">
                        No Windows podes ver <span className="font-mono">Z:\nvme\Splendidoption (PT)\Work</span> — no VPS o mesmo conteúdo está sob
                        uma raiz como <span className="font-mono">/data/nvme</span> (variável <code className="rounded bg-white/80 px-1">WORK_FILES_ROOT</code> no processo do <code className="rounded bg-white/80 px-1">api-server</code>).
                        A coluna «Pasta no servidor» guarda o caminho <strong>relativo a essa raiz</strong>, p.ex.{" "}
                        <span className="font-mono">Splendidoption (PT)</span> (nome exacto da pasta), não o caminho <span className="font-mono">Z:\…</span>.
                      </p>
                    </div>
                  )}

                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-2">
                    <p>
                      <span className="font-medium text-slate-800">Servidor de ficheiros (API)</span>
                      {" — "}
                      {fileServerBaseUrl ? (
                        <>
                          Pedidos <code className="rounded bg-white px-1 py-0.5 text-[11px]">/api/work-files/*</code> vão para{" "}
                          <code className="rounded bg-white px-1 py-0.5 text-[11px] break-all">{fileServerBaseUrl}</code>
                          {" "}(ex.: VPS Hetzner por trás do proxy).
                        </>
                      ) : (
                        <>
                          Usa o mesmo domínio da app. Em produção, define{" "}
                          <code className="rounded bg-white px-1 py-0.5 text-[11px]">VITE_WORK_FILES_API_BASE</code> no build
                          para o URL onde corre o <code className="rounded bg-white px-1 py-0.5 text-[11px]">api-server.mjs</code> (p.ex. Hetzner).
                        </>
                      )}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-800">Pasta no servidor</span>
                      {" — "}
                      Caminho completo relativo ao disco do <strong>VPS</strong> (variável{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px]">WORK_FILES_ROOT</code>
                      ), p.ex. <span className="font-mono">Harwick Partners/Work/04 April 2026</span>.{" "}
                      <strong>Não é Supabase.</strong> A listagem <code className="rounded bg-white px-1 py-0.5 text-[11px]">GET /api/work-files/list</code>{" "}
                      alimenta sugestões; se falhar, usa texto livre ou{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px]">VITE_WORKFLOW_SERVER_ROOT_PRESETS</code>
                      . Para listar só uma subárvore, define{" "}
                      <code className="rounded bg-white px-1 py-0.5 text-[11px]">VITE_WORK_FILES_LIST_FOLDER</code>.
                    </p>
                  </div>

                  {serverFoldersQueryError && (
                    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      <strong>Listagem do servidor indisponível.</strong> O pedido a{" "}
                      <code className="rounded bg-white/80 px-1">/api/work-files/list</code> falhou — confirma o{" "}
                      <code className="rounded bg-white/80 px-1">api-server</code> na porta 3001 e o proxy (
                      <code className="rounded bg-white/80 px-1">VITE_WORK_FILES_API_BASE</code>
                      ). Enquanto isso, as opções podem ser só valores da BD ou texto livre; não são pastas do disco em tempo real.
                    </div>
                  )}
                  
                  {/* Store Files Toggle */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-slate-700">Copy Files to Company Documents</Label>
                      <p className="text-xs text-slate-500">
                        Só usada quando o WorkFlow grava em <strong>Supabase</strong> (modo teste): ao concluir, copia também para a biblioteca «company-documents».
                        Com <strong>Novos ficheiros… → servidor (VPS)</strong> activo, ao concluir o ficheiro vai <strong>só para o VPS</strong> (caminhos desta página), não para esse bucket.
                      </p>
                    </div>
                    <Switch
                      checked={tableRelations.storeFilesInCompanyDocs}
                      onCheckedChange={(checked) => setTableRelations(prev => ({
                        ...prev,
                        storeFilesInCompanyDocs: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4 p-3 bg-emerald-50/80 rounded-lg border border-emerald-100">
                    <div className="space-y-1 pr-4">
                      <Label className="text-sm font-medium text-slate-800">Novos ficheiros no WorkFlow → servidor (VPS)</Label>
                      <p className="text-xs text-slate-600">
                        Quando activo, os uploads no separador WorkFlow gravam em disco via API (
                        <code className="text-[11px]">workflow_storage_locations</code>
                        : empresa predefinida + pasta no servidor). Desactiva apenas para testes com Supabase Storage.
                      </p>
                    </div>
                    <Switch
                      checked={(tableRelations.workflowUploadTarget ?? "server") === "server"}
                      onCheckedChange={(checked) =>
                        setTableRelations((prev) => ({
                          ...prev,
                          workflowUploadTarget: checked ? "server" : "supabase",
                        }))
                      }
                    />
                  </div>
                  {/* Company Filter */}
                  <div className="flex items-center gap-2 mb-3">
                        <Label className="text-xs text-slate-500">Filter by company:</Label>
                        <Select value={storageLocationCompanyFilter} onValueChange={setStorageLocationCompanyFilter}>
                          <SelectTrigger className="w-64 h-8 text-sm">
                            <SelectValue placeholder="All companies" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="all">All companies</SelectItem>
                            {companies?.map(company => (
                              <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-w-full">
                        <Table className="min-w-[640px] w-full table-fixed">
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="text-xs font-medium text-slate-600 w-[18%]">Company</TableHead>
                            <TableHead className="text-xs font-medium text-slate-600 w-[8%]">Year</TableHead>
                            <TableHead className="text-xs font-medium text-slate-600 w-[12%]">Month</TableHead>
                            <TableHead className="text-xs font-medium text-slate-600 w-[47%] min-w-[14rem]">Pasta no servidor</TableHead>
                            <TableHead className="text-xs font-medium text-slate-600 w-[15%] whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {storageLocationsLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-8">
                                Loading storage locations...
                              </TableCell>
                            </TableRow>
                          ) : storageLocationsError ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-destructive py-8">
                                Could not load storage locations. Please refresh.
                              </TableCell>
                            </TableRow>
                          ) : storageLocations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-slate-500 py-8">
                                No storage locations configured. Click "Add Location" to create one.
                              </TableCell>
                            </TableRow>
                          ) : (
                            storageLocations
                              .filter(location => storageLocationCompanyFilter === "all" || location.company_id === storageLocationCompanyFilter)
                              .map((location) => {
                              const company = companies?.find((c) => c.id === location.company_id);
                              const monthLabel =
                                MONTHS.find((m) => m.value === location.month)?.label || `Month ${location.month}`;
                              return (
                                <TableRow key={location.id}>
                                  <TableCell className="text-sm font-medium text-slate-800">{company?.name || "Unknown"}</TableCell>
                                  <TableCell className="text-sm text-slate-600">{location.year || "-"}</TableCell>
                                  <TableCell className="text-sm text-slate-600">{monthLabel}</TableCell>
                                  <TableCell className="align-top min-w-0">
                                    <div className="flex flex-col gap-1.5 min-w-0 pr-1">
                                      <div className="flex flex-wrap items-start gap-2">
                                        <span
                                          className="text-xs font-mono text-slate-800 break-all min-w-0 flex-1 basis-[min(100%,12rem)]"
                                          title={location.server_root || ""}
                                        >
                                          {location.server_root || "—"}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 shrink-0 text-xs px-2.5 whitespace-nowrap"
                                          onClick={() =>
                                            setServerFolderPicker({
                                              open: true,
                                              mode: "row",
                                              locationId: location.id,
                                              initialPath: workflowServerListInitialPath(
                                                location.server_root,
                                                location.folder_path
                                              ),
                                            })
                                          }
                                        >
                                          Navegar…
                                        </Button>
                                      </div>
                                      <p className="text-[10px] text-slate-500 leading-snug">
                                        Ou edita na BD / presets; clica em Navegar para subpastas.
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {location.server_root && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                          title="Migrate files to server"
                                          disabled={migratingLocationId === location.id}
                                          onClick={() => handleMigrateFiles(location)}
                                        >
                                          {migratingLocationId === location.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => {
                                          setStorageLocationForm({
                                            company_id: location.company_id,
                                            folder_id: location.folder_id,
                                            year: location.year || new Date().getFullYear(),
                                            month: location.month,
                                            folder_path: location.folder_path || "",
                                            server_root: location.server_root || "",
                                          });
                                          setStorageLocationDialog({ open: true, editingId: location.id });
                                        }}
                                      >
                                        <Edit className="h-3.5 w-3.5 text-slate-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        onClick={() => {
                                          if (confirm("Delete this storage location?")) {
                                            deleteStorageLocationMutation.mutate(location.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                  </Table>
                  </div>
                </div>

                {/* Project File Storage Section */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-800">Project File Storage Locations</h3>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setProjectStorageForm({ project_id: "", folder_path: "", description: "" });
                        setProjectStorageDialog({ open: true, editingId: null });
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Location
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Associate each project with a folder path on the server.</p>
                  
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs font-medium text-slate-600">Project</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Folder Path</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600">Description</TableHead>
                          <TableHead className="text-xs font-medium text-slate-600 w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectStorageLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                              Loading project locations...
                            </TableCell>
                          </TableRow>
                        ) : projectStorageError ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-destructive py-8">
                              Could not load project locations. Please refresh.
                            </TableCell>
                          </TableRow>
                        ) : projectStorageLocations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                              No project locations configured. Click "Add Location" to create one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          projectStorageLocations.map((location) => {
                            const project = expenseProjects.find((p) => p.id === location.project_id);
                            return (
                              <TableRow key={location.id}>
                                <TableCell className="text-sm font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    {project?.color && (
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                                    )}
                                    {project?.name || "Unknown"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600 font-mono">{location.folder_path}</TableCell>
                                <TableCell className="text-sm text-slate-500">{location.description || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => {
                                        setProjectStorageForm({
                                          project_id: location.project_id,
                                          folder_path: location.folder_path,
                                          description: location.description || "",
                                        });
                                        setProjectStorageDialog({ open: true, editingId: location.id });
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (confirm("Delete this project storage location?")) {
                                          deleteProjectStorageMutation.mutate(location.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <WorkFlowTab />
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <WorkFilesTab />
        </TabsContent>
      </Tabs>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialog} onOpenChange={setAddColumnDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
                onKeyDown={(e) => e.key === "Enter" && addNewColumn()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNewColumn} className="bg-blue-600 hover:bg-blue-700">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialog.open} onOpenChange={(open) => setEditColumnDialog({ open, columnId: open ? editColumnDialog.columnId : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
                placeholder="Enter column name"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {editColumnOptions.map((option) => (
                  <div 
                    key={option.label}
                    className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {/* Preview badge */}
                    <div 
                      className="px-2 py-1 rounded text-xs font-medium min-w-[80px] text-center"
                      style={{ 
                        backgroundColor: option.color,
                        color: isDarkColor(option.color) ? '#ffffff' : '#000000'
                      }}
                    >
                      {option.label}
                    </div>
                    
                    {/* Color presets */}
                    <div className="flex gap-1 flex-wrap">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateOptionColor(option.label, color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            option.color === color 
                              ? 'border-slate-900 scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={() => removeOption(option.label)}
                      className="ml-auto text-slate-400 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  placeholder="Add new option"
                  onKeyDown={(e) => e.key === "Enter" && addOption()}
                />
                <Button type="button" variant="outline" onClick={addOption}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editColumnDialog.columnId && !customColumns.find(c => c.id === editColumnDialog.columnId)?.isBuiltIn && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm("Delete this column?")) {
                    deleteColumn(editColumnDialog.columnId!);
                  }
                }}
              >
                Delete Column
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setEditColumnDialog({ open: false, columnId: null })}>
                Cancel
              </Button>
              <Button onClick={saveColumnSettings} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Storage Location Dialog */}
      <Dialog open={storageLocationDialog.open} onOpenChange={(open) => setStorageLocationDialog({ open, editingId: open ? storageLocationDialog.editingId : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{storageLocationDialog.editingId ? "Edit Storage Location" : "Add Storage Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={storageLocationForm.company_id}
                onValueChange={(value) => setStorageLocationForm(prev => ({ ...prev, company_id: value, folder_id: null, folder_path: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={storageLocationForm.year.toString()}
                onValueChange={(value) => setStorageLocationForm(prev => ({ ...prev, year: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={storageLocationForm.month.toString()}
                onValueChange={(value) => setStorageLocationForm(prev => ({ ...prev, month: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pasta no servidor <span className="text-red-600">*</span></Label>
              <p className="text-xs text-slate-500">
                Caminho relativo a <code className="text-[11px]">WORK_FILES_ROOT</code> no VPS (ex.{" "}
                <span className="font-mono">Harwick Partners/Work/04 April 2026</span>). Usa «Navegar…» para subpastas ou escreve o caminho completo.
              </p>
              <div className="flex gap-2">
                <Input
                  list="workflow-server-root-datalist"
                  value={storageLocationForm.server_root}
                  onChange={(e) => setStorageLocationForm((prev) => ({ ...prev, server_root: e.target.value }))}
                  placeholder="ex.: Splendidoption (PT)/Work"
                  className="font-mono text-sm flex-1"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() =>
                    setServerFolderPicker({
                      open: true,
                      mode: "form",
                      locationId: null,
                      initialPath: workflowServerListInitialPath(
                        storageLocationForm.server_root,
                        storageLocationForm.folder_path
                      ),
                    })
                  }
                >
                  Navegar…
                </Button>
              </div>
              <datalist id="workflow-server-root-datalist">
                {mergedServerFolderOptions.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            
            {/* Preview */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pré-visualização</Label>
              <p className="text-xs text-slate-700 mt-1 font-mono break-all">
                {storageLocationForm.server_root?.trim() ? (
                  <>
                    <HardDrive className="inline h-3 w-3 mr-1 text-emerald-600" />
                    <span className="text-emerald-600">{storageLocationForm.server_root.trim()}</span>
                  </>
                ) : (
                  <span className="text-slate-500">Preencha o caminho no campo acima.</span>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStorageLocationDialog({ open: false, editingId: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!storageLocationForm.company_id) {
                  toast.error("Seleccione a empresa.");
                  return;
                }
                const root = (storageLocationForm.server_root || "").trim();
                const legacyFolder = (storageLocationForm.folder_path || "").trim();
                if (!root && !legacyFolder) {
                  toast.error("Indique a pasta no servidor (caminho sob WORK_FILES_ROOT no VPS).");
                  return;
                }
                
                const locationData = {
                  company_id: storageLocationForm.company_id,
                  /** Com caminho no VPS, não duplicar pasta da biblioteca Supabase. */
                  folder_id: root ? null : storageLocationForm.folder_id || null,
                  year: storageLocationForm.year,
                  month: storageLocationForm.month,
                  folder_path: root ? null : legacyFolder || null,
                  server_root: root || null,
                };
                
                if (storageLocationDialog.editingId) {
                  updateStorageLocationMutation.mutate({
                    id: storageLocationDialog.editingId,
                    ...locationData
                  } as StorageLocation);
                } else {
                  createStorageLocationMutation.mutate(locationData);
                }
                
                setStorageLocationDialog({ open: false, editingId: null });
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createStorageLocationMutation.isPending || updateStorageLocationMutation.isPending}
            >
              {storageLocationDialog.editingId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Storage Location Dialog */}
      <Dialog open={projectStorageDialog.open} onOpenChange={(open) => setProjectStorageDialog({ open, editingId: open ? projectStorageDialog.editingId : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{projectStorageDialog.editingId ? "Edit Project Location" : "Add Project Location"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={projectStorageForm.project_id}
                onValueChange={(value) => setProjectStorageForm(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {expenseProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Folder Path</Label>
              <p className="text-xs text-slate-500">Full path to the project folder on the server (e.g. Tresorit Drive/Company/Project).</p>
              <Input
                value={projectStorageForm.folder_path}
                onChange={(e) => setProjectStorageForm(prev => ({ ...prev, folder_path: e.target.value }))}
                placeholder="e.g. Swissintegral WM (MT)/Boats/DABMAR - Azimut 27M"
              />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-xs text-slate-400">(optional)</span></Label>
              <Input
                value={projectStorageForm.description}
                onChange={(e) => setProjectStorageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Main documents for this project"
              />
            </div>
            
            {/* Preview */}
            {projectStorageForm.project_id && projectStorageForm.folder_path && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Path Preview</Label>
                <p className="text-xs text-slate-700 mt-1 font-mono">
                  <span className="text-blue-600">{projectStorageForm.folder_path}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectStorageDialog({ open: false, editingId: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!projectStorageForm.project_id || !projectStorageForm.folder_path.trim()) {
                  toast.error("Please select a project and enter a folder path");
                  return;
                }
                
                const locationData = {
                  project_id: projectStorageForm.project_id,
                  folder_path: projectStorageForm.folder_path.trim(),
                  description: projectStorageForm.description.trim() || null,
                };
                
                if (projectStorageDialog.editingId) {
                  updateProjectStorageMutation.mutate({
                    id: projectStorageDialog.editingId,
                    ...locationData
                  } as ProjectStorageLocation);
                } else {
                  createProjectStorageMutation.mutate(locationData);
                }
                
                setProjectStorageDialog({ open: false, editingId: null });
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createProjectStorageMutation.isPending || updateProjectStorageMutation.isPending}
            >
              {projectStorageDialog.editingId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCompany(null);
        }}
        company={editingCompany}
      />

      <ServerFolderPickerDialog
        open={serverFolderPicker.open}
        onOpenChange={(open) => setServerFolderPicker((s) => ({ ...s, open }))}
        baseUrl={fileServerBaseUrl}
        initialRelativePath={serverFolderPicker.initialPath}
        startInsideFolder={WORK_FILES_LIST_FOLDER}
        onConfirm={(path) => {
          if (serverFolderPicker.mode === "row" && serverFolderPicker.locationId) {
            updateServerRootMutation.mutate({
              id: serverFolderPicker.locationId,
              server_root: path,
            });
          } else if (serverFolderPicker.mode === "form") {
            setStorageLocationForm((prev) => ({ ...prev, server_root: path || "" }));
          }
        }}
      />
    </div>
  );
}
