import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  User
} from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadDialog from "@/components/companies/DocumentUploadDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = ["All", "Invoice", "Contract", "Proof", "Receipt", "Legal", "Report", "Other"];
const DOCUMENT_STATUSES = ["All", "Draft", "Final", "Filed", "Archived"];

type SortField = "name" | "updated_at" | "file_size" | "document_type" | "status";
type SortDirection = "asc" | "desc";

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

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["company-documents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_documents")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setUploadDialogOpen(true);
  }, []);

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
      Draft: "bg-amber-100 text-amber-800 border-amber-200",
      Final: "bg-green-100 text-green-800 border-green-200",
      Filed: "bg-blue-100 text-blue-800 border-blue-200",
      Archived: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
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
      {/* SharePoint-style Header */}
      <div className="bg-background border-b px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="/companies" className="text-primary hover:underline">Companies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/companies/${id}`} className="text-primary hover:underline">{company.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground font-medium">Documents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Company Header */}
      <div className="bg-background border-b px-6 py-4">
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
                : "border-muted-foreground/20 bg-background"
            )}
          >
            <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag files here or{" "}
              <button onClick={() => setUploadDialogOpen(true)} className="text-primary hover:underline">
                browse
              </button>
            </p>
          </div>

          {/* SharePoint Command Bar */}
          <div className="bg-background border rounded-t-lg border-b-0">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      New
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
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

                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Grid3X3 className="h-4 w-4" />
                  Edit in grid view
                </Button>

                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>

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

          {/* SharePoint-style Dense Data Grid */}
          <div className="bg-background border rounded-b-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-10 px-3 py-2">
                      <Checkbox 
                        checked={selectedDocs.size === filteredDocuments?.length && filteredDocuments?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      <SortHeader field="name">Name</SortHeader>
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide w-32">
                      <SortHeader field="updated_at">Modified</SortHeader>
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide w-36">
                      Modified By
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide w-24">
                      <SortHeader field="status">Status</SortHeader>
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide w-40">
                      Tags
                    </th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {documentsLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Loading documents...
                      </td>
                    </tr>
                  ) : filteredDocuments?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No documents found</p>
                        <Button variant="link" size="sm" onClick={() => setUploadDialogOpen(true)} className="mt-1">
                          Upload your first document
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments?.map((doc) => (
                      <tr 
                        key={doc.id} 
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/50 transition-colors",
                          selectedDocs.has(doc.id) && "bg-primary/5"
                        )}
                      >
                        <td className="px-3 py-1.5">
                          <Checkbox 
                            checked={selectedDocs.has(doc.id)}
                            onCheckedChange={() => toggleSelect(doc.id)}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.mime_type, doc.name)}
                            <button 
                              onClick={() => handleDownload(doc)}
                              className="font-medium text-primary hover:underline truncate max-w-[280px]"
                            >
                              {doc.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {formatModifiedDate(doc.updated_at)}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground text-xs">System</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          {getStatusBadge(doc.status || "Draft")}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex gap-1 flex-wrap">
                            {doc.document_type && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {doc.document_type}
                              </span>
                            )}
                            {doc.tags?.slice(0, 2).map((tag: string, i: number) => (
                              <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {doc.tags && doc.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{doc.tags.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {filteredDocuments && filteredDocuments.length > 0 && (
              <div className="px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
                {filteredDocuments.length} item{filteredDocuments.length !== 1 ? 's' : ''}
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
      </Tabs>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        companyId={id!}
      />
    </div>
  );
}
