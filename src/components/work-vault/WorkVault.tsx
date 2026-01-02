import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Folder,
  FileText,
  MoreHorizontal,
  Eye,
  Columns,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DocumentPreview } from "@/components/companies/DocumentPreview";
import {
  WorkDocumentRow,
  WorkFolderRow,
  ColumnOption,
  SortField,
  SortDirection,
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
} from "./types";

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "File", visible: true },
  { id: "date", label: "Date", visible: true },
  { id: "type", label: "Type", visible: true },
  { id: "category", label: "Category", visible: true },
  { id: "value", label: "Value", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "tags", label: "Tags", visible: true },
];

// Format file size
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Get file extension
const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
};

// Get file type badge style
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
    txt: { bg: "#6b7280", text: "white" },
    csv: { bg: "#14b8a6", text: "white" },
  };
  return styles[ext] || { bg: "#6b7280", text: "white" };
};

// Sanitize filename
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

export function WorkVault() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<WorkDocumentRow | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number }[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  // Dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["work-folders", user?.id, currentFolderId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("work_folders")
        .select("*")
        .eq("user_id", user.id);
      
      if (currentFolderId) {
        query = query.eq("parent_folder_id", currentFolderId);
      } else {
        query = query.is("parent_folder_id", null);
      }
      
      const { data, error } = await query.order("name");
      if (error) throw error;
      return (data || []) as WorkFolderRow[];
    },
    enabled: !!user?.id,
  });

  // Fetch all folders for path resolution
  const { data: allFolders = [] } = useQuery({
    queryKey: ["work-all-folders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("work_folders")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as WorkFolderRow[];
    },
    enabled: !!user?.id,
  });

  // Fetch folder path
  const { data: folderPath = [] } = useQuery({
    queryKey: ["work-folder-path", currentFolderId, allFolders],
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

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["work-documents", user?.id, currentFolderId, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("work_documents")
        .select("*")
        .eq("user_id", user.id);
      
      if (currentFolderId) {
        query = query.eq("folder_id", currentFolderId);
      } else {
        query = query.is("folder_id", null);
      }
      
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WorkDocumentRow[];
    },
    enabled: !!user?.id,
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("work_folders")
        .insert({
          user_id: user.id,
          name,
          parent_folder_id: currentFolderId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-folders"] });
      queryClient.invalidateQueries({ queryKey: ["work-all-folders"] });
      setCreateFolderOpen(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("work_folders")
        .delete()
        .eq("id", folderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-folders"] });
      queryClient.invalidateQueries({ queryKey: ["work-all-folders"] });
      toast.success("Folder deleted");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      for (const file of files) {
        const sanitizedName = sanitizeFileName(file.name);
        const timestamp = Date.now();
        const filePath = `work/${user.id}/${timestamp}_${sanitizedName}`;
        
        setUploadProgress(prev => [...prev, { fileName: file.name, progress: 0 }]);
        
        const { error: uploadError } = await supabase.storage
          .from("company-documents")
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("company-documents")
          .getPublicUrl(filePath);
        
        const { error: insertError } = await supabase
          .from("work_documents")
          .insert({
            user_id: user.id,
            name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            folder_id: currentFolderId,
          });
        
        if (insertError) throw insertError;
        
        setUploadProgress(prev => prev.map(p => 
          p.fileName === file.name ? { ...p, progress: 100 } : p
        ));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-documents"] });
      toast.success("Files uploaded");
      setTimeout(() => setUploadProgress([]), 2000);
    },
    onError: (error: Error) => {
      toast.error("Upload error: " + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete documents mutation
  const deleteDocsMutation = useMutation({
    mutationFn: async (docIds: string[]) => {
      for (const docId of docIds) {
        const doc = documents.find(d => d.id === docId);
        if (doc?.file_url) {
          const path = doc.file_url.split("/").slice(-2).join("/");
          await supabase.storage.from("company-documents").remove([path]);
        }
        const { error } = await supabase
          .from("work_documents")
          .delete()
          .eq("id", docId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-documents"] });
      setSelectedIds(new Set());
      setPreviewDoc(null);
      toast.success("Deleted");
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setIsUploading(true);
    await uploadMutation.mutateAsync(Array.from(files));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    
    setIsUploading(true);
    await uploadMutation.mutateAsync(Array.from(files));
  };

  const handleFolderClick = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
    setPreviewDoc(null);
  }, []);

  const handleNavigateUp = useCallback(() => {
    if (currentFolderId && folderPath.length > 0) {
      const currentFolder = allFolders.find(f => f.id === currentFolderId);
      setCurrentFolderId(currentFolder?.parent_folder_id || null);
    }
  }, [currentFolderId, folderPath, allFolders]);

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

  const handleDownload = useCallback((doc: WorkDocumentRow) => {
    window.open(doc.file_url, "_blank");
  }, []);

  const handleDelete = useCallback((ids: string[]) => {
    if (confirm(`Delete ${ids.length} item(s)?`)) {
      deleteDocsMutation.mutate(ids);
    }
  }, [deleteDocsMutation]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  }, []);

  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div 
      className="flex flex-col h-full"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-xl text-center">
            <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="text-lg font-medium text-slate-800">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background flex-wrap">
        <div className="flex items-center gap-2">
          {/* New dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          
          {/* Upload button */}
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          
          {/* Columns dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.visible}
                  onCheckedChange={() => toggleColumn(col.id)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Bulk delete */}
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedIds))}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b bg-slate-50">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => setCurrentFolderId(null)}
                className="cursor-pointer text-sm"
              >
                Work
              </BreadcrumbLink>
            </BreadcrumbItem>
            {folderPath.map((folder, idx) => (
              <span key={folder.id} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {idx === folderPath.length - 1 ? (
                    <BreadcrumbPage className="text-sm font-medium">{folder.name}</BreadcrumbPage>
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
      </div>

      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="p-4 border-b bg-slate-50 space-y-2">
          {uploadProgress.map((p, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm flex-1 truncate">{p.fileName}</span>
              <Progress value={p.progress} className="w-32 h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="w-10 p-3">
                  <Checkbox
                    checked={documents.length > 0 && selectedIds.size === documents.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                {visibleColumns.map(col => (
                  <th key={col.id} className="text-left p-3 text-sm font-semibold text-slate-700">
                    {col.label}
                  </th>
                ))}
                <th className="w-10 p-3">
                  <Plus className="h-4 w-4 text-slate-400" />
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Folders */}
              {folders.map(folder => (
                <tr 
                  key={folder.id}
                  className="border-b hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox disabled />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-slate-500">—</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">Folder</Badge>
                  </td>
                  {visibleColumns.slice(3).map(col => (
                    <td key={col.id} className="p-3 text-sm text-slate-500">—</td>
                  ))}
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this folder?")) {
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
              {documents.map(doc => {
                const ext = getFileExtension(doc.name);
                const badgeStyle = getFileTypeBadgeStyle(ext);
                
                return (
                  <tr 
                    key={doc.id}
                    className={cn(
                      "border-b hover:bg-slate-50 cursor-pointer",
                      selectedIds.has(doc.id) && "bg-blue-50"
                    )}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={() => handleSelectRow(doc.id)}
                      />
                    </td>
                    {visibleColumns.map(col => {
                      switch (col.id) {
                        case "name":
                          return (
                            <td key={col.id} className="p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-blue-600 hover:underline truncate max-w-xs">
                                  {doc.name}
                                </span>
                              </div>
                            </td>
                          );
                        case "date":
                          return (
                            <td key={col.id} className="p-3 text-sm text-slate-600">
                              {format(new Date(doc.created_at), "dd/MM/yyyy")}
                            </td>
                          );
                        case "type":
                          return (
                            <td key={col.id} className="p-3">
                              <Badge 
                                style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                                className="text-xs uppercase"
                              >
                                {ext || "file"}
                              </Badge>
                            </td>
                          );
                        case "category":
                          return (
                            <td key={col.id} className="p-3 text-sm text-slate-600">
                              {doc.document_type || "—"}
                            </td>
                          );
                        case "value":
                          return (
                            <td key={col.id} className="p-3 text-sm text-slate-600">
                              {doc.financial_value ? `€${doc.financial_value.toLocaleString()}` : "—"}
                            </td>
                          );
                        case "status":
                          return (
                            <td key={col.id} className="p-3 text-sm text-slate-600">
                              {doc.status || "—"}
                            </td>
                          );
                        case "tags":
                          return (
                            <td key={col.id} className="p-3">
                              {doc.tags?.length ? (
                                <div className="flex gap-1 flex-wrap">
                                  {doc.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {doc.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{doc.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : "—"}
                            </td>
                          );
                        default:
                          return <td key={col.id} className="p-3">—</td>;
                      }
                    })}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete([doc.id])}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              
              {/* Empty state */}
              {folders.length === 0 && documents.length === 0 && !documentsLoading && (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="text-center py-12 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No files or folders yet</p>
                    <p className="text-sm text-slate-400 mt-1">Upload files or create folders to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t text-sm text-slate-500">
            {folders.length} folder{folders.length !== 1 ? 's' : ''}, {documents.length} file{documents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolderMutation.mutate(newFolderName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview */}
      {previewDoc && (
        <DocumentPreview
          document={{
            name: previewDoc.name,
            file_url: previewDoc.file_url,
            mime_type: previewDoc.mime_type,
          }}
          onDownload={() => handleDownload(previewDoc)}
        />
      )}
    </div>
  );
}
