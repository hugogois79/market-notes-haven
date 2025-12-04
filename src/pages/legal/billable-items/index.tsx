import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Paperclip,
  Search,
  ArrowLeft,
  FileText,
  Check,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface BillableItem {
  id: string;
  case_id: string | null;
  description: string;
  invoice_number: string | null;
  date: string;
  type: string;
  amount: number;
  is_paid: boolean;
  attachment_url: string | null;
  notes: string | null;
  user_id: string | null;
  case_title?: string;
}

interface LegalCase {
  id: string;
  title: string;
}

const typeColors: Record<string, string> = {
  fees: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  external_services: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  hours_worked: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const typeLabels: Record<string, string> = {
  fees: "Honorários",
  external_services: "Serviços Externos",
  hours_worked: "Horas Trabalhadas",
};

export default function LegalBillableItemsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [paidFilter, setPaidFilter] = useState<string>("all");
  const [openCases, setOpenCases] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BillableItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    case_id: "",
    description: "",
    invoice_number: "",
    date: new Date().toISOString().split("T")[0],
    type: "fees",
    amount: 0,
    is_paid: false,
    attachment_url: "",
    notes: "",
  });

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("legal-documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("legal-documents")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Fetch legal cases
  const { data: cases = [] } = useQuery({
    queryKey: ["legal-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_cases")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data as LegalCase[];
    },
  });

  // Fetch billable items with case info
  const { data: billableItems = [], isLoading } = useQuery({
    queryKey: ["legal-billable-items"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data, error } = await supabase
        .from("legal_billable_items")
        .select(`
          *,
          legal_cases (title)
        `)
        .eq("user_id", userId)
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        case_title: item.legal_cases?.title || "Sem Caso",
      })) as BillableItem[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("legal_billable_items").insert({
        ...data,
        case_id: data.case_id || null,
        user_id: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-billable-items"] });
      toast.success("Item criado com sucesso");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar item");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("legal_billable_items")
        .update({
          ...data,
          case_id: data.case_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-billable-items"] });
      toast.success("Item atualizado com sucesso");
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar item");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("legal_billable_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-billable-items"] });
      toast.success("Item eliminado com sucesso");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast.error("Erro ao eliminar item");
    },
  });

  const resetForm = () => {
    setFormData({
      case_id: "",
      description: "",
      invoice_number: "",
      date: new Date().toISOString().split("T")[0],
      type: "fees",
      amount: 0,
      is_paid: false,
      attachment_url: "",
      notes: "",
    });
    setSelectedFile(null);
  };

  const handleEdit = (item: BillableItem) => {
    setEditingItem(item);
    setFormData({
      case_id: item.case_id || "",
      description: item.description,
      invoice_number: item.invoice_number || "",
      date: item.date,
      type: item.type,
      amount: item.amount,
      is_paid: item.is_paid,
      attachment_url: item.attachment_url || "",
      notes: item.notes || "",
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.description) {
      toast.error("Descrição é obrigatória");
      return;
    }

    setIsUploading(true);
    try {
      let attachmentUrl = formData.attachment_url;

      // Upload file if selected
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (uploadedUrl) {
          attachmentUrl = uploadedUrl;
        }
      }

      const dataToSubmit = { ...formData, attachment_url: attachmentUrl };

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: dataToSubmit });
      } else {
        createMutation.mutate(dataToSubmit);
      }
    } catch (error) {
      toast.error("Erro ao fazer upload do ficheiro");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCase = (caseId: string) => {
    setOpenCases((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return billableItems.filter((item) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !item.description.toLowerCase().includes(search) &&
          !(item.invoice_number || "").toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      if (paidFilter === "paid" && !item.is_paid) return false;
      if (paidFilter === "unpaid" && item.is_paid) return false;
      return true;
    });
  }, [billableItems, searchTerm, paidFilter]);

  // Group by case
  const groupedByCases = useMemo(() => {
    const grouped: Record<string, { caseName: string; items: BillableItem[]; total: number }> = {};

    filteredItems.forEach((item) => {
      const caseKey = item.case_id || "no-case";
      if (!grouped[caseKey]) {
        grouped[caseKey] = {
          caseName: item.case_title || "Sem Caso",
          items: [],
          total: 0,
        };
      }
      grouped[caseKey].items.push(item);
      grouped[caseKey].total += item.amount;
    });

    return grouped;
  }, [filteredItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT");
  };

  const grandTotal = useMemo(() => {
    return Object.values(groupedByCases).reduce((sum, group) => sum + group.total, 0);
  }, [groupedByCases]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/legal">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-foreground">Financeiro</h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Gestão de Itens Faturáveis por Caso
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingItem(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por descrição ou fatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={paidFilter} onValueChange={setPaidFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="unpaid">Não Pagos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grand Total */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Total Geral ({Object.keys(groupedByCases).length} casos)
        </span>
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          A carregar itens...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum item faturável encontrado. Clique em "Nova Despesa" para adicionar.
        </div>
      )}

      {/* Grouped Accordion List */}
      <div className="space-y-3">
        {Object.entries(groupedByCases).map(([caseId, { caseName, items, total }]) => {
          const isOpen = openCases[caseId];

          return (
            <Collapsible
              key={caseId}
              open={isOpen}
              onOpenChange={() => toggleCase(caseId)}
            >
              {/* Case Header / Separator */}
              <div className="border rounded-lg bg-card overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground text-lg">
                        {caseName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length} itens
                      </Badge>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-muted text-foreground font-bold text-base px-4 py-1"
                    >
                      {formatCurrency(total)}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[28%]">Descrição</TableHead>
                          <TableHead className="w-[10%]">Fatura #</TableHead>
                          <TableHead className="w-[10%]">Data</TableHead>
                          <TableHead className="w-[14%]">Tipo</TableHead>
                          <TableHead className="w-[12%] text-right">Valor</TableHead>
                          <TableHead className="w-[6%] text-center">Pago</TableHead>
                          <TableHead className="w-[6%] text-center">
                            <Paperclip className="w-4 h-4 inline-block" />
                          </TableHead>
                          <TableHead className="w-[14%] text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-accent/30"
                          >
                            <TableCell className="font-medium">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.invoice_number || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(item.date)}
                            </TableCell>
                            <TableCell>
                              <Badge className={typeColors[item.type] || typeColors.fees}>
                                {typeLabels[item.type] || item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.is_paid ? (
                                <Check className="w-5 h-5 text-green-600 inline-block" />
                              ) : (
                                <Checkbox disabled />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.attachment_url ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Paperclip className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setItemToDelete(item.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item Faturável" : "Nova Despesa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Caso</Label>
              <Select
                value={formData.case_id || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, case_id: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar caso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Caso</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ex: Honorários 1º Trimestre 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº Fatura</Label>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoice_number: e.target.value }))
                  }
                  placeholder="Ex: 900174943"
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fees">Honorários</SelectItem>
                    <SelectItem value="external_services">Serviços Externos</SelectItem>
                    <SelectItem value="hours_worked">Horas Trabalhadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_paid: checked as boolean }))
                }
              />
              <Label htmlFor="is_paid" className="cursor-pointer">
                Pago
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notas adicionais (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Anexo</Label>
              {(formData.attachment_url || selectedFile) ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">
                    {selectedFile?.name || formData.attachment_url?.split('/').pop() || 'Ficheiro anexado'}
                  </span>
                  {formData.attachment_url && !selectedFile && (
                    <a
                      href={formData.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Ver
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFormData((prev) => ({ ...prev, attachment_url: "" }));
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar ficheiro
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
            >
              {isUploading ? "A carregar..." : editingItem ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este item faturável? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
