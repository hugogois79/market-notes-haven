import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const DAYS_OF_WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

const CATEGORIES = [
  { value: "legal", label: "Legal", bgClass: "bg-red-500", textClass: "text-white" },
  { value: "family", label: "Família", bgClass: "bg-green-100", textClass: "text-green-900" },
  { value: "holidays", label: "Férias", bgClass: "bg-yellow-300", textClass: "text-yellow-900" },
  { value: "finance", label: "Finanças", bgClass: "bg-blue-200", textClass: "text-blue-900" },
  { value: "health", label: "Saúde", bgClass: "bg-purple-100", textClass: "text-purple-900" },
  { value: "work", label: "Trabalho", bgClass: "bg-orange-200", textClass: "text-orange-900" },
  { value: "personal", label: "Pessoal", bgClass: "bg-pink-100", textClass: "text-pink-900" },
];

interface CalendarEvent {
  id: string;
  date: string;
  title: string | null;
  category: string | null;
  notes: string | null;
  user_id: string | null;
}

export default function YearCalendar() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent>>({});
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ["calendar-events", selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (event.id) {
        const { error } = await supabase
          .from("calendar_events")
          .update({
            title: event.title,
            category: event.category,
            notes: event.notes,
          })
          .eq("id", event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendar_events")
          .insert({
            date: event.date,
            title: event.title,
            category: event.category,
            notes: event.notes,
            user_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento guardado");
      setIsSheetOpen(false);
      setEditingEvent({});
    },
    onError: () => {
      toast.error("Erro ao guardar evento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento eliminado");
      setIsSheetOpen(false);
      setEditingEvent({});
    },
    onError: () => {
      toast.error("Erro ao eliminar evento");
    },
  });

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getDayOfWeek = (day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    return DAYS_OF_WEEK[date.getDay()];
  };

  const isValidDate = (day: number, month: number) => {
    return day <= getDaysInMonth(month, selectedYear);
  };

  const getEventForDate = (day: number, month: number) => {
    const dateStr = `${selectedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events?.find(e => e.date === dateStr);
  };

  const getCategoryStyle = (category: string | null) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat || { bgClass: "", textClass: "text-foreground" };
  };

  const handleCellClick = (day: number, month: number) => {
    if (!isValidDate(day, month)) return;
    
    const dateStr = `${selectedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingEvent = getEventForDate(day, month);
    
    setSelectedDate(dateStr);
    setEditingEvent(existingEvent || { date: dateStr });
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    if (!editingEvent.date) return;
    saveMutation.mutate(editingEvent);
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Calendário Anual</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[50px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Grid Header */}
          <div className="grid grid-cols-[40px_repeat(12,1fr)] border-b border-border sticky top-0 bg-background z-10">
            <div className="p-1 text-[10px] font-medium text-muted-foreground text-center border-r border-border">
              Dia
            </div>
            {MONTHS.map((month, idx) => (
              <div
                key={month}
                className="p-1 text-[10px] font-semibold text-center border-r border-border last:border-r-0"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div
              key={day}
              className="grid grid-cols-[40px_repeat(12,1fr)] border-b border-border last:border-b-0"
            >
              {/* Day Number */}
              <div className="p-1 text-[10px] font-medium text-muted-foreground text-center border-r border-border bg-muted/30 sticky left-0">
                {day}
              </div>

              {/* Day Cells for each month */}
              {Array.from({ length: 12 }, (_, monthIdx) => monthIdx + 1).map(month => {
                const isValid = isValidDate(day, month);
                const event = isValid ? getEventForDate(day, month) : null;
                const style = getCategoryStyle(event?.category || null);
                const dayOfWeek = isValid ? getDayOfWeek(day, month, selectedYear) : "";
                const isWeekend = dayOfWeek === "S" || dayOfWeek === "D";

                return (
                  <div
                    key={`${day}-${month}`}
                    className={`
                      p-0.5 text-[9px] border-r border-border last:border-r-0 min-h-[24px] cursor-pointer
                      transition-colors
                      ${!isValid ? 'bg-muted/50' : isWeekend ? 'bg-muted/20' : ''}
                      ${isValid && !event ? 'hover:bg-muted/40' : ''}
                      ${event ? style.bgClass : ''}
                    `}
                    onClick={() => handleCellClick(day, month)}
                  >
                    {isValid && (
                      <div className="flex items-start gap-0.5">
                        <span className={`text-[8px] text-muted-foreground ${event ? style.textClass : ''}`}>
                          {dayOfWeek}
                        </span>
                        {event?.title && (
                          <span 
                            className={`truncate flex-1 ${style.textClass}`}
                            title={event.title}
                          >
                            {event.title}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
          {CATEGORIES.map(cat => (
            <div key={cat.value} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${cat.bgClass}`} />
              <span className="text-[10px] text-muted-foreground">{cat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Event Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingEvent.id ? "Editar Evento" : "Novo Evento"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label>Data</Label>
              <Input
                value={selectedDate || ""}
                disabled
                className="mt-1"
              />
            </div>

            <div>
              <Label>Título</Label>
              <Input
                value={editingEvent.title || ""}
                onChange={(e) => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do evento"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={editingEvent.category || ""}
                onValueChange={(value) => setEditingEvent(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${cat.bgClass}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={editingEvent.notes || ""}
                onChange={(e) => setEditingEvent(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Guardar
              </Button>
              {editingEvent.id && (
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(editingEvent.id!)}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}