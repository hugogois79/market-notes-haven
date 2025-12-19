import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  Tag,
  DollarSign,
  Save,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DocumentRow, ColumnOption, DEFAULT_CATEGORY_OPTIONS, DEFAULT_STATUS_OPTIONS, DEFAULT_TAG_OPTIONS } from "./types";
import { DocumentPreview } from "../DocumentPreview";

interface DocumentPreviewPanelProps {
  document: DocumentRow | null;
  onClose: () => void;
  onUpdate: (docId: string, updates: Partial<DocumentRow>) => Promise<void>;
  onDownload: (doc: DocumentRow) => void;
  categoryOptions?: ColumnOption[];
  statusOptions?: ColumnOption[];
  tagOptions?: ColumnOption[];
  isUpdating?: boolean;
}

export function DocumentPreviewPanel({
  document,
  onClose,
  onUpdate,
  onDownload,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  tagOptions = DEFAULT_TAG_OPTIONS,
  isUpdating = false,
}: DocumentPreviewPanelProps) {
  const [formData, setFormData] = useState({
    document_type: "",
    status: "",
    financial_value: "",
    notes: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      setFormData({
        document_type: document.document_type || "",
        status: document.status || "",
        financial_value: document.financial_value?.toString() || "",
        notes: document.notes || "",
        tags: document.tags || [],
      });
      setHasChanges(false);
    }
  }, [document?.id]);

  if (!document) return null;

  const handleChange = (field: string, value: string | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleChange("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange("tags", formData.tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    await onUpdate(document.id, {
      document_type: formData.document_type || null,
      status: formData.status || null,
      financial_value: formData.financial_value ? parseFloat(formData.financial_value) : null,
      notes: formData.notes || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
    });
    setHasChanges(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTagColor = (tag: string) => {
    return tagOptions.find(t => t.label === tag)?.color || "#6b7280";
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <h3 className="font-medium truncate text-sm">{document.name}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(document)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={document.file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="h-[40%] min-h-[200px] border-b bg-muted/20 overflow-hidden">
          <DocumentPreview document={document} />
        </div>

        {/* Metadata Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pb-3 border-b">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{document.created_at ? format(new Date(document.created_at), "dd/MM/yyyy") : "—"}</span>
            </div>
            <span>{formatFileSize(document.file_size)}</span>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category</Label>
            <Select
              value={formData.document_type}
              onValueChange={(val) => handleChange("document_type", val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => handleChange("status", val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.label} value={opt.label}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Value */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Financial Value</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.financial_value}
                onChange={(e) => handleChange("financial_value", e.target.value)}
                className="h-9 pl-9 font-mono"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: `${getTagColor(tag)}20`,
                    color: getTagColor(tag),
                  }}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value="" onValueChange={(val) => {
                if (val && !formData.tags.includes(val)) {
                  handleChange("tags", [...formData.tags, val]);
                }
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Add tag..." />
                </SelectTrigger>
                <SelectContent>
                  {tagOptions
                    .filter(opt => !formData.tags.includes(opt.label))
                    .map((opt) => (
                      <SelectItem key={opt.label} value={opt.label}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea
              placeholder="Add notes..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-3 border-t bg-muted/30">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="w-full h-9"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
