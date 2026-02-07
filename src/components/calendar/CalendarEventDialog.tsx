import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCategory } from "@/hooks/useCalendarCategories";

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // yyyy-MM-dd
  categories: CalendarCategory[];
  defaultStartHour?: number;
}

export default function CalendarEventDialog({
  open,
  onOpenChange,
  date,
  categories,
  defaultStartHour,
}: CalendarEventDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Update start/end time when defaultStartHour changes
  useEffect(() => {
    if (defaultStartHour !== undefined) {
      const h = Math.floor(defaultStartHour);
      const m = Math.round((defaultStartHour - h) * 60);
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endH = h + 1;
      const end = `${String(endH > 23 ? 23 : endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setStartTime(start);
      setEndTime(end);
    }
  }, [defaultStartHour]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setNotes("");
      setCategory("");
      setAllDay(false);
      if (defaultStartHour === undefined) {
        setStartTime("09:00");
        setEndTime("10:00");
      }
    }
  }, [open, defaultStartHour]);

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Utilizador não autenticado");
      if (!title.trim()) throw new Error("O título é obrigatório");

      const startTimestamp = allDay ? null : `${date}T${startTime}:00`;
      const endTimestamp = allDay ? null : `${date}T${endTime}:00`;

      const { error } = await supabase.from("calendar_events").insert({
        title: title.trim(),
        date,
        start_time: startTimestamp,
        end_time: endTimestamp,
        all_day: allDay,
        category: category || null,
        notes: notes.trim() || null,
        user_id: user.id,
        source: "local",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-calendar-events"] });
      toast.success("Evento criado");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar evento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Novo Evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="event-allday" className="text-sm">
              Dia inteiro
            </Label>
            <input
              id="event-allday"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(date + "T12:00:00"), "d MMM yyyy")}
            </span>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-start">Início</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">Fim</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-notes">Notas</Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createEvent.isPending || !title.trim()}>
              {createEvent.isPending ? "A criar..." : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
