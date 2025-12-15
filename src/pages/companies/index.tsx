import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Edit, Trash2, Eye, Settings, ChevronDown, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import CompanyDialog from "@/components/financial/CompanyDialog";

type ColumnKey = "name" | "taxId" | "jurisdiction" | "status" | "riskRating" | "actions";

interface ColumnOption {
  label: string;
  color: string;
}

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  required?: boolean;
  editable?: boolean;
  options?: ColumnOption[];
}

const COLOR_PRESETS = [
  "#fecaca", // Light red
  "#dc2626", // Dark red
  "#fed7aa", // Light orange
  "#fef08a", // Light yellow
  "#bbf7d0", // Light green
  "#bae6fd", // Light sky
  "#93c5fd", // Light blue
  "#3b82f6", // Bright blue
  "#1e40af", // Dark blue
  "#ddd6fe", // Light purple
  "#7c3aed", // Dark purple
  "#fbcfe8", // Light pink
];

const isDarkColor = (color: string): boolean => {
  const darkColors = ["#1e40af", "#1e3a8a", "#312e81", "#4c1d95", "#831843", "#7f1d1d", "#dc2626", "#b91c1c", "#991b1b", "#7c3aed", "#6d28d9", "#5b21b6", "#3b82f6", "#2563eb", "#ef4444"];
  return darkColors.includes(color.toLowerCase());
};

const DEFAULT_STATUS_OPTIONS: ColumnOption[] = [
  { label: "Active", color: "#bbf7d0" },
  { label: "Liquidated", color: "#fef08a" },
  { label: "Under Investigation", color: "#dc2626" },
  { label: "Closed", color: "#e5e7eb" },
];

const DEFAULT_RISK_OPTIONS: ColumnOption[] = [
  { label: "Low", color: "#bbf7d0" },
  { label: "Medium", color: "#fef08a" },
  { label: "High", color: "#fed7aa" },
  { label: "Critical", color: "#dc2626" },
];

const STORAGE_KEY = "companies-visible-columns";
const COLUMN_LABELS_KEY = "companies-column-labels";
const STATUS_OPTIONS_KEY = "companies-status-options";
const RISK_OPTIONS_KEY = "companies-risk-options";

export default function CompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : ["name", "taxId", "jurisdiction", "status", "riskRating", "actions"];
  });
  
  // Custom column labels
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(COLUMN_LABELS_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  
  // Custom options for editable columns
  const [statusOptions, setStatusOptions] = useState<ColumnOption[]>(() => {
    const saved = localStorage.getItem(STATUS_OPTIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATUS_OPTIONS;
  });
  
  const [riskOptions, setRiskOptions] = useState<ColumnOption[]>(() => {
    const saved = localStorage.getItem(RISK_OPTIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_RISK_OPTIONS;
  });
  
  // Edit dialogs
  const [editColumnDialog, setEditColumnDialog] = useState<{ open: boolean; column: ColumnKey | null }>({ open: false, column: null });
  const [editColumnName, setEditColumnName] = useState("");
  const [editColumnOptions, setEditColumnOptions] = useState<ColumnOption[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  
  useEffect(() => {
    localStorage.setItem(COLUMN_LABELS_KEY, JSON.stringify(columnLabels));
  }, [columnLabels]);
  
  useEffect(() => {
    localStorage.setItem(STATUS_OPTIONS_KEY, JSON.stringify(statusOptions));
  }, [statusOptions]);
  
  useEffect(() => {
    localStorage.setItem(RISK_OPTIONS_KEY, JSON.stringify(riskOptions));
  }, [riskOptions]);

  const ALL_COLUMNS: ColumnConfig[] = [
    { key: "name", label: columnLabels["name"] || "Company Name", required: true },
    { key: "taxId", label: columnLabels["taxId"] || "Tax ID" },
    { key: "jurisdiction", label: columnLabels["jurisdiction"] || "Jurisdiction" },
    { key: "status", label: columnLabels["status"] || "Status", editable: true, options: statusOptions },
    { key: "riskRating", label: columnLabels["riskRating"] || "Risk Rating", editable: true, options: riskOptions },
    { key: "actions", label: columnLabels["actions"] || "Actions", required: true },
  ];

  const toggleColumn = (key: ColumnKey) => {
    const col = ALL_COLUMNS.find(c => c.key === key);
    if (col?.required) return;
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resetColumns = () => {
    setVisibleColumns(["name", "taxId", "jurisdiction", "status", "riskRating", "actions"]);
    setColumnLabels({});
    setStatusOptions(DEFAULT_STATUS_OPTIONS);
    setRiskOptions(DEFAULT_RISK_OPTIONS);
  };

  const isColumnVisible = (key: ColumnKey) => visibleColumns.includes(key);
  
  const openEditColumnDialog = (column: ColumnKey) => {
    const col = ALL_COLUMNS.find(c => c.key === column);
    if (!col) return;
    
    setEditColumnName(col.label);
    if (column === "status") {
      setEditColumnOptions([...statusOptions]);
    } else if (column === "riskRating") {
      setEditColumnOptions([...riskOptions]);
    } else {
      setEditColumnOptions([]);
    }
    setNewOptionInput("");
    setEditColumnDialog({ open: true, column });
  };
  
  const saveColumnSettings = () => {
    const column = editColumnDialog.column;
    if (!column) return;
    
    // Save label
    setColumnLabels(prev => ({ ...prev, [column]: editColumnName }));
    
    // Save options
    if (column === "status") {
      setStatusOptions(editColumnOptions);
    } else if (column === "riskRating") {
      setRiskOptions(editColumnOptions);
    }
    
    setEditColumnDialog({ open: false, column: null });
    toast.success("Column settings saved");
  };
  
  const addOption = () => {
    if (newOptionInput.trim() && !editColumnOptions.some(o => o.label === newOptionInput.trim())) {
      setEditColumnOptions([...editColumnOptions, { label: newOptionInput.trim(), color: "#e5e7eb" }]);
      setNewOptionInput("");
    }
  };
  
  const removeOption = (label: string) => {
    setEditColumnOptions(editColumnOptions.filter(o => o.label !== label));
  };

  const updateOptionColor = (label: string, color: string) => {
    setEditColumnOptions(editColumnOptions.map(o => 
      o.label === label ? { ...o, color } : o
    ));
  };

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
    const option = statusOptions.find(o => o.label === status);
    if (option) {
      return (
        <Badge 
          style={{ 
            backgroundColor: option.color,
            color: isDarkColor(option.color) ? '#ffffff' : '#000000',
            borderColor: option.color
          }}
        >
          {option.label}
        </Badge>
      );
    }
    return <Badge className="bg-slate-100 text-slate-600">{status || "Unknown"}</Badge>;
  };

  const getRiskBadge = (risk: string | null) => {
    const option = riskOptions.find(o => o.label === risk);
    if (option) {
      return (
        <Badge 
          variant="outline"
          style={{ 
            backgroundColor: option.color,
            color: isDarkColor(option.color) ? '#ffffff' : '#000000',
            borderColor: option.color
          }}
        >
          {option.label}
        </Badge>
      );
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-600">{risk || "Unknown"}</Badge>;
  };

  const visibleColumnCount = visibleColumns.length;
  
  const renderColumnHeader = (col: ColumnConfig) => {
    if (col.editable) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900">
              {col.label}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => openEditColumnDialog(col.key)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Options:</div>
            {col.options?.map((option) => (
              <DropdownMenuItem key={option.label} disabled className="text-sm flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return <span className="font-semibold text-slate-700">{col.label}</span>;
  };

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
                  {ALL_COLUMNS.map((col) => 
                    isColumnVisible(col.key) && (
                      <TableHead key={col.key} className={col.key === "actions" ? "text-right" : ""}>
                        {renderColumnHeader(col)}
                      </TableHead>
                    )
                  )}
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
                  <div className="flex items-center gap-3">
                    <Label htmlFor={`col-${col.key}`} className="text-sm font-medium text-slate-700">
                      {col.label}
                      {col.required && <span className="text-slate-400 text-xs ml-2">(Required)</span>}
                    </Label>
                    {col.editable && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEditColumnDialog(col.key)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
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

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialog.open} onOpenChange={(open) => setEditColumnDialog({ open, column: open ? editColumnDialog.column : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input
                value={editColumnName}
                onChange={(e) => setEditColumnName(e.target.value)}
                placeholder="Enter column name"
              />
            </div>
            
            {(editColumnDialog.column === "status" || editColumnDialog.column === "riskRating") && (
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {editColumnOptions.map((option) => (
                    <div 
                      key={option.label}
                      className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      {/* Preview badge */}
                      <div 
                        className="px-2 py-1 rounded text-xs font-medium min-w-[80px] text-center"
                        style={{ 
                          backgroundColor: option.color,
                          color: isDarkColor(option.color) ? '#ffffff' : '#000000'
                        }}
                      >
                        {option.label}
                      </div>
                      
                      {/* Color presets */}
                      <div className="flex gap-1 flex-wrap">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateOptionColor(option.label, color)}
                            className={`w-5 h-5 rounded-full border-2 transition-all ${
                              option.color === color 
                                ? 'border-slate-900 scale-110' 
                                : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={() => removeOption(option.label)}
                        className="ml-auto text-slate-400 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    placeholder="Add new option"
                    onKeyDown={(e) => e.key === "Enter" && addOption()}
                  />
                  <Button type="button" variant="outline" onClick={addOption}>
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColumnDialog({ open: false, column: null })}>
              Cancel
            </Button>
            <Button onClick={saveColumnSettings} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
