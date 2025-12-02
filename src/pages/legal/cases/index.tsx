import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { CaseDialog } from "../components/CaseDialog";
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
  status: string;
  created_at: string;
}

export default function LegalCasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ title: "", status: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    setEditValues({ title: caseItem.title, status: caseItem.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ title: "", status: "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from("legal_cases")
        .update({ title: editValues.title, status: editValues.status })
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

  const statusColors: Record<string, string> = {
    "Active": "bg-green-100 text-green-800",
    "Closed": "bg-gray-100 text-gray-800",
    "Pending": "bg-yellow-100 text-yellow-800",
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
          <p className="text-muted-foreground">Consultar, editar e eliminar casos jurídicos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Caso
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum caso encontrado.
        </div>
      ) : (
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Título</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="w-[20%]">Criado em</TableHead>
                <TableHead className="w-[10%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    {editingId === caseItem.id ? (
                      <Input
                        value={editValues.title}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{caseItem.title}</span>
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
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusColors[caseItem.status] || ""}>
                        {caseItem.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(caseItem.created_at).toLocaleDateString("pt-PT")}
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
    </div>
  );
}
