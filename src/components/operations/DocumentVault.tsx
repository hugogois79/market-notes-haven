import { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Search, 
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import DocumentUploadForm from "./DocumentUploadForm";

type Document = {
  id: string;
  staff_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  issue_date: string | null;
  expiry_date: string | null;
  is_verified: boolean;
  notes: string | null;
  staff_profiles?: {
    full_name: string;
    role_category: string;
  };
};

const DocumentVault = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterExpiry, setFilterExpiry] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contracts_docs")
        .select(`
          *,
          staff_profiles (
            full_name,
            role_category
          )
        `)
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const { error } = await supabase
        .from("contracts_docs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const toggleVerified = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("contracts_docs")
        .update({ is_verified: !currentValue })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(currentValue ? "Verification removed" : "Document verified");
      fetchDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: "none", days: null };
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { status: "expired", days };
    if (days <= 7) return { status: "critical", days };
    if (days <= 30) return { status: "warning", days };
    return { status: "ok", days };
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.staff_profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || doc.doc_type === filterType;
    
    const expiry = getExpiryStatus(doc.expiry_date);
    const matchesExpiry = 
      filterExpiry === "all" ||
      (filterExpiry === "expiring" && (expiry.status === "critical" || expiry.status === "warning")) ||
      (filterExpiry === "expired" && expiry.status === "expired");
    
    return matchesSearch && matchesType && matchesExpiry;
  });

  const expiringCount = documents.filter((doc) => {
    const expiry = getExpiryStatus(doc.expiry_date);
    return expiry.status === "critical" || expiry.status === "warning";
  }).length;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {expiringCount > 0 && (
        <Card className="bg-amber-950/30 border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-amber-200">
              <strong>{expiringCount}</strong> document{expiringCount > 1 ? "s" : ""} expiring within 30 days
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto border-amber-600 text-amber-400 hover:bg-amber-950"
              onClick={() => setFilterExpiry("expiring")}
            >
              View All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="NDA">NDA</SelectItem>
              <SelectItem value="Employment_Contract">Employment Contract</SelectItem>
              <SelectItem value="Passport">Passport</SelectItem>
              <SelectItem value="License">License</SelectItem>
              <SelectItem value="Medical_Cert">Medical Certificate</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterExpiry} onValueChange={setFilterExpiry}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No documents found. Upload your first document.
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const expiry = getExpiryStatus(doc.expiry_date);
                return (
                  <TableRow 
                    key={doc.id}
                    className={
                      expiry.status === "critical" ? "bg-red-950/20" :
                      expiry.status === "warning" ? "bg-amber-950/20" :
                      expiry.status === "expired" ? "bg-red-950/30" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {doc.staff_profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {doc.doc_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {doc.file_name}
                    </TableCell>
                    <TableCell>
                      {doc.issue_date ? format(new Date(doc.issue_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.expiry_date ? format(new Date(doc.expiry_date), "MMM d, yyyy") : "-"}
                        {expiry.status === "critical" && (
                          <Badge variant="destructive" className="animate-pulse">
                            {expiry.days}d
                          </Badge>
                        )}
                        {expiry.status === "warning" && (
                          <Badge className="bg-amber-500/20 text-amber-400">
                            {expiry.days}d
                          </Badge>
                        )}
                        {expiry.status === "expired" && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.is_verified ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVerified(doc.id, doc.is_verified)}
                        >
                          {doc.is_verified ? (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <DocumentUploadForm 
            onSuccess={() => {
              setUploadOpen(false);
              fetchDocuments();
            }}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentVault;
