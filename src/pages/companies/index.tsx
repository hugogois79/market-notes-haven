import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Edit, Trash2, Eye, Settings, ChevronDown, X, ListTodo } from "lucide-react";
import WorkFlowTab from "./WorkFlowTab";
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

interface ColumnOption {
  label: string;
  color: string;
}

interface CustomColumn {
  id: string;
  label: string;
  dbField: string; // 'status' | 'risk_rating' for built-in, custom id for custom
  options: ColumnOption[];
  isBuiltIn: boolean;
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

const isDarkColor = (color: string | undefined): boolean => {
  if (!color) return false;
  const darkColors = ["#1e40af", "#1e3a8a", "#312e81", "#4c1d95", "#831843", "#7f1d1d", "#dc2626", "#b91c1c", "#991b1b", "#7c3aed", "#6d28d9", "#5b21b6", "#3b82f6", "#2563eb", "#ef4444"];
  return darkColors.includes(color.toLowerCase());
};

const DEFAULT_COLUMNS: CustomColumn[] = [
  {
    id: "status",
    label: "Status",
    dbField: "status",
    isBuiltIn: true,
    options: [
      { label: "Active", color: "#bbf7d0" },
      { label: "Liquidated", color: "#fef08a" },
      { label: "Under Investigation", color: "#dc2626" },
      { label: "Closed", color: "#e5e7eb" },
    ],
  },
  {
    id: "riskRating",
    label: "Risk Rating",
    dbField: "risk_rating",
    isBuiltIn: true,
    options: [
      { label: "Low", color: "#bbf7d0" },
      { label: "Medium", color: "#fef08a" },
      { label: "High", color: "#fed7aa" },
      { label: "Critical", color: "#dc2626" },
    ],
  },
];

const CUSTOM_COLUMNS_KEY = "companies-custom-columns";
const COMPANY_CUSTOM_DATA_KEY = "companies-custom-data";

export default function CompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  
  // Custom columns (editable columns with options)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>(() => {
    const saved = localStorage.getItem(CUSTOM_COLUMNS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Custom data per company (for non-DB columns)
  const [customData, setCustomData] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(COMPANY_CUSTOM_DATA_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  // Edit dialogs
  const [editColumnDialog, setEditColumnDialog] = useState<{ open: boolean; columnId: string | null; isNew?: boolean }>({ open: false, columnId: null });
  const [editColumnName, setEditColumnName] = useState("");
  const [editColumnOptions, setEditColumnOptions] = useState<ColumnOption[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");
  
  // Add column dialog
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Persist custom columns
  useEffect(() => {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(customColumns));
  }, [customColumns]);

  // Persist custom data
  useEffect(() => {
    localStorage.setItem(COMPANY_CUSTOM_DATA_KEY, JSON.stringify(customData));
  }, [customData]);

  const openEditColumnDialog = (columnId: string) => {
    const col = customColumns.find(c => c.id === columnId);
    if (!col) return;
    
    setEditColumnName(col.label);
    setEditColumnOptions([...col.options]);
    setNewOptionInput("");
    setEditColumnDialog({ open: true, columnId });
  };
  
  const saveColumnSettings = () => {
    const columnId = editColumnDialog.columnId;
    if (!columnId) return;
    
    setCustomColumns(prev => prev.map(col => 
      col.id === columnId 
        ? { ...col, label: editColumnName, options: editColumnOptions }
        : col
    ));
    
    setEditColumnDialog({ open: false, columnId: null });
    toast.success("Column settings saved");
  };

  const deleteColumn = (columnId: string) => {
    const col = customColumns.find(c => c.id === columnId);
    if (col?.isBuiltIn) {
      toast.error("Cannot delete built-in columns");
      return;
    }
    
    setCustomColumns(prev => prev.filter(c => c.id !== columnId));
    setEditColumnDialog({ open: false, columnId: null });
    toast.success("Column deleted");
  };

  const addNewColumn = () => {
    if (!newColumnName.trim()) {
      toast.error("Please enter a column name");
      return;
    }
    
    const newId = `custom_${Date.now()}`;
    const newColumn: CustomColumn = {
      id: newId,
      label: newColumnName.trim(),
      dbField: newId,
      isBuiltIn: false,
      options: [
        { label: "Option 1", color: "#bbf7d0" },
        { label: "Option 2", color: "#fef08a" },
      ],
    };
    
    setCustomColumns(prev => [...prev, newColumn]);
    setAddColumnDialog(false);
    setNewColumnName("");
    toast.success("Column added");
    
    // Open edit dialog for the new column
    setTimeout(() => openEditColumnDialog(newId), 100);
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

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({ [field]: value })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Updated successfully");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const updateCustomData = (companyId: string, columnId: string, value: string) => {
    setCustomData(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [columnId]: value,
      },
    }));
    toast.success("Updated successfully");
  };

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.tax_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColumnValue = (company: any, column: CustomColumn): string | null => {
    if (column.isBuiltIn) {
      return (company as any)[column.dbField] || null;
    }
    return customData[company.id]?.[column.id] || null;
  };

  const getBadge = (value: string | null, column: CustomColumn) => {
    const option = column.options.find(o => o.label === value);
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
    return <Badge className="bg-slate-100 text-slate-600">{value || "—"}</Badge>;
  };
  
  const renderColumnHeader = (col: CustomColumn) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900">
            {col.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => openEditColumnDialog(col.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Column
          </DropdownMenuItem>
          {!col.isBuiltIn && (
            <DropdownMenuItem 
              onClick={() => {
                if (confirm("Delete this column?")) {
                  deleteColumn(col.id);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Options:</div>
          {col.options.map((option) => (
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
  };

  const renderCellDropdown = (company: any, column: CustomColumn) => {
    const currentValue = getColumnValue(company, column);
    
    return (
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              {getBadge(currentValue, column)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[120px]">
            {column.options.map((option) => (
              <DropdownMenuItem 
                key={option.label}
                onClick={() => {
                  if (column.isBuiltIn) {
                    updateCompanyMutation.mutate({ 
                      id: company.id, 
                      field: column.dbField, 
                      value: option.label 
                    });
                  } else {
                    updateCustomData(company.id, column.id, option.label);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-[#faf9f8] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Work</h1>
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
          <TabsTrigger 
            value="workflow" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 pb-2"
          >
            <ListTodo className="h-4 w-4 mr-2" />
            WorkFlow
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
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead>
                    <span className="font-semibold text-slate-700">Company Name</span>
                  </TableHead>
                  <TableHead>
                    <span className="font-semibold text-slate-700">Tax ID</span>
                  </TableHead>
                  <TableHead>
                    <span className="font-semibold text-slate-700">Jurisdiction</span>
                  </TableHead>
                  {customColumns.map((col) => (
                    <TableHead key={col.id}>
                      {renderColumnHeader(col)}
                    </TableHead>
                  ))}
                  <TableHead className="w-10">
                    <button 
                      onClick={() => setAddColumnDialog(true)}
                      className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                      title="Add column"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="font-semibold text-slate-700">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5 + customColumns.length} className="text-center py-8 text-muted-foreground">
                      Loading companies...
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5 + customColumns.length} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{company.tax_id}</TableCell>
                      <TableCell>{(company as any).jurisdiction || company.country || "—"}</TableCell>
                      {customColumns.map((col) => renderCellDropdown(company, col))}
                      <TableCell></TableCell>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="border border-slate-200 rounded-lg bg-white p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Custom Columns</h2>
            <p className="text-sm text-slate-500 mb-6">Manage editable columns with custom options.</p>
            
            <div className="space-y-4">
              {customColumns.map((col) => (
                <div key={col.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium text-slate-700">
                      {col.label}
                      {col.isBuiltIn && <span className="text-slate-400 text-xs ml-2">(Built-in)</span>}
                    </Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEditColumnDialog(col.id)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  {!col.isBuiltIn && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this column?")) {
                          deleteColumn(col.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={() => setAddColumnDialog(true)} className="mt-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <WorkFlowTab />
        </TabsContent>
      </Tabs>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialog} onOpenChange={setAddColumnDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Name</Label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name"
                onKeyDown={(e) => e.key === "Enter" && addNewColumn()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNewColumn} className="bg-blue-600 hover:bg-blue-700">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={editColumnDialog.open} onOpenChange={(open) => setEditColumnDialog({ open, columnId: open ? editColumnDialog.columnId : null })}>
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
          </div>
          <DialogFooter className="flex justify-between">
            {editColumnDialog.columnId && !customColumns.find(c => c.id === editColumnDialog.columnId)?.isBuiltIn && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm("Delete this column?")) {
                    deleteColumn(editColumnDialog.columnId!);
                  }
                }}
              >
                Delete Column
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setEditColumnDialog({ open: false, columnId: null })}>
                Cancel
              </Button>
              <Button onClick={saveColumnSettings} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </div>
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
