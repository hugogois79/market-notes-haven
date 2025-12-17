import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Trash2, Download, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
}

const STATUS_OPTIONS = [
  { label: "Pending", color: "#fef08a", icon: Clock },
  { label: "In Progress", color: "#bae6fd", icon: AlertCircle },
  { label: "Completed", color: "#bbf7d0", icon: CheckCircle },
];

const PRIORITY_OPTIONS = [
  { label: "Low", color: "#e5e7eb" },
  { label: "Normal", color: "#bae6fd" },
  { label: "High", color: "#fed7aa" },
  { label: "Urgent", color: "#fecaca" },
];

export default function WorkFlowTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadedFiles = [];
      for (const file of Array.from(files)) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("attachments")
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("workflow_files")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            status: "pending",
            priority: "normal",
          });
        
        if (insertError) throw insertError;
        uploadedFiles.push(file.name);
      }
      return uploadedFiles;
    },
    onSuccess: (files) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
      toast.success(`Uploaded ${files.length} file(s)`);
    },
    onError: (error) => {
      toast.error("Failed to upload files");
      console.error(error);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "Completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
      
      const { error } = await supabase
        .from("workflow_files")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-files"] });
    },
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const { error } = await supabase
        .from("workflow_files")
        .update({ priority })
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
    
    setIsUploading(true);
    await uploadMutation.mutateAsync(files);
    setIsUploading(false);
    
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

    setIsUploading(true);
    await uploadMutation.mutateAsync(Array.from(files));
    setIsUploading(false);
  }, [uploadMutation]);

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

  const filteredFiles = workflowFiles?.filter(file => 
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusOption = (status: string) => STATUS_OPTIONS.find(s => s.label.toLowerCase() === status?.toLowerCase()) || STATUS_OPTIONS[0];
  const getPriorityOption = (priority: string) => PRIORITY_OPTIONS.find(p => p.label.toLowerCase() === priority?.toLowerCase()) || PRIORITY_OPTIONS[1];

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="flex-1" />
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Files Table with Drag & Drop */}
      <div 
        className={`border rounded-lg bg-white shadow-sm overflow-x-auto transition-colors ${
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
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700">File Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Size</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Priority</TableHead>
              <TableHead className="font-semibold text-slate-700">Added</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading files...
                </TableCell>
              </TableRow>
            ) : filteredFiles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-slate-300" />
                    <span>No files found. Drag & drop files here or click Upload.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles?.map((file) => {
                const statusOpt = getStatusOption(file.status);
                const priorityOpt = getPriorityOption(file.priority);
                
                return (
                  <TableRow key={file.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-blue-600">{file.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatFileSize(file.file_size)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge 
                            className="cursor-pointer hover:opacity-80 text-slate-800"
                            style={{ backgroundColor: statusOpt.color }}
                          >
                            {file.status || "Pending"}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.label}
                              onClick={() => updateStatusMutation.mutate({ id: file.id, status: opt.label })}
                            >
                              <div 
                                className="w-3 h-3 rounded mr-2"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge 
                            className="cursor-pointer hover:opacity-80 text-slate-800"
                            style={{ backgroundColor: priorityOpt.color }}
                          >
                            {file.priority || "Normal"}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {PRIORITY_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                              key={opt.label}
                              onClick={() => updatePriorityMutation.mutate({ id: file.id, priority: opt.label })}
                            >
                              <div 
                                className="w-3 h-3 rounded mr-2"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(file.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-blue-600"
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-destructive"
                          onClick={() => {
                            if (confirm("Remove this file from workflow?")) {
                              deleteMutation.mutate(file.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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
  );
}