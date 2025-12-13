import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const PERIODS = [
  { value: "morning", label: "Manhã", icon: Sun },
  { value: "afternoon", label: "Tarde", icon: Moon },
];

interface CalendarEvent {
  id: string;
  date: string;
  title: string | null;
  category: string | null;
  notes: string | null;
  user_id: string | null;
  period: string | null;
}

interface MonthInfo {
  month: number;
  year: number;
  label: string;
}

interface EditingCell {
  day: number;
  month: number;
  year: number;
  period: string;
}

export default function YearCalendar() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFullYear, setShowFullYear] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("morning");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent>>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Focus input when editing cell changes
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Calculate visible months based on toggle
  const visibleMonths = useMemo((): MonthInfo[] => {
    if (showFullYear) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        year: selectedYear,
        label: MONTHS[i],
      }));
    } else {
      const today = new Date();
      const months: MonthInfo[] = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        months.push({
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          label: `${MONTHS[date.getMonth()]} ${date.getFullYear() !== today.getFullYear() ? date.getFullYear() : ''}`.trim(),
        });
      }
      return months;
    }
  }, [showFullYear, selectedYear]);

  // Calculate date range for query
  const dateRange = useMemo(() => {
    if (showFullYear) {
      return {
        start: `${selectedYear}-01-01`,
        end: `${selectedYear}-12-31`,
      };
    } else {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 6, 0);
      return {
        start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`,
        end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
      };
    }
  }, [showFullYear, selectedYear]);

  const { data: events } = useQuery({
    queryKey: ["calendar-events", dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end);
      
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
            period: event.period,
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
            period: event.period || 'morning',
            user_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
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

  const isValidDateForMonth = (day: number, month: number, year: number) => {
    return day <= getDaysInMonth(month, year);
  };

  const getEventForDate = (day: number, month: number, year: number, period?: string) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (period) {
      return events?.find(e => e.date === dateStr && e.period === period);
    }
    return events?.find(e => e.date === dateStr);
  };

  const getCategoryStyle = (category: string | null) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat || { bgClass: "", textClass: "text-foreground" };
  };

  // Single click - start inline editing
  const handleCellClick = (day: number, monthInfo: MonthInfo, period: string = 'morning') => {
    if (!isValidDateForMonth(day, monthInfo.month, monthInfo.year)) return;
    
    const existingEvent = getEventForDate(day, monthInfo.month, monthInfo.year, period);
    setEditingCell({ day, month: monthInfo.month, year: monthInfo.year, period });
    setInlineValue(existingEvent?.title || "");
  };

  // Double click - open detailed sheet
  const handleCellDoubleClick = (day: number, monthInfo: MonthInfo, period: string = 'morning') => {
    if (!isValidDateForMonth(day, monthInfo.month, monthInfo.year)) return;
    
    setEditingCell(null);
    const dateStr = `${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingEvent = getEventForDate(day, monthInfo.month, monthInfo.year, period);
    
    setSelectedDate(dateStr);
    setSelectedPeriod(period);
    setEditingEvent(existingEvent || { date: dateStr, period });
    setIsSheetOpen(true);
  };

  // Save inline edit
  const handleInlineSave = () => {
    if (!editingCell) return;
    
    const { day, month, year, period } = editingCell;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingEvent = getEventForDate(day, month, year, period);
    
    if (inlineValue.trim() || existingEvent) {
      saveMutation.mutate({
        id: existingEvent?.id,
        date: dateStr,
        title: inlineValue.trim() || null,
        category: existingEvent?.category,
        notes: existingEvent?.notes,
        period,
      });
    }
    
    setEditingCell(null);
    setInlineValue("");
  };

  // Handle keyboard events in inline edit
  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInlineSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setInlineValue("");
    }
  };

  const handleSave = () => {
    if (!editingEvent.date) return;
    saveMutation.mutate(editingEvent);
    toast.success("Evento guardado");
    setIsSheetOpen(false);
    setEditingEvent({});
  };

  // In 6-month view, each month has 2 columns (morning/afternoon)
  const columnCount = showFullYear ? visibleMonths.length : visibleMonths.length * 2;

  // Check if cell is being edited
  const isEditing = (day: number, month: number, year: number, period: string) => {
    return editingCell?.day === day && 
           editingCell?.month === month && 
           editingCell?.year === year && 
           editingCell?.period === period;
  };

  // Render cell for full year view (single slot per day)
  const renderFullYearCell = (day: number, monthInfo: MonthInfo) => {
    const isValid = isValidDateForMonth(day, monthInfo.month, monthInfo.year);
    const event = isValid ? getEventForDate(day, monthInfo.month, monthInfo.year) : null;
    const style = getCategoryStyle(event?.category || null);
    const dayOfWeek = isValid ? getDayOfWeek(day, monthInfo.month, monthInfo.year) : "";
    const isWeekend = dayOfWeek === "S" || dayOfWeek === "D";
    const editing = isEditing(day, monthInfo.month, monthInfo.year, 'morning');

    return (
      <div
        key={`${day}-${monthInfo.month}-${monthInfo.year}`}
        className={`
          p-0.5 text-[9px] border-r border-border last:border-r-0 min-h-[24px] cursor-pointer
          transition-colors
          ${!isValid ? 'bg-muted/50' : isWeekend ? 'bg-muted/20' : ''}
          ${isValid && !event && !editing ? 'hover:bg-muted/40' : ''}
          ${event && !editing ? style.bgClass : ''}
        `}
        onClick={() => handleCellClick(day, monthInfo)}
        onDoubleClick={() => handleCellDoubleClick(day, monthInfo)}
      >
        {isValid && (
          <>
            {editing ? (
              <input
                ref={inputRef}
                type="text"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none"
                placeholder="Evento..."
              />
            ) : (
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
          </>
        )}
      </div>
    );
  };

  // Render cell for 6-month view (two slots per day: morning/afternoon)
  const renderSixMonthCell = (day: number, monthInfo: MonthInfo) => {
    const isValid = isValidDateForMonth(day, monthInfo.month, monthInfo.year);
    const morningEvent = isValid ? getEventForDate(day, monthInfo.month, monthInfo.year, 'morning') : null;
    const afternoonEvent = isValid ? getEventForDate(day, monthInfo.month, monthInfo.year, 'afternoon') : null;
    const morningStyle = getCategoryStyle(morningEvent?.category || null);
    const afternoonStyle = getCategoryStyle(afternoonEvent?.category || null);
    const isWeekend = isValid && (getDayOfWeek(day, monthInfo.month, monthInfo.year) === "S" || getDayOfWeek(day, monthInfo.month, monthInfo.year) === "D");
    const editingMorning = isEditing(day, monthInfo.month, monthInfo.year, 'morning');
    const editingAfternoon = isEditing(day, monthInfo.month, monthInfo.year, 'afternoon');

    return (
      <>
        {/* Morning slot */}
        <div
          key={`${day}-${monthInfo.month}-${monthInfo.year}-morning`}
          className={`
            border-r border-border/50 min-h-[22px] p-0.5 text-[9px] cursor-pointer transition-colors
            ${!isValid ? 'bg-muted/50' : isWeekend ? 'bg-muted/20' : ''}
            ${isValid && morningEvent && !editingMorning ? morningStyle.bgClass : isValid && !editingMorning ? 'hover:bg-muted/40' : ''}
          `}
          onClick={() => isValid && handleCellClick(day, monthInfo, 'morning')}
          onDoubleClick={() => isValid && handleCellDoubleClick(day, monthInfo, 'morning')}
          title="Manhã"
        >
          {isValid && (
            editingMorning ? (
              <input
                ref={inputRef}
                type="text"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none"
                placeholder="..."
              />
            ) : (
              <span 
                className={`truncate block ${morningEvent ? morningStyle.textClass : ''}`}
                title={morningEvent?.title || ''}
              >
                {morningEvent?.title || ''}
              </span>
            )
          )}
        </div>
        {/* Afternoon slot */}
        <div
          key={`${day}-${monthInfo.month}-${monthInfo.year}-afternoon`}
          className={`
            border-r border-border last:border-r-0 min-h-[22px] p-0.5 text-[9px] cursor-pointer transition-colors
            ${!isValid ? 'bg-muted/50' : isWeekend ? 'bg-muted/20' : ''}
            ${isValid && afternoonEvent && !editingAfternoon ? afternoonStyle.bgClass : isValid && !editingAfternoon ? 'hover:bg-muted/40' : ''}
          `}
          onClick={() => isValid && handleCellClick(day, monthInfo, 'afternoon')}
          onDoubleClick={() => isValid && handleCellDoubleClick(day, monthInfo, 'afternoon')}
          title="Tarde"
        >
          {isValid && (
            editingAfternoon ? (
              <input
                ref={inputRef}
                type="text"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none"
                placeholder="..."
              />
            ) : (
              <span 
                className={`truncate block ${afternoonEvent ? afternoonStyle.textClass : ''}`}
                title={afternoonEvent?.title || ''}
              >
                {afternoonEvent?.title || ''}
              </span>
            )
          )}
        </div>
      </>
    );
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">
              {showFullYear ? "Calendário Anual" : "Próximos 6 Meses"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="show-full-year" className="text-xs text-muted-foreground cursor-pointer">
                Mostrar Ano Completo
              </Label>
              <Switch
                id="show-full-year"
                checked={showFullYear}
                onCheckedChange={setShowFullYear}
              />
            </div>
          </div>
          {showFullYear && (
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
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Clique para editar • Duplo clique para detalhes
        </p>
      </CardHeader>
      <CardContent className="p-2 overflow-x-auto">
        <div className={showFullYear ? "min-w-[900px]" : "min-w-[700px]"}>
          {/* Grid Header */}
          <div 
            className="border-b border-border sticky top-0 bg-background z-10"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `40px repeat(${columnCount}, 1fr)` 
            }}
          >
            <div className="p-1 text-[10px] font-medium text-muted-foreground text-center border-r border-border">
              Dia
            </div>
            {showFullYear ? (
              visibleMonths.map((monthInfo) => (
                <div
                  key={`${monthInfo.month}-${monthInfo.year}`}
                  className="p-1 text-[10px] font-semibold text-center border-r border-border last:border-r-0"
                >
                  {monthInfo.label}
                </div>
              ))
            ) : (
              visibleMonths.map((monthInfo) => (
                <>
                  <div
                    key={`${monthInfo.month}-${monthInfo.year}-m`}
                    className="p-1 text-[10px] font-semibold text-center border-r border-border/50 flex items-center justify-center gap-1"
                  >
                    <Sun className="h-3 w-3" />
                    <span>{monthInfo.label}</span>
                  </div>
                  <div
                    key={`${monthInfo.month}-${monthInfo.year}-a`}
                    className="p-1 text-[10px] font-semibold text-center border-r border-border last:border-r-0 flex items-center justify-center gap-1"
                  >
                    <Moon className="h-3 w-3" />
                  </div>
                </>
              ))
            )}
          </div>

          {/* Grid Body */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div
              key={day}
              className="border-b border-border last:border-b-0"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `40px repeat(${columnCount}, 1fr)` 
              }}
            >
              {/* Day Number */}
              <div className={`p-1 text-[10px] font-medium text-muted-foreground text-center border-r border-border bg-muted/30 sticky left-0 ${showFullYear ? '' : 'flex items-center justify-center'}`}>
                {day}
              </div>

              {/* Day Cells for each month */}
              {visibleMonths.map((monthInfo) => 
                showFullYear 
                  ? renderFullYearCell(day, monthInfo)
                  : renderSixMonthCell(day, monthInfo)
              )}
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
          {!showFullYear && (
            <>
              <div className="w-px h-4 bg-border mx-2" />
              <div className="flex items-center gap-1">
                <Sun className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Manhã</span>
              </div>
              <div className="flex items-center gap-1">
                <Moon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Tarde</span>
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Event Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingEvent.id ? "Detalhes do Evento" : "Novo Evento"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Data</Label>
                <Input
                  value={selectedDate || ""}
                  disabled
                  className="mt-1"
                />
              </div>
              {!showFullYear && (
                <div className="w-32">
                  <Label>Período</Label>
                  <Select
                    value={editingEvent.period || selectedPeriod}
                    onValueChange={(value) => setEditingEvent(prev => ({ ...prev, period: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <p.icon className="h-3 w-3" />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
