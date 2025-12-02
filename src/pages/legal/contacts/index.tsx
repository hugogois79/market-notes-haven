import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ContactDialog } from "../components/ContactDialog";
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

interface LegalContact {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

const roles = [
  "Defendant",
  "Witness",
  "Defendant Witness",
  "Attorney",
  "Specialist",
  "D.O.J",
  "Other"
];

const roleColors: Record<string, string> = {
  "Defendant": "bg-red-100 text-red-800",
  "Witness": "bg-blue-100 text-blue-800",
  "Defendant Witness": "bg-purple-100 text-purple-800",
  "Attorney": "bg-green-100 text-green-800",
  "Specialist": "bg-orange-100 text-orange-800",
  "D.O.J": "bg-gray-800 text-white",
  "Other": "bg-gray-100 text-gray-800",
};

export default function LegalContactsPage() {
  const [contacts, setContacts] = useState<LegalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", role: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("legal_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast.error("Erro ao carregar contactos");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (contact: LegalContact) => {
    setEditingId(contact.id);
    setEditValues({ name: contact.name, role: contact.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", role: "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from("legal_contacts")
        .update({ name: editValues.name, role: editValues.role })
        .eq("id", editingId);

      if (error) throw error;
      toast.success("Contacto atualizado");
      fetchContacts();
      cancelEdit();
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast.error("Erro ao atualizar contacto");
    }
  };

  const deleteContact = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("legal_contacts")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Contacto eliminado");
      fetchContacts();
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error("Erro ao eliminar contacto");
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/legal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Gestão de Contactos</h1>
          <p className="text-muted-foreground">Consultar, editar e eliminar contactos ({contacts.length} total)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contacto
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum contacto encontrado.
        </div>
      ) : (
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Nome</TableHead>
                <TableHead className="w-[25%]">Papel</TableHead>
                <TableHead className="w-[15%]">Criado em</TableHead>
                <TableHead className="w-[10%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{contact.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Select
                        value={editValues.role}
                        onValueChange={(value) => setEditValues({ ...editValues, role: value })}
                      >
                        <SelectTrigger className="h-8 w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={roleColors[contact.role] || "bg-gray-100 text-gray-800"}>
                        {contact.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(contact.created_at).toLocaleDateString("pt-PT")}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === contact.id ? (
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
                        <Button variant="ghost" size="icon" onClick={() => startEdit(contact)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(contact.id)}>
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

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchContacts}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Contacto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este contacto? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteContact} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
