import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, MoreHorizontal, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import CalendarSettingsSheet, { CalendarCategory, loadCalendarCategories } from "./CalendarSettingsSheet";
import EventAutocomplete, { EventAutocompleteRef } from "./EventAutocomplete";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const DAYS_OF_WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

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
  const [showFullYear, setShowFullYear] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("morning");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent>>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [categories, setCategories] = useState<CalendarCategory[]>(loadCalendarCategories);
  const inputRef = useRef<EventAutocompleteRef>(null);
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

  // Fetch all unique event titles for autocomplete suggestions
  const { data: eventSuggestions } = useQuery({
    queryKey: ["calendar-event-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("title")
        .not("title", "is", null);
      
      if (error) throw error;
      // Get unique non-empty titles
      const titles = data?.map(e => e.title).filter(Boolean) as string[];
      return [...new Set(titles)].sort();
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

  const isWeekendDay = (day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    const dayIndex = date.getDay();
    return dayIndex === 0 || dayIndex === 6; // Sunday (0) or Saturday (6)
  };

  const isWednesday = (day: number, month: number, year: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 3; // Wednesday
  };

  const isValidDateForMonth = (day: number, month: number, year: number) => {
    return day <= getDaysInMonth(month, year);
  };

  const isPastDate = (day: number, month: number, year: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(year, month - 1, day);
    return cellDate < today;
  };

  const getEventForDate = (day: number, month: number, year: number, period?: string) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (period) {
      return events?.find(e => e.date === dateStr && e.period === period);
    }
    return events?.find(e => e.date === dateStr);
  };

  // Get all events for a date (both morning and afternoon) - for full year view
  const getAllEventsForDate = (day: number, month: number, year: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events?.filter(e => e.date === dateStr) || [];
  };

  const getCategoryStyle = (category: string | null): { bgColor: string; textColor: string } => {
    const cat = categories.find(c => c.value === category);
    if (!cat) return { bgColor: "", textColor: "" };
    
    // Map preset colors to text colors
    const lightBgColors = ["#dcfce7", "#fde047", "#bfdbfe", "#f3e8ff", "#fed7aa", "#fce7f3", "#fecaca", "#fef08a", "#bbf7d0", "#ddd6fe", "#fbcfe8", "#e5e7eb"];
    const isLightBg = lightBgColors.includes(cat.color);
    const textColor = isLightBg ? "#1f2937" : "#ffffff";
    
    return { bgColor: cat.color, textColor };
  };

  // Background color for past dates - neutral light gray
  const PAST_DATE_BG = "#f1f5f9";

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
    
    // If text is empty and event exists, delete it
    if (!inlineValue.trim() && existingEvent?.id) {
      deleteMutation.mutate(existingEvent.id);
    } else if (inlineValue.trim()) {
      // Only save if there's text
      saveMutation.mutate({
        id: existingEvent?.id,
        date: dateStr,
        title: inlineValue.trim(),
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
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // If there's an existing event, delete it completely
      if (editingCell) {
        const { day, month, year, period } = editingCell;
        const existingEvent = getEventForDate(day, month, year, period);
        if (existingEvent?.id) {
          deleteMutation.mutate(existingEvent.id);
          setEditingCell(null);
          setInlineValue("");
          e.preventDefault();
        }
      }
    }
  };

  const handleSave = () => {
    if (!editingEvent.date) return;
    saveMutation.mutate(editingEvent);
    toast.success("Evento guardado");
    setIsSheetOpen(false);
    setEditingEvent({});
  };

  // In 6-month view, each month has 4 columns: B (with day letter), morning, afternoon, D
  const columnCount = showFullYear ? visibleMonths.length : visibleMonths.length * 4;
  
  // Grid template for 6-month view: narrow columns for B/D, wider for events
  const sixMonthGridTemplate = showFullYear 
    ? `40px repeat(${visibleMonths.length}, 1fr)`
    : `40px ${visibleMonths.map(() => '20px 1fr 1fr 20px').join(' ')}`;

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
    const allEvents = isValid ? getAllEventsForDate(day, monthInfo.month, monthInfo.year) : [];
    const hasEvents = allEvents.length > 0;
    
    // Use the first event's category for background color, or combine titles
    const primaryEvent = allEvents[0];
    const style = getCategoryStyle(primaryEvent?.category || null);
    const combinedTitle = allEvents.map(e => e.title).filter(Boolean).join(' / ');
    
    const dayOfWeek = isValid ? getDayOfWeek(day, monthInfo.month, monthInfo.year) : "";
    const isWeekend = isValid && isWeekendDay(day, monthInfo.month, monthInfo.year);
    const editing = isEditing(day, monthInfo.month, monthInfo.year, 'morning');

    return (
      <div
        key={`${day}-${monthInfo.month}-${monthInfo.year}`}
        className={`
          p-0.5 text-[9px] border-r border-border last:border-r-0 min-h-[24px] cursor-pointer
          transition-colors
          ${!isValid ? 'bg-muted/50' : isWeekend ? 'bg-muted/20' : ''}
          ${isValid && !hasEvents && !editing ? 'hover:bg-muted/40' : ''}
        `}
        style={hasEvents && !editing && style.bgColor ? { backgroundColor: style.bgColor } : undefined}
        onClick={() => handleCellClick(day, monthInfo)}
        onDoubleClick={() => handleCellDoubleClick(day, monthInfo)}
      >
        {isValid && (
          <>
            {editing ? (
              <EventAutocomplete
                ref={inputRef}
                value={inlineValue}
                onChange={setInlineValue}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                suggestions={eventSuggestions || []}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none"
                placeholder="Evento..."
              />
            ) : (
              <div className="flex items-start gap-0.5">
                <span 
                  className="text-[8px]"
                  style={hasEvents && style.textColor ? { color: style.textColor } : undefined}
                >
                  {dayOfWeek}
                </span>
                {combinedTitle && (
                  <span 
                    className="truncate flex-1"
                    style={style.textColor ? { color: style.textColor } : undefined}
                    title={combinedTitle}
                  >
                    {combinedTitle}
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
    const dayOfWeek = isValid ? getDayOfWeek(day, monthInfo.month, monthInfo.year) : "";
    const isWeekend = isValid && isWeekendDay(day, monthInfo.month, monthInfo.year);
    const editingMorning = isEditing(day, monthInfo.month, monthInfo.year, 'morning');
    const editingAfternoon = isEditing(day, monthInfo.month, monthInfo.year, 'afternoon');
    const isPast = isValid && isPastDate(day, monthInfo.month, monthInfo.year);

    // Open settings sheet on right-click
    const handleContextMenu = (e: React.MouseEvent, period: string) => {
      e.preventDefault();
      handleCellDoubleClick(day, monthInfo, period);
    };

    return (
      <>
        {/* B column (Beatriz) with day letter - green on Wednesdays */}
        <div
          key={`${day}-${monthInfo.month}-${monthInfo.year}-b`}
          className={`
            min-h-[22px] text-[8px] font-medium text-center flex items-center justify-center border-r border-border/30 cursor-pointer
            ${!isValid ? 'bg-muted/50' : ''}
          `}
          style={
            !isValid ? undefined :
            isPast ? { backgroundColor: PAST_DATE_BG } :
            isWednesday(day, monthInfo.month, monthInfo.year) || isWeekend ? { backgroundColor: '#ecfdf5' } :
            { backgroundColor: '#fffbeb' }
          }
          onClick={() => isValid && handleCellClick(day, monthInfo, 'morning')}
        >
          {isValid && (
            <span className={isWednesday(day, monthInfo.month, monthInfo.year) || isWeekend ? 'text-green-700' : 'text-muted-foreground'}>
              {dayOfWeek}
            </span>
          )}
        </div>
        {/* Morning slot */}
        <div
          key={`${day}-${monthInfo.month}-${monthInfo.year}-morning`}
          className={`
            border-r border-border/50 min-h-[22px] p-0.5 cursor-pointer transition-colors flex items-center justify-center
            ${!isValid ? 'bg-muted/50' : ''}
            ${isValid && !morningEvent && !editingMorning ? 'hover:bg-muted/40' : ''}
          `}
          style={{
            backgroundColor: isPast && isValid 
              ? PAST_DATE_BG 
              : (isValid && morningEvent && !editingMorning && morningStyle.bgColor ? morningStyle.bgColor : undefined)
          }}
          onClick={() => isValid && handleCellClick(day, monthInfo, 'morning')}
          onContextMenu={(e) => isValid && handleContextMenu(e, 'morning')}
          title="Manhã - Clique direito para definições"
        >
          {isValid && (
            editingMorning ? (
              <EventAutocomplete
                ref={inputRef}
                value={inlineValue}
                onChange={setInlineValue}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                suggestions={eventSuggestions || []}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none text-center"
                placeholder="..."
              />
            ) : (
              <span 
                className={`break-words text-center leading-tight w-full text-[9px] ${!isPast && morningEvent ? 'font-bold' : ''}`}
                style={morningEvent && morningStyle.textColor ? { color: morningStyle.textColor } : undefined}
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
            border-r border-border/50 min-h-[22px] p-0.5 cursor-pointer transition-colors flex items-center justify-center
            ${!isValid ? 'bg-muted/50' : ''}
            ${isValid && !afternoonEvent && !editingAfternoon ? 'hover:bg-muted/40' : ''}
          `}
          style={{
            backgroundColor: isPast && isValid 
              ? PAST_DATE_BG 
              : (isValid && afternoonEvent && !editingAfternoon && afternoonStyle.bgColor ? afternoonStyle.bgColor : undefined)
          }}
          onClick={() => isValid && handleCellClick(day, monthInfo, 'afternoon')}
          onContextMenu={(e) => isValid && handleContextMenu(e, 'afternoon')}
          title="Tarde - Clique direito para definições"
        >
          {isValid && (
            editingAfternoon ? (
              <EventAutocomplete
                ref={inputRef}
                value={inlineValue}
                onChange={setInlineValue}
                onBlur={handleInlineSave}
                onKeyDown={handleInlineKeyDown}
                suggestions={eventSuggestions || []}
                className="w-full h-full bg-background border border-primary text-[9px] px-0.5 outline-none text-center"
                placeholder="..."
              />
            ) : (
              <span 
                className={`break-words text-center leading-tight w-full text-[9px] ${!isPast && afternoonEvent ? 'font-bold' : ''}`}
                style={afternoonEvent && afternoonStyle.textColor ? { color: afternoonStyle.textColor } : undefined}
                title={afternoonEvent?.title || ''}
              >
                {afternoonEvent?.title || ''}
              </span>
            )
          )}
        </div>
        {/* D column (Diana) - with double border as month separator */}
        <div
          key={`${day}-${monthInfo.month}-${monthInfo.year}-d`}
          className={`
            min-h-[22px] text-[9px] font-medium text-center flex items-center justify-center cursor-pointer
            ${!isValid ? 'bg-muted/50' : ''}
          `}
          style={{
            backgroundColor: !isValid 
              ? undefined 
              : isPast 
                ? PAST_DATE_BG 
                : '#dbeafe', // light blue for future dates
            borderRight: '3px double #64748b' // double line separator between months
          }}
          onClick={() => isValid && handleCellClick(day, monthInfo, 'afternoon')}
        >
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
          <div className="flex items-center gap-2">
            <CalendarSettingsSheet 
              categories={categories}
              onCategoriesChange={setCategories}
            />
            {showFullYear && (
              <>
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
              </>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Clique para editar • Clique direito para definições • Delete apaga evento
        </p>
      </CardHeader>
      <CardContent className="p-2 overflow-x-auto">
        <div className={showFullYear ? "min-w-[900px]" : "min-w-[700px]"}>
          {/* Grid Header */}
          <div 
            className="border-b border-border sticky top-0 bg-slate-300 z-10"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: sixMonthGridTemplate 
            }}
          >
            <div className="p-1 text-[10px] font-bold text-foreground text-center border-r border-border">
              Dia
            </div>
            {showFullYear ? (
              visibleMonths.map((monthInfo) => (
                <div
                  key={`${monthInfo.month}-${monthInfo.year}`}
                  className="p-1 text-[10px] font-bold text-foreground text-center border-r border-border last:border-r-0"
                >
                  {monthInfo.label}
                </div>
              ))
            ) : (
              visibleMonths.map((monthInfo) => (
                <>
                  {/* B column header */}
                  <div key={`${monthInfo.month}-${monthInfo.year}-b-header`} className="p-0.5 text-[8px] font-bold text-foreground text-center border-r border-border/30">B</div>
                  {/* Month name spanning Morning and Afternoon columns */}
                  <div 
                    key={`${monthInfo.month}-${monthInfo.year}-month-header`} 
                    className="p-0.5 text-[9px] font-bold text-foreground text-center border-r border-border/30"
                    style={{ gridColumn: 'span 2' }}
                  >
                    {monthInfo.label}
                  </div>
                  {/* D column header - with double border as month separator */}
                  <div key={`${monthInfo.month}-${monthInfo.year}-d-header`} className="p-0.5 text-[8px] font-bold text-foreground text-center" style={{ borderRight: '3px double #64748b' }}>D</div>
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
                gridTemplateColumns: sixMonthGridTemplate 
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
          {categories.map(cat => (
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
                  {categories.map(cat => (
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
