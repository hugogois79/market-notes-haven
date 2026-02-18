import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Search, FileText, Filter, StickyNote, Settings } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { CaseDialog } from "../components/CaseDialog";
import LegalCaseNotesDialog from "../components/LegalCaseNotesDialog";
import { FolderMappingSettings } from "../components/FolderMappingSettings";
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

interface LegalCase {
  id: string;
  title: string;
  case_number: string | null;
  status: string;
  case_type: string | null;
  priority: string | null;
  description: string | null;
  date_opened: string | null;
  created_at: string;
}

const CASE_TYPES = [
  "Criminal",
  "Civil",
  "Família",
  "Trabalho",
  "Administrativo",
  "Fiscal",
  "Comercial",
  "Outro"
];

const PRIORITIES = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

const STATUSES = [
  { value: "Active", label: "Ativo" },
  { value: "Pending", label: "Pendente" },
  { value: "Awaiting", label: "A aguardar" },
  { value: "Closed", label: "Fechado" }
];

const statusColors: Record<string, string> = {
  "Active": "bg-green-100 text-green-800",
  "Closed": "bg-gray-100 text-gray-800",
  "Pending": "bg-yellow-100 text-yellow-800",
  "Awaiting": "bg-blue-100 text-blue-800",
};

const priorityColors: Record<string, string> = {
  "low": "bg-gray-100 text-gray-700",
  "medium": "bg-blue-100 text-blue-700",
  "high": "bg-orange-100 text-orange-700",
  "urgent": "bg-red-100 text-red-700",
};

const priorityLabels: Record<string, string> = {
  "low": "Baixa",
  "medium": "Média",
  "high": "Alta",
  "urgent": "Urgente",
};

const formatDateToEU = (dateStr: string | null): string => {
  if (!dateStr) return "";
  // Convert yyyy-mm-dd to dd/mm/yyyy
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function LegalCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: "",
    case_number: "",
    status: "",
    case_type: "",
    priority: "",
    description: "",
    date_opened: "",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [notesDialogCase, setNotesDialogCase] = useState<LegalCase | null>(null);

  // Fetch note counts for all cases
  const { data: noteCounts = {} } = useQuery({
    queryKey: ["case-notes-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from("legal_case_note_links")
        .select("case_id")
        .eq("user_id", user.id);

      if (error) throw error;

      // Count notes per case
      const counts: Record<string, number> = {};
      data?.forEach(link => {
        counts[link.case_id] = (counts[link.case_id] || 0) + 1;
      });
      return counts;
    },
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("legal_cases")
        .select("*")
        .eq("user_id", user.id)
        .order("title");

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      toast.error("Erro ao carregar casos");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (caseItem: LegalCase) => {
    setEditingId(caseItem.id);
    setEditValues({
      title: caseItem.title,
      case_number: caseItem.case_number || "",
      status: caseItem.status,
      case_type: caseItem.case_type || "",
      priority: caseItem.priority || "medium",
      description: caseItem.description || "",
      date_opened: formatDateToEU(caseItem.date_opened),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({
      title: "",
      case_number: "",
      status: "",
      case_type: "",
      priority: "",
      description: "",
      date_opened: "",
    });
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    // Try dd/mm/yyyy format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Try yyyy-mm-dd format (already valid)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    return null;
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from("legal_cases")
        .update({
          title: editValues.title,
          case_number: editValues.case_number || null,
          status: editValues.status,
          case_type: editValues.case_type || null,
          priority: editValues.priority || null,
          description: editValues.description || null,
          date_opened: parseDate(editValues.date_opened),
        })
        .eq("id", editingId);

      if (error) throw error;
      toast.success("Caso atualizado");
      fetchCases();
      cancelEdit();
    } catch (error: any) {
      console.error("Error updating case:", error);
      toast.error("Erro ao atualizar caso");
    }
  };

  const deleteCase = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("legal_cases")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Caso eliminado");
      fetchCases();
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting case:", error);
      toast.error("Erro ao eliminar caso");
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.case_number && caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.case_type && caseItem.case_type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || caseItem.status === filterStatus;
    const matchesType = filterType === "all" || caseItem.case_type === filterType;
    const matchesPriority = filterPriority === "all" || caseItem.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const hasActiveFilters = searchTerm || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
    setFilterPriority("all");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/legal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Gestão de Casos</h1>
          <p className="text-muted-foreground">Consultar, editar e eliminar casos jurídicos ({cases.length} total)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Caso
        </Button>
      </div>

      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="cases">Casos</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar casos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos os Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {CASE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todas Prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum caso encontrado.
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Título</TableHead>
                <TableHead className="min-w-[120px]">Nº Processo</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Tipo</TableHead>
                <TableHead className="min-w-[90px]">Prioridade</TableHead>
                <TableHead className="min-w-[120px]">Data Abertura</TableHead>
                <TableHead className="min-w-[150px]">Descrição</TableHead>
                <TableHead className="min-w-[70px] text-center">Notas</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Input
                        value={editValues.title}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <button
                        onClick={() => navigate(`/legal?case=${caseItem.id}`)}
                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                      >
                        {caseItem.title}
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Input
                        value={editValues.case_number}
                        onChange={(e) => setEditValues({ ...editValues, case_number: e.target.value })}
                        className="h-8"
                        placeholder="Nº Processo"
                      />
                    ) : caseItem.case_number ? (
                      <span className="text-sm flex items-center gap-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        {caseItem.case_number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Select
                        value={editValues.status}
                        onValueChange={(value) => setEditValues({ ...editValues, status: value })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusColors[caseItem.status] || ""}>
                        {caseItem.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Select
                        value={editValues.case_type}
                        onValueChange={(value) => setEditValues({ ...editValues, case_type: value })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {CASE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : caseItem.case_type ? (
                      <Badge variant="outline" className="text-xs">
                        {caseItem.case_type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Select
                        value={editValues.priority}
                        onValueChange={(value) => setEditValues({ ...editValues, priority: value })}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : caseItem.priority ? (
                      <Badge className={`text-xs ${priorityColors[caseItem.priority] || ""}`}>
                        {priorityLabels[caseItem.priority] || caseItem.priority}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Input
                        value={editValues.date_opened}
                        onChange={(e) => setEditValues({ ...editValues, date_opened: e.target.value })}
                        className="h-8 w-[120px]"
                        placeholder="dd/mm/aaaa"
                      />
                    ) : caseItem.date_opened ? (
                      <span className="text-sm">{formatDateToEU(caseItem.date_opened)}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Textarea
                        value={editValues.description}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="h-16 text-sm"
                        placeholder="Descrição"
                      />
                    ) : caseItem.description ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{caseItem.description}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 gap-1"
                      onClick={() => setNotesDialogCase(caseItem)}
                    >
                      <StickyNote className="h-4 w-4" />
                      {noteCounts[caseItem.id] > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs">
                          {noteCounts[caseItem.id]}
                        </Badge>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === caseItem.id ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={saveEdit}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEdit}>
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(caseItem)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(caseItem.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

        </TabsContent>

        <TabsContent value="settings">
          <FolderMappingSettings />
        </TabsContent>
      </Tabs>

      <CaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCases}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Caso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este caso? Esta ação não pode ser revertida.
              Os documentos associados também serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCase} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {notesDialogCase && (
        <LegalCaseNotesDialog
          open={!!notesDialogCase}
          onOpenChange={(open) => !open && setNotesDialogCase(null)}
          caseId={notesDialogCase.id}
          caseTitle={notesDialogCase.title}
        />
      )}
    </div>
  );
}
