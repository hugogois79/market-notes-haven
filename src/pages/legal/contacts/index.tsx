import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Search, Phone, Mail, MapPin, Briefcase, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ContactDialog } from "../components/ContactDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
}

interface LegalContact {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  cases: LegalCase[];
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

const parseRoles = (roleStr: string): string[] => {
  if (!roleStr) return [];
  return roleStr.split(",").map(r => r.trim()).filter(Boolean);
};

const rolesToString = (rolesArr: string[]): string => {
  return rolesArr.join(", ");
};

export default function LegalContactsPage() {
  const [contacts, setContacts] = useState<LegalContact[]>([]);
  const [allCases, setAllCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ 
    name: "", 
    roles: [] as string[],
    phone: "",
    email: "",
    address: "",
    notes: "",
    caseIds: [] as string[]
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCase, setFilterCase] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    fetchContacts();
    fetchAllCases();
  }, []);

  const fetchAllCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("legal_cases")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");

      if (error) throw error;
      setAllCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("legal_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (contactsError) throw contactsError;

      // Fetch contact-case relationships from junction table
      const { data: contactCasesData, error: contactCasesError } = await supabase
        .from("legal_contact_cases")
        .select(`
          contact_id,
          legal_cases!inner(id, title)
        `);

      if (contactCasesError) throw contactCasesError;

      // Build a map of contact_id -> cases
      const contactCasesMap: Record<string, LegalCase[]> = {};
      contactCasesData?.forEach((item: any) => {
        if (item.contact_id && item.legal_cases) {
          if (!contactCasesMap[item.contact_id]) {
            contactCasesMap[item.contact_id] = [];
          }
          contactCasesMap[item.contact_id].push({
            id: item.legal_cases.id,
            title: item.legal_cases.title
          });
        }
      });

      // Merge contacts with their cases
      const contactsWithCases: LegalContact[] = (contactsData || []).map(contact => ({
        ...contact,
        cases: contactCasesMap[contact.id] || []
      }));

      setContacts(contactsWithCases);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast.error("Erro ao carregar contactos");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (contact: LegalContact) => {
    setEditingId(contact.id);
    setEditValues({ 
      name: contact.name, 
      roles: parseRoles(contact.role),
      phone: contact.phone || "",
      email: contact.email || "",
      address: contact.address || "",
      notes: contact.notes || "",
      caseIds: contact.cases.map(c => c.id)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: "", roles: [], phone: "", email: "", address: "", notes: "", caseIds: [] });
  };

  const toggleRole = (role: string, checked: boolean) => {
    setEditValues(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const toggleCase = (caseId: string, checked: boolean) => {
    setEditValues(prev => ({
      ...prev,
      caseIds: checked
        ? [...prev.caseIds, caseId]
        : prev.caseIds.filter(id => id !== caseId)
    }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      // Update contact details
      const { error } = await supabase
        .from("legal_contacts")
        .update({ 
          name: editValues.name, 
          role: rolesToString(editValues.roles),
          phone: editValues.phone || null,
          email: editValues.email || null,
          address: editValues.address || null,
          notes: editValues.notes || null
        })
        .eq("id", editingId);

      if (error) throw error;

      // Update contact-case relationships
      // First, delete all existing relationships for this contact
      await supabase
        .from("legal_contact_cases")
        .delete()
        .eq("contact_id", editingId);

      // Then, insert new relationships
      if (editValues.caseIds.length > 0) {
        const relationships = editValues.caseIds.map(caseId => ({
          contact_id: editingId,
          case_id: caseId
        }));
        
        const { error: insertError } = await supabase
          .from("legal_contact_cases")
          .insert(relationships);
        
        if (insertError) throw insertError;
      }

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

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCase = filterCase === "all" || 
      contact.cases.some(c => c.id === filterCase);
    
    const matchesRole = filterRole === "all" || 
      parseRoles(contact.role).includes(filterRole);
    
    return matchesSearch && matchesCase && matchesRole;
  });

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

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Select value={filterCase} onValueChange={setFilterCase}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os Processos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Processos</SelectItem>
            {allCases.map((caseItem) => (
              <SelectItem key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos os Papéis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Papéis</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum contacto encontrado.
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Nome</TableHead>
                <TableHead className="min-w-[140px]">Papel</TableHead>
                <TableHead className="min-w-[150px]">Processos</TableHead>
                <TableHead className="min-w-[130px]">Telefone</TableHead>
                <TableHead className="min-w-[180px]">Email</TableHead>
                <TableHead className="min-w-[200px]">Morada</TableHead>
                <TableHead className="min-w-[150px]">Notas</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-8 justify-start min-w-[120px] text-xs">
                            {editValues.roles.length === 0 
                              ? "Selecionar..." 
                              : `${editValues.roles.length} selecionado(s)`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2 bg-popover" align="start">
                          <div className="space-y-1">
                            {roles.map((role) => (
                              <label
                                key={role}
                                className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                              >
                                <Checkbox 
                                  checked={editValues.roles.includes(role)}
                                  onCheckedChange={(checked) => toggleRole(role, checked as boolean)}
                                />
                                <span className="text-sm">{role}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {parseRoles(contact.role).map((role, idx) => (
                          <Badge key={idx} className={`text-xs ${roleColors[role] || "bg-gray-100 text-gray-800"}`}>
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-8 justify-start min-w-[120px] text-xs">
                            {editValues.caseIds.length === 0 
                              ? "Selecionar..." 
                              : `${editValues.caseIds.length} processo(s)`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2 bg-popover" align="start">
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {allCases.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">Nenhum processo disponível</p>
                            ) : (
                              allCases.map((legalCase) => (
                                <label
                                  key={legalCase.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                                >
                                  <Checkbox 
                                    checked={editValues.caseIds.includes(legalCase.id)}
                                    onCheckedChange={(checked) => toggleCase(legalCase.id, checked as boolean)}
                                  />
                                  <span className="text-sm">{legalCase.title}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : contact.cases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {contact.cases.map((legalCase) => (
                          <Link key={legalCase.id} to="/legal">
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {legalCase.title}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Input
                        value={editValues.phone}
                        onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                        className="h-8"
                        placeholder="Telefone"
                      />
                    ) : contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Input
                        value={editValues.email}
                        onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                        className="h-8"
                        placeholder="Email"
                        type="email"
                      />
                    ) : contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Input
                        value={editValues.address}
                        onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                        className="h-8"
                        placeholder="Morada"
                      />
                    ) : contact.address ? (
                      <span className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="line-clamp-1">{contact.address}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === contact.id ? (
                      <Textarea
                        value={editValues.notes}
                        onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                        className="h-16 text-sm"
                        placeholder="Notas"
                      />
                    ) : contact.notes ? (
                      <span className="text-sm text-muted-foreground line-clamp-2">{contact.notes}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
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
