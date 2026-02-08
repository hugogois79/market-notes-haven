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
import { DailyCalendarEvent } from "@/hooks/useDailyCalendarEvents";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { parseISO } from "date-fns";
import { Clock } from "lucide-react";

// Generate time options in 15-minute intervals (24h format)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_OPTIONS = ["00", "15", "30", "45"];

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":");
  const hour = h || "09";
  const minute = m || "00";
  // Snap minute to nearest 15
  const snappedMinute = MINUTE_OPTIONS.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - parseInt(minute)) < Math.abs(parseInt(prev) - parseInt(minute)) ? curr : prev
  );

  return (
    <div className="flex items-center gap-1 border rounded-md px-2 py-1.5 bg-background">
      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${snappedMinute}`)}
        className="bg-transparent text-sm font-medium appearance-none cursor-pointer outline-none w-8 text-center"
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-sm font-medium">:</span>
      <select
        value={snappedMinute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className="bg-transparent text-sm font-medium appearance-none cursor-pointer outline-none w-8 text-center"
      >
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // yyyy-MM-dd
  categories: CalendarCategory[];
  defaultStartHour?: number;
  editEvent?: DailyCalendarEvent | null;
}

export default function CalendarEventDialog({
  open,
  onOpenChange,
  date,
  categories,
  defaultStartHour,
  editEvent,
}: CalendarEventDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { syncCreate, syncUpdate } = useGoogleCalendarSync();
  const isEditing = !!editEvent;

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Update start/end time when defaultStartHour changes (create mode)
  useEffect(() => {
    if (!editEvent && defaultStartHour !== undefined) {
      const h = Math.floor(defaultStartHour);
      const m = Math.round((defaultStartHour - h) * 60);
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endH = h + 1;
      const end = `${String(endH > 23 ? 23 : endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setStartTime(start);
      setEndTime(end);
    }
  }, [defaultStartHour, editEvent]);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (open) {
      if (editEvent) {
        setTitle(editEvent.title || "");
        setNotes(editEvent.notes || "");
        setCategory(editEvent.category || "");
        setAllDay(editEvent.all_day);
        if (editEvent.start_time) {
          const start = parseISO(editEvent.start_time);
          setStartTime(`${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`);
        } else {
          setStartTime("09:00");
        }
        if (editEvent.end_time) {
          const end = parseISO(editEvent.end_time);
          setEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
        } else {
          setEndTime("10:00");
        }
      } else {
        setTitle("");
        setNotes("");
        setCategory("");
        setAllDay(false);
        if (defaultStartHour === undefined) {
          setStartTime("09:00");
          setEndTime("10:00");
        }
      }
    }
  }, [open, defaultStartHour, editEvent]);

  const saveEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Utilizador não autenticado");
      if (!title.trim()) throw new Error("O título é obrigatório");

      const startTimestamp = allDay ? null : `${date}T${startTime}:00`;
      const endTimestamp = allDay ? null : `${date}T${endTime}:00`;

      if (isEditing) {
        const { error } = await supabase
          .from("calendar_events")
          .update({
            title: title.trim(),
            start_time: startTimestamp,
            end_time: endTimestamp,
            all_day: allDay,
            category: category || null,
            notes: notes.trim() || null,
          })
          .eq("id", editEvent!.id);
        if (error) throw error;

        // Sync to Google Calendar (fire-and-forget)
        syncUpdate(
          editEvent!.id,
          editEvent!.google_event_id || null,
          title.trim(),
          date,
          notes.trim() || null,
          startTimestamp,
          endTimestamp
        );
      } else {
        const { data: inserted, error } = await supabase.from("calendar_events").insert({
          title: title.trim(),
          date,
          start_time: startTimestamp,
          end_time: endTimestamp,
          all_day: allDay,
          category: category || null,
          notes: notes.trim() || null,
          user_id: user.id,
          source: "local",
        }).select("id").single();
        if (error) throw error;

        // Sync to Google Calendar (fire-and-forget)
        if (inserted) {
          syncCreate(inserted.id, title.trim(), date, notes.trim() || null, startTimestamp, endTimestamp);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success(isEditing ? "Evento actualizado" : "Evento criado");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || (isEditing ? "Erro ao actualizar evento" : "Erro ao criar evento"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEvent.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
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
                <Label>Início</Label>
                <TimeSelect value={startTime} onChange={setStartTime} />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <TimeSelect value={endTime} onChange={setEndTime} />
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
            <Button type="submit" disabled={saveEvent.isPending || !title.trim()}>
              {saveEvent.isPending
                ? (isEditing ? "A guardar..." : "A criar...")
                : (isEditing ? "Guardar" : "Criar Evento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
