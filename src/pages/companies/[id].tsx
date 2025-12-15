import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  MoreHorizontal
} from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadDialog from "@/components/companies/DocumentUploadDialog";
import { format } from "date-fns";

const DOCUMENT_TYPES = ["All", "Invoice", "Contract", "Proof", "Receipt", "Legal", "Report", "Other"];
const DOCUMENT_STATUSES = ["All", "Draft", "Final", "Filed", "Archived"];

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    mutationFn: async (docId: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", id] });
      toast.success("Document deleted");
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

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || doc.document_type === typeFilter;
    const matchesStatus = statusFilter === "All" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Invoice: "bg-blue-100 text-blue-800",
      Contract: "bg-purple-100 text-purple-800",
      Proof: "bg-green-100 text-green-800",
      Receipt: "bg-amber-100 text-amber-800",
      Legal: "bg-red-100 text-red-800",
      Report: "bg-cyan-100 text-cyan-800",
      Other: "bg-slate-100 text-slate-800",
    };
    return <Badge className={`${colors[type] || colors.Other} hover:${colors[type] || colors.Other}`}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "border-amber-300 text-amber-700",
      Final: "border-green-300 text-green-700",
      Filed: "border-blue-300 text-blue-700",
      Archived: "border-slate-300 text-slate-700",
    };
    return <Badge variant="outline" className={colors[status] || colors.Draft}>{status}</Badge>;
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
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/companies">Companies</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{company.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
            </div>
            <p className="text-muted-foreground text-sm">Tax ID: {company.tax_id}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Document Library</TabsTrigger>
          <TabsTrigger value="details">Company Details</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or{" "}
              <button 
                onClick={() => setUploadDialogOpen(true)}
                className="text-primary hover:underline"
              >
                browse to upload
              </button>
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
          </div>

          {/* Documents Table */}
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Modified</TableHead>
                  <TableHead className="font-medium">Size</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="font-medium">Value</TableHead>
                  <TableHead className="font-medium">Tags</TableHead>
                  <TableHead className="font-medium w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments?.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(doc.updated_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell>{getTypeBadge(doc.document_type || "Other")}</TableCell>
                      <TableCell>{getStatusBadge(doc.status || "Draft")}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCurrency(doc.financial_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {doc.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {doc.tags && doc.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{doc.tags.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Delete this document?")) {
                                  deleteMutation.mutate(doc.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="border rounded-lg bg-card p-6">
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
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{company.country || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{company.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{company.phone || "—"}</p>
              </div>
              <div>
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
