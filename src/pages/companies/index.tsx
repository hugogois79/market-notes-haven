import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Edit, Trash2, Eye, AlertTriangle, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import CompanyDialog from "@/components/financial/CompanyDialog";

type ColumnKey = "name" | "taxId" | "jurisdiction" | "status" | "riskRating" | "actions";

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  required?: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { key: "name", label: "Company Name", required: true },
  { key: "taxId", label: "Tax ID" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "status", label: "Status" },
  { key: "riskRating", label: "Risk Rating" },
  { key: "actions", label: "Actions", required: true },
];

const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = ["name", "taxId", "jurisdiction", "status", "riskRating", "actions"];

const STORAGE_KEY = "companies-visible-columns";

export default function CompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = (key: ColumnKey) => {
    const col = ALL_COLUMNS.find(c => c.key === key);
    if (col?.required) return;
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  const isColumnVisible = (key: ColumnKey) => visibleColumns.includes(key);

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

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

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.tax_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "Liquidated":
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50"><AlertTriangle className="h-3 w-3 mr-1" />Liquidated</Badge>;
      case "Under Investigation":
        return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50"><AlertCircle className="h-3 w-3 mr-1" />Investigation</Badge>;
      case "Closed":
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100">Closed</Badge>;
      default:
        return <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case "Low":
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50/50">Low</Badge>;
      case "Medium":
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50/50">Medium</Badge>;
      case "High":
        return <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50/50"><AlertCircle className="h-3 w-3 mr-1" />High</Badge>;
      case "Critical":
        return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50"><AlertCircle className="h-3 w-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50/50">Low</Badge>;
    }
  };

  const visibleColumnCount = visibleColumns.length;

  return (
    <div className="p-6 space-y-6 bg-[#faf9f8] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Companies</h1>
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
            value="list" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Companies List
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
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  {isColumnVisible("name") && <TableHead className="font-semibold text-slate-700">Company Name</TableHead>}
                  {isColumnVisible("taxId") && <TableHead className="font-semibold text-slate-700">Tax ID</TableHead>}
                  {isColumnVisible("jurisdiction") && <TableHead className="font-semibold text-slate-700">Jurisdiction</TableHead>}
                  {isColumnVisible("status") && <TableHead className="font-semibold text-slate-700">Status</TableHead>}
                  {isColumnVisible("riskRating") && <TableHead className="font-semibold text-slate-700">Risk Rating</TableHead>}
                  {isColumnVisible("actions") && <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-8 text-muted-foreground">
                      Loading companies...
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="text-center py-8 text-muted-foreground">
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
                      {isColumnVisible("name") && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </TableCell>
                      )}
                      {isColumnVisible("taxId") && (
                        <TableCell className="font-mono text-sm">{company.tax_id}</TableCell>
                      )}
                      {isColumnVisible("jurisdiction") && (
                        <TableCell>{(company as any).jurisdiction || company.country || "—"}</TableCell>
                      )}
                      {isColumnVisible("status") && (
                        <TableCell>{getStatusBadge((company as any).status)}</TableCell>
                      )}
                      {isColumnVisible("riskRating") && (
                        <TableCell>{getRiskBadge((company as any).risk_rating)}</TableCell>
                      )}
                      {isColumnVisible("actions") && (
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
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="border border-slate-200 rounded-lg bg-white p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Column Settings</h2>
            <p className="text-sm text-slate-500 mb-6">Choose which columns to display in the Companies table.</p>
            
            <div className="space-y-4">
              {ALL_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <Label htmlFor={`col-${col.key}`} className="text-sm font-medium text-slate-700">
                    {col.label}
                    {col.required && <span className="text-slate-400 text-xs ml-2">(Required)</span>}
                  </Label>
                  <Switch
                    id={`col-${col.key}`}
                    checked={isColumnVisible(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                    disabled={col.required}
                  />
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={resetColumns} className="mt-6">
              Reset to Default
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCompany(null);
        }}
        company={editingCompany}
      />
    </div>
  );
}
