import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Trash2, Download, FileText, X, MoreHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

interface WorkFile {
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

// Format file size
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function WorkFilesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch files filtered by category "Work"
  const { data: files = [], isLoading } = useQuery({
    queryKey: ["work-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_files")
        .select("*")
        .eq("category", "Work")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as WorkFile[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const results: WorkFile[] = [];
      
      for (const file of filesToUpload) {
        const sanitizedName = sanitizeFileName(file.name);
        const timestamp = Date.now();
        const filePath = `work-files/${timestamp}_${sanitizedName}`;
        
        setUploadProgress(prev => [...prev, {
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        }]);
        
        const { error: uploadError } = await supabase.storage
          .from("workflow-files")
          .upload(filePath, file);
        
        if (uploadError) {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name ? { ...p, status: 'error' as const } : p
          ));
          throw uploadError;
        }
        
        const { data: urlData } = supabase.storage
          .from("workflow-files")
          .getPublicUrl(filePath);
        
        const { data: insertedFile, error: insertError } = await supabase
          .from("workflow_files")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type,
            status: "Pending",
            priority: "normal",
            category: "Work" // Pre-set category to "Work"
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        setUploadProgress(prev => prev.map(p => 
          p.fileName === file.name ? { ...p, progress: 100, status: 'completed' as const } : p
        ));
        
        results.push(insertedFile as WorkFile);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-files"] });
      toast.success("Files uploaded successfully");
      setTimeout(() => setUploadProgress([]), 2000);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase
        .from("workflow_files")
        .delete()
        .eq("id", fileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-files"] });
      toast.success("File deleted");
      setFileToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      const { error } = await supabase
        .from("workflow_files")
        .delete()
        .in("id", fileIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-files"] });
      toast.success("Files deleted");
      setSelectedFiles(new Set());
    },
    onError: (error) => {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete files");
    },
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(Array.from(files));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles?.length) return;
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(Array.from(droppedFiles));
    } finally {
      setIsUploading(false);
    }
  };

  // Filter files by search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.file_name.toLowerCase().includes(query) ||
      file.notes?.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Toggle all files selection
  const toggleAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  // Download file
  const downloadFile = (file: WorkFile) => {
    window.open(file.file_url, "_blank");
  };

  return (
    <div 
      className="space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Bulk actions */}
        {selectedFiles.size > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => bulkDeleteMutation.mutate(Array.from(selectedFiles))}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedFiles.size})
          </Button>
        )}
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
          {uploadProgress.map((progress, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700 flex-1 truncate">{progress.fileName}</span>
              {progress.status === 'uploading' && (
                <Progress value={progress.progress} className="w-32 h-2" />
              )}
              {progress.status === 'completed' && (
                <Badge className="bg-green-100 text-green-700">Completed</Badge>
              )}
              {progress.status === 'error' && (
                <Badge className="bg-red-100 text-red-700">Error</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/20 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-xl text-center">
            <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="text-lg font-medium text-slate-800">Drop files here to upload</p>
            <p className="text-sm text-slate-500 mt-1">Files will be added to Work category</p>
          </div>
        </div>
      )}

      {/* Files Table */}
      <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 p-3">
                <Checkbox
                  checked={filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length}
                  onCheckedChange={toggleAllFiles}
                />
              </th>
              <th className="text-left p-3 font-semibold text-slate-700">File</th>
              <th className="text-left p-3 font-semibold text-slate-700">Type</th>
              <th className="text-left p-3 font-semibold text-slate-700">Date</th>
              <th className="text-left p-3 font-semibold text-slate-700">Size</th>
              <th className="text-right p-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No work files yet</p>
                  <p className="text-sm text-slate-400 mt-1">Upload files for financial planning and other work documents</p>
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const ext = getFileExtension(file.file_name);
                const badgeStyle = getFileTypeBadgeStyle(ext);
                
                return (
                  <tr 
                    key={file.id} 
                    className={cn(
                      "border-b border-slate-100 hover:bg-slate-50 cursor-pointer",
                      selectedFiles.has(file.id) && "bg-blue-50"
                    )}
                    onClick={() => setPreviewFile(file)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-blue-600 hover:underline">
                          {getFileNameWithoutExtension(file.file_name)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                        className="text-xs font-medium uppercase"
                      >
                        {ext || "file"}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {format(new Date(file.created_at), "dd/MM/yyyy")}
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadFile(file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setFileToDelete(file.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Document Preview */}
      {previewFile && (
        <DocumentPreview
          document={{
            name: previewFile.file_name,
            file_url: previewFile.file_url,
            mime_type: previewFile.mime_type,
          }}
          onDownload={() => downloadFile(previewFile)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && deleteMutation.mutate(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
