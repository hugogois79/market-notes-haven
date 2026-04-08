import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  UserPlus, Search, Star, Phone, Mail, MapPin, FileText, Calendar,
  Plus, Pencil, Trash2, ChevronRight, Clock, CheckCircle2, XCircle, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  status: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  rating: number | null;
  applied_date: string;
  interview_date: string | null;
  created_at: string;
}

const STATUSES = [
  { value: "applied", label: "Candidatura", color: "bg-blue-100 text-blue-700" },
  { value: "screening", label: "Triagem", color: "bg-purple-100 text-purple-700" },
  { value: "interview", label: "Entrevista", color: "bg-amber-100 text-amber-700" },
  { value: "offer", label: "Proposta", color: "bg-green-100 text-green-700" },
  { value: "hired", label: "Contratado", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Rejeitado", color: "bg-red-100 text-red-700" },
];

const DEPARTMENTS = [
  "Assistente Financeira", "Orçamentista", "Piloto", "Motorista",
  "Limpeza", "Nanny", "Marketing", "Segurança", "Outro"
];

const SOURCES = ["Website", "LinkedIn", "Referência", "Agência", "MyBabysitter", "OLX", "Outro"];

const statusIcon = (status: string) => {
  switch (status) {
    case "applied": return <FileText className="h-3.5 w-3.5" />;
    case "screening": return <Search className="h-3.5 w-3.5" />;
    case "interview": return <Calendar className="h-3.5 w-3.5" />;
    case "offer": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "hired": return <UserCheck className="h-3.5 w-3.5" />;
    case "rejected": return <XCircle className="h-3.5 w-3.5" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
};

export default function RecruitmentBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    full_name: "",
    position: "",
    department: "",
    status: "applied",
    email: "",
    phone: "",
    source: "",
    notes: "",
    rating: 0,
    applied_date: new Date().toISOString().split("T")[0],
    interview_date: "",
  });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["recruitment-candidates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("recruitment_candidates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }
      return data as Candidate[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("recruitment_candidates").insert({
        ...data,
        user_id: user?.id,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        notes: data.notes || null,
        rating: data.rating || null,
        interview_date: data.interview_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      toast.success("Candidato adicionado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adicionar candidato"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase
        .from("recruitment_candidates")
        .update({
          ...data,
          email: data.email || null,
          phone: data.phone || null,
          source: data.source || null,
          notes: data.notes || null,
          rating: data.rating || null,
          interview_date: data.interview_date || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      toast.success("Candidato atualizado");
      closeDialog();
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recruitment_candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      toast.success("Candidato removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setFormData({
      full_name: "", position: "", department: "", status: "applied",
      email: "", phone: "", source: "", notes: "", rating: 0,
      applied_date: new Date().toISOString().split("T")[0], interview_date: "",
    });
  };

  const openEdit = (c: Candidate) => {
    setEditing(c);
    setFormData({
      full_name: c.full_name, position: c.position, department: c.department,
      status: c.status, email: c.email || "", phone: c.phone || "",
      source: c.source || "", notes: c.notes || "", rating: c.rating || 0,
      applied_date: c.applied_date, interview_date: c.interview_date || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.full_name || !formData.department) {
      toast.error("Nome e departamento são obrigatórios");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const quickStatusChange = async (id: string, newStatus: string) => {
    await supabase.from("recruitment_candidates").update({ status: newStatus }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
    toast.success("Status atualizado");
  };

  const filtered = candidates.filter(c => {
    if (filterDept !== "all" && c.department !== filterDept) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      return c.full_name.toLowerCase().includes(sq) ||
        c.position?.toLowerCase().includes(sq) ||
        c.department?.toLowerCase().includes(sq) ||
        (c.email && c.email.toLowerCase().includes(sq));
    }
    return true;
  });

  // Group by status for Kanban view
  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s.value] = filtered.filter(c => c.status === s.value);
    return acc;
  }, {} as Record<string, Candidate[]>);

  // Stats
  const totalActive = candidates.filter(c => !["rejected", "hired"].includes(c.status)).length;

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">A carregar...</div>;
  }

  // If table doesn't exist yet, show setup message
  if (candidates.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Recrutamento</h2>
            <p className="text-muted-foreground">Gestão de candidatos e processos de recrutamento</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Candidato
          </Button>
        </div>

        <div className="text-center py-16 border border-dashed rounded-lg">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Sem candidatos</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Adicione o primeiro candidato para começar a gerir o recrutamento.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Candidato
          </Button>
        </div>

        <CandidateDialog
          open={dialogOpen}
          onClose={closeDialog}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isEditing={!!editing}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recrutamento</h2>
          <p className="text-muted-foreground text-sm">
            {totalActive} candidato{totalActive !== 1 ? 's' : ''} em processo | {candidates.length} total
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Candidato
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar candidatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Departamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os departamentos</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUSES.map(status => (
          <div key={status.value} className="space-y-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${status.color}`}>
              {statusIcon(status.value)}
              <span>{status.label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] bg-white/50">
                {byStatus[status.value]?.length || 0}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {(byStatus[status.value] || []).map(candidate => (
                <Card
                  key={candidate.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openEdit(candidate)}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <p className="font-medium text-sm">{candidate.full_name}</p>
                    <p className="text-xs text-muted-foreground">{candidate.position || candidate.department}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{candidate.department}</Badge>
                      {candidate.rating && candidate.rating > 0 && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: candidate.rating }).map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    {candidate.interview_date && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(new Date(candidate.interview_date), "dd MMM yyyy", { locale: pt })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <CandidateDialog
        open={dialogOpen}
        onClose={closeDialog}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isEditing={!!editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onDelete={editing ? () => {
          if (confirm("Eliminar este candidato?")) {
            deleteMutation.mutate(editing.id);
            closeDialog();
          }
        } : undefined}
      />
    </div>
  );
}

function CandidateDialog({ open, onClose, formData, setFormData, onSubmit, isEditing, isPending, onDelete }: {
  open: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (fn: any) => void;
  onSubmit: () => void;
  isEditing: boolean;
  isPending: boolean;
  onDelete?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Candidato" : "Novo Candidato"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={formData.full_name} onChange={e => setFormData((p: any) => ({ ...p, full_name: e.target.value }))} placeholder="Nome do candidato" />
            </div>
            <div>
              <Label>Departamento *</Label>
              <Select value={formData.department} onValueChange={v => setFormData((p: any) => ({ ...p, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posição</Label>
              <Input value={formData.position} onChange={e => setFormData((p: any) => ({ ...p, position: e.target.value }))} placeholder="Ex: Assistente, Sénior..." />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={v => setFormData((p: any) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={formData.source} onValueChange={v => setFormData((p: any) => ({ ...p, source: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData((p: any) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={formData.phone} onChange={e => setFormData((p: any) => ({ ...p, phone: e.target.value }))} placeholder="+351 ..." />
            </div>
            <div>
              <Label>Data Candidatura</Label>
              <Input type="date" value={formData.applied_date} onChange={e => setFormData((p: any) => ({ ...p, applied_date: e.target.value }))} />
            </div>
            <div>
              <Label>Data Entrevista</Label>
              <Input type="date" value={formData.interview_date} onChange={e => setFormData((p: any) => ({ ...p, interview_date: e.target.value }))} />
            </div>
            <div>
              <Label>Avaliação (1-5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData((p: any) => ({ ...p, rating: p.rating === n ? 0 : n }))}
                    className="p-1"
                  >
                    <Star className={`h-5 w-5 ${n <= (formData.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={formData.notes} onChange={e => setFormData((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Observações sobre o candidato..." rows={3} />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>{onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </Button>
          )}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending ? "A guardar..." : isEditing ? "Guardar" : "Adicionar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
