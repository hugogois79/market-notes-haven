import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  folderId?: string | null;
}

const DOCUMENT_TYPES = ["Invoice", "Contract", "Receipt", "Legal", "Report", "Statement", "Certificate", "Correspondence", "Proof", "Other"];
const DOCUMENT_STATUSES = ["Draft", "Under Review", "Final", "Filed"];

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  companyId,
  folderId,
}: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("Other");
  const [status, setStatus] = useState("Draft");
  const [financialValue, setFinancialValue] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFile(null);
    setDocumentType("Other");
    setStatus("Draft");
    setFinancialValue("");
    setTags("");
    setNotes("");
  };

  // Calculate SHA-256 hash for file integrity
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");

      // Validate file is readable (not a directory/package)
      if (file.name.endsWith('.dir') || file.size === 0) {
        throw new Error("Invalid file: Cannot upload folders or empty files");
      }

      setIsUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate SHA-256 hash for forensic integrity
      let fileHash: string;
      try {
        fileHash = await calculateFileHash(file);
      } catch (e) {
        throw new Error("Cannot read file. Please ensure it's a valid file and not a folder.");
      }

      // Upload file to storage
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${companyId}/${timestamp}-${safeFileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("company-documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      } catch (e: any) {
        if (e.message?.includes('Failed to fetch')) {
          throw new Error("Upload failed: File may be too large or unreadable. Try a smaller file.");
        }
        throw e;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-documents")
        .getPublicUrl(filePath);

      // Create document record
      const { error: insertError } = await supabase
        .from("company_documents")
        .insert({
          company_id: companyId,
          folder_id: folderId || null,
          name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType,
          status,
          financial_value: financialValue ? parseFloat(financialValue) : null,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          notes: notes || null,
          uploaded_by: user.id,
          file_hash: fileHash,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents-paginated", companyId] });
      toast.success("Document uploaded successfully");
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error.message || "Unknown error occurred";
      toast.error(message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div>
            <Label>File</Label>
            {file ? (
              <div className="mt-2 flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to select a file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Document Type */}
          <div>
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Value */}
          <div>
            <Label>Financial Value (€)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={financialValue}
              onChange={(e) => setFinancialValue(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              placeholder="e.g. Q4, 2025, Important"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => uploadMutation.mutate()}
            disabled={!file || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
