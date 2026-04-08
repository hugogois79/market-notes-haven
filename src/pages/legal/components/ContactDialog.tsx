import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LegalCase {
  id: string;
  title: string;
}

const CONTACT_ROLES = ["Defendant", "Witness", "Defendant Witness", "Attorney", "Specialist", "D.O.J", "Other"];

export function ContactDialog({ open, onOpenChange, onSuccess }: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchCases();
    }
  }, [open]);

  const fetchCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("legal_cases")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const toggleCase = (caseId: string) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId) 
        : [...prev, caseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Preencha o nome do contacto");
      return;
    }
    
    if (selectedRoles.length === 0) {
      toast.error("Selecione pelo menos um papel");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data: contactData, error: contactError } = await supabase
        .from("legal_contacts")
        .insert({
          name: name.trim(),
          role: selectedRoles.join(", "),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (contactError) {
        console.error("Supabase error:", contactError);
        toast.error("Erro ao criar contacto: " + contactError.message);
        return;
      }

      // Insert case associations
      if (selectedCases.length > 0 && contactData) {
        const caseAssociations = selectedCases.map(caseId => ({
          contact_id: contactData.id,
          case_id: caseId,
        }));

        const { error: assocError } = await supabase
          .from("legal_contact_cases")
          .insert(caseAssociations);

        if (assocError) {
          console.error("Error associating cases:", assocError);
        }
      }

      toast.success("Contacto criado com sucesso");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast.error("Erro ao criar contacto");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedRoles([]);
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setSelectedCases([]);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contacto</DialogTitle>
          <DialogDescription>Adicione um novo contacto ao sistema legal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nome *</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Hugo Góis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +351 912 345 678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-address">Morada</Label>
              <Input
                id="contact-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Papéis * ({selectedRoles.length} selecionado{selectedRoles.length !== 1 ? 's' : ''})</Label>
            <div className="flex flex-wrap gap-2">
              {CONTACT_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <Badge
                    key={role}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary' : 'hover:bg-accent'}`}
                    onClick={() => toggleRole(role)}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {role}
                  </Badge>
                );
              })}
            </div>
            {selectedRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selecionados: {selectedRoles.join(", ")}
              </p>
            )}
          </div>

          {cases.length > 0 && (
            <div className="space-y-2">
              <Label>Casos ({selectedCases.length} selecionado{selectedCases.length !== 1 ? 's' : ''})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {cases.map((caseItem) => {
                  const isSelected = selectedCases.includes(caseItem.id);
                  return (
                    <Badge
                      key={caseItem.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary' : 'hover:bg-accent'}`}
                      onClick={() => toggleCase(caseItem.id)}
                    >
                      {isSelected && <Check className="w-3 h-3 mr-1" />}
                      {caseItem.title}
                    </Badge>
                  );
                })}
              </div>
              {selectedCases.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Casos: {cases.filter(c => selectedCases.includes(c.id)).map(c => c.title).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contact-notes">Notas</Label>
            <Textarea
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o contacto..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Contacto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}