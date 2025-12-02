import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
  { value: "Awaiting", label: "A aguardar resposta" },
  { value: "Closed", label: "Fechado" }
];

export function CaseDialog({ open, onOpenChange, onSuccess }: CaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    case_number: "",
    status: "Active",
    case_type: "",
    priority: "medium",
    description: "",
    date_opened: undefined as Date | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Digite o nome do caso");
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("legal_cases").insert({
        title: formData.title,
        case_number: formData.case_number || null,
        status: formData.status,
        case_type: formData.case_type || null,
        priority: formData.priority,
        description: formData.description || null,
        date_opened: formData.date_opened ? format(formData.date_opened, "yyyy-MM-dd") : null,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Caso criado com sucesso");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating case:", error);
      toast.error("Erro ao criar caso");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      case_number: "",
      status: "Active",
      case_type: "",
      priority: "medium",
      description: "",
      date_opened: undefined,
    });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Caso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="case-title">Nome do Caso *</Label>
              <Input
                id="case-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Processo vs João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-number">Nº do Processo</Label>
              <Input
                id="case-number"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                placeholder="Ex: 18-CR-20685-KMW"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Abertura</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_opened && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_opened ? (
                      format(formData.date_opened, "dd/MM/yyyy", { locale: pt })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_opened}
                    onSelect={(date) => setFormData({ ...formData, date_opened: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="case-type">Tipo de Caso</Label>
              <Select
                value={formData.case_type}
                onValueChange={(value) => setFormData({ ...formData, case_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do caso..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Caso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
