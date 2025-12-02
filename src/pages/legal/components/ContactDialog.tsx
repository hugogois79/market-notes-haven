import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
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

      const { error } = await supabase.from("legal_contacts").insert({
        name: name.trim(),
        role: selectedRoles.join(", "),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        user_id: user.id,
      });

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Erro ao criar contacto: " + error.message);
        return;
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
