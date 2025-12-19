import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Search,
  Upload,
  Filter,
  Trash2,
  Download,
  FolderPlus,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { DocumentVaultTable } from "./DocumentVaultTable";
import { DocumentPreviewPanel } from "./DocumentPreviewPanel";
import { useVirtualizedDocuments, type SortField, type SortDirection } from "./useVirtualizedDocuments";
import {
  DocumentRow,
  FolderRow,
  ColumnOption,
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  DEFAULT_TAG_OPTIONS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
} from "./types";

interface DocumentVaultProps {
  companyId: string;
  onUploadClick: () => void;
  onCreateFolder: () => void;
}

export function DocumentVault({
  companyId,
  onUploadClick,
  onCreateFolder,
}: DocumentVaultProps) {
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["company-folders", companyId, currentFolderId],
    queryFn: async () => {
      let query = supabase
        .from("company_folders")
        .select("*")
        .eq("company_id", companyId);
      
      if (currentFolderId) {
        query = query.eq("parent_folder_id", currentFolderId);
      } else {
        query = query.is("parent_folder_id", null);
      }
      
      const { data, error } = await query.order("name");
      if (error) throw error;
      return (data || []) as unknown as FolderRow[];
    },
    enabled: !!companyId,
  });

  // Fetch all folders for path resolution
  const { data: allFolders = [] } = useQuery({
    queryKey: ["company-all-folders", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_folders")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return (data || []) as unknown as FolderRow[];
    },
    enabled: !!companyId,
  });

  // Fetch folder path
  const { data: folderPath = [] } = useQuery({
    queryKey: ["folder-path", currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return [];
      
      const path: { id: string; name: string }[] = [];
      let folderId: string | null = currentFolderId;
      
      while (folderId) {
        const folder = allFolders.find(f => f.id === folderId);
        if (folder) {
          path.unshift({ id: folder.id, name: folder.name });
          folderId = folder.parent_folder_id;
        } else {
          break;
        }
      }
      
      return path;
    },
    enabled: !!currentFolderId && allFolders.length > 0,
  });

  // Fetch documents with virtualization
  const {
    documents,
    totalCount,
    isLoading: documentsLoading,
    hasNextPage,
    isFetchingNextPage,
    invalidate: invalidateDocuments,
    setLoadMoreElement,
  } = useVirtualizedDocuments({
    companyId,
    folderId: currentFolderId,
    searchQuery,
    typeFilter,
    statusFilter,
    sortField,
    sortDirection,
    pageSize: 50,
  });

  // Get category/status options for current folder
  const getCategoryOptions = useCallback((folderId: string | null): ColumnOption[] => {
    if (!folderId) return DEFAULT_CATEGORY_OPTIONS;
    const folder = allFolders.find(f => f.id === folderId);
    const options = folder?.category_options;
    if (options && Array.isArray(options) && options.length > 0) {
      return options as ColumnOption[];
    }
    return DEFAULT_CATEGORY_OPTIONS;
  }, [allFolders]);

  const getStatusOptions = useCallback((folderId: string | null): ColumnOption[] => {
    if (!folderId) return DEFAULT_STATUS_OPTIONS;
    const folder = allFolders.find(f => f.id === folderId);
    const options = folder?.status_options;
    if (options && Array.isArray(options) && options.length > 0) {
      return options as ColumnOption[];
    }
    return DEFAULT_STATUS_OPTIONS;
  }, [allFolders]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (docIds: string[]) => {
      for (const docId of docIds) {
        const doc = documents.find(d => d.id === docId);
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
      setSelectedIds(new Set());
      setPreviewDoc(null);
      toast.success("Document(s) deleted");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateDocMutation = useMutation({
    mutationFn: async ({ docId, updates }: { docId: string; updates: Partial<DocumentRow> }) => {
      const { error } = await supabase
        .from("company_documents")
        .update(updates)
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateDocuments();
      toast.success("Updated");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  }, [documents, selectedIds.size]);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRowClick = useCallback((doc: DocumentRow) => {
    setPreviewDoc(doc);
  }, []);

  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
    setPreviewDoc(null);
  }, []);

  const handleDownload = useCallback((doc: DocumentRow) => {
    window.open(doc.file_url, "_blank");
  }, []);

  const handleUpdate = useCallback(async (docId: string, updates: Partial<DocumentRow>) => {
    await updateDocMutation.mutateAsync({ docId, updates });
  }, [updateDocMutation]);

  const handleUpdateField = useCallback((docId: string, field: string, value: string | number | null) => {
    updateDocMutation.mutate({ docId, updates: { [field]: value } });
  }, [updateDocMutation]);

  const handleDelete = useCallback((ids: string[]) => {
    if (confirm(`Delete ${ids.length} document(s)?`)) {
      deleteMutation.mutate(ids);
    }
  }, [deleteMutation]);

  const handleNavigateUp = useCallback(() => {
    if (currentFolderId && folderPath.length > 0) {
      const parentFolder = allFolders.find(f => f.id === currentFolderId);
      setCurrentFolderId(parentFolder?.parent_folder_id || null);
    }
  }, [currentFolderId, folderPath, allFolders]);

  const showPreviewPanel = previewDoc !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background">
        <div className="flex items-center gap-2 flex-1">
          {/* Back button */}
          {currentFolderId && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNavigateUp}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => setCurrentFolderId(null)}
                  className="cursor-pointer text-sm"
                >
                  Documents
                </BreadcrumbLink>
              </BreadcrumbItem>
              {folderPath.map((folder, idx) => (
                <span key={folder.id} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {idx === folderPath.length - 1 ? (
                      <BreadcrumbPage className="text-sm">{folder.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="cursor-pointer text-sm"
                      >
                        {folder.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Count */}
          <span className="text-xs text-muted-foreground ml-2">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Type
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DOCUMENT_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter === type}
                  onCheckedChange={() => setTypeFilter(type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Status
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DOCUMENT_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border" />

          {/* New Folder */}
          <Button variant="outline" size="sm" className="h-8" onClick={onCreateFolder}>
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
            Folder
          </Button>

          {/* Upload */}
          <Button size="sm" className="h-8" onClick={onUploadClick}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              selectedIds.forEach(id => {
                const doc = documents.find(d => d.id === id);
                if (doc) handleDownload(doc);
              });
            }}
          >
            <Download className="h-3 w-3 mr-1.5" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleDelete(Array.from(selectedIds))}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Delete
          </Button>
        </div>
      )}

      {/* Main Content: Table + Preview Panel */}
      <div className="flex-1 overflow-hidden">
        {showPreviewPanel ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full overflow-hidden p-4">
                <DocumentVaultTable
                  documents={documents}
                  folders={folders}
                  isLoading={documentsLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage ?? false}
                  selectedIds={selectedIds}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onSelectAll={handleSelectAll}
                  onSelectRow={handleSelectRow}
                  onRowClick={handleRowClick}
                  onFolderClick={handleFolderClick}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onEdit={(doc) => setPreviewDoc(doc)}
                  onUpdateField={handleUpdateField}
                  getCategoryOptions={getCategoryOptions}
                  getStatusOptions={getStatusOptions}
                  setLoadMoreElement={setLoadMoreElement}
                  currentFolderId={currentFolderId}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
              <DocumentPreviewPanel
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
                onUpdate={handleUpdate}
                onDownload={handleDownload}
                categoryOptions={getCategoryOptions(currentFolderId)}
                statusOptions={getStatusOptions(currentFolderId)}
                tagOptions={DEFAULT_TAG_OPTIONS}
                isUpdating={updateDocMutation.isPending}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full overflow-hidden p-4">
            <DocumentVaultTable
              documents={documents}
              folders={folders}
              isLoading={documentsLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              selectedIds={selectedIds}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              onRowClick={handleRowClick}
              onFolderClick={handleFolderClick}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onEdit={(doc) => setPreviewDoc(doc)}
              onUpdateField={handleUpdateField}
              getCategoryOptions={getCategoryOptions}
              getStatusOptions={getStatusOptions}
              setLoadMoreElement={setLoadMoreElement}
              currentFolderId={currentFolderId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
