import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.roles.length === 0) {
      toast.error("Preencha o nome e selecione pelo menos um papel");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("legal_contacts").insert({
        name: formData.name,
        role: formData.roles.join(", "),
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Contato criado com sucesso");
      onOpenChange(false);
      setFormData({ name: "", roles: [] });
      onSuccess();
    } catch (error: any) {
      console.error("Error creating contact:", error);
      toast.error("Erro ao criar contato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Nome *</Label>
            <Input
              id="contact-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Hugo Góis"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Papéis *</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
              {CONTACT_ROLES.map((role) => (
                <div
                  key={role}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                  onClick={() => toggleRole(role)}
                >
                  <Checkbox 
                    checked={formData.roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <span className="text-sm">{role}</span>
                </div>
              ))}
            </div>
            {formData.roles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selecionados: {formData.roles.join(", ")}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Contato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
