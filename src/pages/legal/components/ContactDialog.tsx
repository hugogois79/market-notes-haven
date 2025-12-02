import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CONTACT_ROLES = ["Defendant", "Witness", "Defendant Witness", "Attorney", "Specialist", "D.O.J", "Other"];

export function ContactDialog({ open, onOpenChange, onSuccess }: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    roles: [] as string[],
  });

  const toggleRole = (role: string) => {
    setFormData(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: newRoles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Preencha o nome do contacto");
      return;
    }
    
    if (formData.roles.length === 0) {
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
        name: formData.name.trim(),
        role: formData.roles.join(", "),
        user_id: user.id,
      });

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Erro ao criar contacto: " + error.message);
        return;
      }

      toast.success("Contacto criado com sucesso");
      setFormData({ name: "", roles: [] });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast.error("Erro ao criar contacto");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setFormData({ name: "", roles: [] });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Contacto</DialogTitle>
          <DialogDescription>Adicione um novo contacto ao sistema legal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Nome *</Label>
            <Input
              id="contact-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Hugo Góis"
            />
          </div>

          <div className="space-y-2">
            <Label>Papéis * ({formData.roles.length} selecionado{formData.roles.length !== 1 ? 's' : ''})</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-background">
              {CONTACT_ROLES.map((role) => {
                const isChecked = formData.roles.includes(role);
                return (
                  <div
                    key={role}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary/10' : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleRole(role)}
                  >
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={() => toggleRole(role)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm select-none">{role}</span>
                  </div>
                );
              })}
            </div>
            {formData.roles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selecionados: {formData.roles.join(", ")}
              </p>
            )}
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
