import { useState, useEffect, useCallback, useRef } from "react";
import { format, addDays, subDays, isToday, parseISO, setHours, setMinutes } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, ExternalLink, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDailyCalendarEvents, DailyCalendarEvent } from "@/hooks/useDailyCalendarEvents";
import { useCalendarCategories, CalendarCategory } from "@/hooks/useCalendarCategories";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import CalendarEventDialog from "./CalendarEventDialog";

interface DailyCalendarWidgetProps {
  onClose: () => void;
}

// Hours to display (6am to 11pm)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const PX_PER_HOUR = 48;

// Map period to time slots (fallback when start_time/end_time not available)
const PERIOD_TIME_MAP: Record<string, { start: number; end: number }> = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 14, end: 18 },
};

function getEventPosition(event: DailyCalendarEvent) {
  // Use start_time/end_time if available (Google Calendar events)
  if (event.start_time) {
    const startDate = parseISO(event.start_time);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    
    let endHour = startHour + 1; // Default 1 hour
    if (event.end_time) {
      const endDate = parseISO(event.end_time);
      endHour = endDate.getHours() + endDate.getMinutes() / 60;
      // If end is midnight (0:00) or wraps to next day, treat as 24:00
      if (endHour <= startHour) {
        endHour = 24;
      }
    }
    
    const top = (startHour - 6) * PX_PER_HOUR;
    const height = Math.max((endHour - startHour) * PX_PER_HOUR, 24);
    return { top, height, startHour, endHour };
  }
  
  // Fallback to period-based positioning
  const slot = PERIOD_TIME_MAP[event.period || "morning"] || PERIOD_TIME_MAP.morning;
  const top = (slot.start - 6) * PX_PER_HOUR;
  const height = (slot.end - slot.start) * PX_PER_HOUR;
  return { top, height, startHour: slot.start, endHour: slot.end };
}

function getCategoryColor(category: string | null, categories: CalendarCategory[]) {
  const found = categories.find(
    (c) => c.value === category || c.label.toLowerCase() === category?.toLowerCase()
  );
  return found?.color || "#3b82f6";
}

function formatEventTime(event: DailyCalendarEvent) {
  if (event.all_day) return "Dia inteiro";
  
  if (event.start_time) {
    const start = parseISO(event.start_time);
    const startStr = format(start, "HH:mm");
    
    if (event.end_time) {
      const end = parseISO(event.end_time);
      return `${startStr} - ${format(end, "HH:mm")}`;
    }
    return startStr;
  }
  
  // Fallback to period
  const slot = PERIOD_TIME_MAP[event.period || "morning"] || PERIOD_TIME_MAP.morning;
  return `${slot.start}:00 - ${slot.end}:00`;
}

function getGoogleCalendarUrl(): string {
  const envUrl = import.meta.env.VITE_GOOGLE_CALENDAR_EMBED_URL;
  if (envUrl) {
    try {
      const url = new URL(envUrl);
      const calId = url.searchParams.get("src");
      if (calId) {
        return `https://calendar.google.com/calendar/u/0/r/day?cid=${encodeURIComponent(calId)}`;
      }
    } catch {
      // fallback
    }
  }
  return "https://calendar.google.com/calendar/u/0/r/day";
}

export default function DailyCalendarWidget({ onClose }: DailyCalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, "yyyy-MM-dd");
  
  const { data: events = [], isLoading } = useDailyCalendarEvents(dateString);
  const { categories } = useCalendarCategories();
  const [googleCalendarUrl] = useState(getGoogleCalendarUrl);
  const queryClient = useQueryClient();
  const { syncUpdate, syncDelete } = useGoogleCalendarSync();

  // Single dialog state: either creating (with optional start hour) or editing an event
  const [dialogState, setDialogState] = useState<
    | { mode: "create"; defaultStartHour?: number }
    | { mode: "edit"; event: DailyCalendarEvent }
    | null
  >(null);
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<DailyCalendarEvent | null>(null);

  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeOffset = (currentHour - 6) * PX_PER_HOUR + (currentMinute / 60) * PX_PER_HOUR;
  const showCurrentTimeLine = isToday(selectedDate) && currentHour >= 6 && currentHour < 24;

  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Delete mutation
  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      // Find the event to get google_event_id before deleting
      const eventToDelete = events.find((e) => e.id === eventId);
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;

      // Sync deletion to Google Calendar (fire-and-forget)
      if (eventToDelete) {
        syncDelete(eventId, eventToDelete.google_event_id || null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-calendar-events"] });
      toast.success("Evento eliminado");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Erro ao eliminar evento");
      setDeleteTarget(null);
    },
  });

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteEvent.mutate(deleteTarget.id);
    }
  };

  // --- Drag-and-drop to reschedule events ---
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    event: DailyCalendarEvent;
    startY: number;
    originalTop: number;
    duration: number; // hours
    currentTop: number;
  } | null>(null);

  // Mutable drag tracking via ref - handlers read this, not React state
  const dragRef = useRef<{
    event: DailyCalendarEvent;
    startY: number;
    originalTop: number;
    duration: number;
    currentTop: number;
  } | null>(null);

  // Store cleanup function so we can call it from anywhere
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Update event time mutation
  const updateEventTime = useMutation({
    mutationFn: async ({ eventId, newStartHour, duration }: { eventId: string; newStartHour: number; duration: number }) => {
      const eventDate = parseISO(dateString);
      const startH = Math.floor(newStartHour);
      const startM = Math.round((newStartHour - startH) * 60);
      // Cap end time at 24:00 (midnight) to avoid wrapping to next day
      const endHour = Math.min(newStartHour + duration, 24);
      const endH = Math.floor(endHour);
      const endM = Math.round((endHour - endH) * 60);

      const newStart = setMinutes(setHours(eventDate, startH), startM);
      // If end is exactly 24:00, set to 23:59 to stay within same day
      const newEnd = endH >= 24
        ? setMinutes(setHours(eventDate, 23), 59)
        : setMinutes(setHours(eventDate, endH), endM);

      const { error } = await supabase
        .from("calendar_events")
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;

      // Sync time change to Google Calendar (fire-and-forget)
      const movedEvent = events.find((e) => e.id === eventId);
      if (movedEvent) {
        syncUpdate(
          eventId,
          movedEvent.google_event_id || null,
          movedEvent.title || null,
          dateString,
          movedEvent.notes || null,
          newStart.toISOString(),
          newEnd.toISOString()
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento movido");
    },
    onError: () => {
      toast.error("Erro ao mover evento");
    },
  });

  // Stable ref for mutation so handlers always have latest version
  const updateEventTimeRef = useRef(updateEventTime);
  updateEventTimeRef.current = updateEventTime;

  // Track if we just finished a drag to suppress timeline interactions
  const justDragged = useRef(false);

  // Ends the drag: removes listeners, saves if moved, resets state
  const endDrag = useCallback(() => {
    // Remove global listeners first
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
      dragCleanupRef.current = null;
    }

    const current = dragRef.current;
    if (current) {
      const newStartHour = (current.currentTop / PX_PER_HOUR) + 6;
      const originalStartHour = (current.originalTop / PX_PER_HOUR) + 6;
      // Only save if actually moved at least 15 minutes
      if (Math.abs(newStartHour - originalStartHour) >= 0.25) {
        updateEventTimeRef.current.mutate({
          eventId: current.event.id,
          newStartHour,
          duration: current.duration,
        });
      }
    }

    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 300);
    dragRef.current = null;
    setDragState(null);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, event: DailyCalendarEvent) => {
    // Only left mouse button
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    // If there's a stuck drag, clean it up first
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
      dragCleanupRef.current = null;
      dragRef.current = null;
    }

    const pos = getEventPosition(event);
    const initial = {
      event,
      startY: e.clientY,
      originalTop: pos.top,
      duration: pos.endHour - pos.startHour,
      currentTop: pos.top,
    };

    dragRef.current = initial;
    setDragState(initial);

    // Register listeners SYNCHRONOUSLY in the same event handler tick.
    // This guarantees they're active before any mouseup can fire.
    const onMouseMove = (ev: MouseEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const deltaY = ev.clientY - cur.startY;
      let newTop = cur.originalTop + deltaY;
      // Snap to 15-minute increments
      const snapPx = PX_PER_HOUR / 4;
      newTop = Math.round(newTop / snapPx) * snapPx;
      // Clamp within bounds
      const maxTop = (HOURS.length * PX_PER_HOUR) - (cur.duration * PX_PER_HOUR);
      newTop = Math.max(0, Math.min(newTop, maxTop));
      cur.currentTop = newTop; // mutate ref directly for latest position
      setDragState({ ...cur }); // trigger re-render for visual update
    };

    const onMouseUp = () => {
      cleanup();
      const cur = dragRef.current;
      if (cur) {
        const newStartHour = (cur.currentTop / PX_PER_HOUR) + 6;
        const originalStartHour = (cur.originalTop / PX_PER_HOUR) + 6;
        if (Math.abs(newStartHour - originalStartHour) >= 0.25) {
          updateEventTimeRef.current.mutate({
            eventId: cur.event.id,
            newStartHour,
            duration: cur.duration,
          });
        }
      }
      justDragged.current = true;
      setTimeout(() => { justDragged.current = false; }, 300);
      dragRef.current = null;
      setDragState(null);
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      dragCleanupRef.current = null;
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    dragCleanupRef.current = cleanup;
  }, []);

  // Safety: cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, []);

  // --- Robust timeline click: track mousedown on empty area, confirm on mouseup ---
  const timelineClickRef = useRef<{ y: number; time: number } | null>(null);

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // ONLY left button clicks on empty area
      if (e.button !== 0) return;
      // Ignore if clicking on an event
      if ((e.target as HTMLElement).closest("[data-event]")) return;
      // Ignore if dialog already open
      if (dialogState || deleteTarget) return;
      if (justDragged.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      timelineClickRef.current = { y: e.clientY - rect.top, time: Date.now() };
    },
    [dialogState, deleteTarget]
  );

  const handleTimelineMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (!timelineClickRef.current) return;
      // Ignore if clicking on an event
      if ((e.target as HTMLElement).closest("[data-event]")) {
        timelineClickRef.current = null;
        return;
      }
      if (justDragged.current) {
        timelineClickRef.current = null;
        return;
      }
      if (dialogState || deleteTarget) {
        timelineClickRef.current = null;
        return;
      }

      const { y, time } = timelineClickRef.current;
      timelineClickRef.current = null;

      // Must be a quick tap (< 500ms) and not moved much (< 10px)
      const elapsed = Date.now() - time;
      const rect = e.currentTarget.getBoundingClientRect();
      const currentY = e.clientY - rect.top;
      if (elapsed > 500 || Math.abs(currentY - y) > 10) return;

      const hour = Math.floor(y / PX_PER_HOUR) + 6;
      const minutes = Math.round(((y % PX_PER_HOUR) / PX_PER_HOUR) * 2) * 30;
      const clickedHour = hour + minutes / 60;

      setDialogState({ mode: "create", defaultStartHour: clickedHour });
    },
    [dialogState, deleteTarget]
  );

  // Open create dialog without preset hour
  const handleCreateClick = () => {
    setDialogState({ mode: "create" });
  };

  // Open edit dialog for an event
  const handleEditEvent = useCallback((event: DailyCalendarEvent) => {
    setDialogState({ mode: "edit", event });
  }, []);

  // Separate all-day events from timed events
  const allDayEvents = events.filter((e) => e.all_day);
  const timedEvents = events.filter((e) => !e.all_day);

  // Group overlapping timed events for side-by-side display
  const positionedEvents = timedEvents.map((event) => {
    const pos = getEventPosition(event);
    const overlapping = timedEvents.filter((other) => {
      if (other.id === event.id) return false;
      const otherPos = getEventPosition(other);
      return pos.startHour < otherPos.endHour && pos.endHour > otherPos.startHour;
    });
    const group = [event, ...overlapping].sort((a, b) => a.id.localeCompare(b.id));
    const index = group.indexOf(event);
    const total = group.length;
    return { event, pos, index, total };
  });

  return (
    <div className="w-72 bg-background border-l flex flex-col h-full daily-calendar-widget">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={goToToday}
            className={cn(
              "text-sm font-medium px-2 py-1 rounded hover:bg-accent transition-colors print-only",
              isToday(selectedDate) && "text-primary"
            )}
          >
            {format(selectedDate, "EEE, d MMM", { locale: pt })}
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCreateClick}
            title="Criar evento"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir no Google Calendar"
          >
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="px-2 py-1.5 border-b space-y-1">
          {allDayEvents.map((event) => {
            const color = getCategoryColor(event.category, categories);
            return (
              <ContextMenu key={event.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className="rounded px-2 py-0.5 text-[11px] font-medium truncate cursor-pointer hover:opacity-90 transition-opacity group relative"
                    style={{ backgroundColor: color, color: "#fff" }}
                  >
                    {event.title || "Sem título"}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                  <ContextMenuItem
                    onClick={() => handleEditEvent(event)}
                    className="gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => setDeleteTarget(event)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div
          className="relative cursor-crosshair"
          style={{ height: HOURS.length * PX_PER_HOUR }}
          onMouseDown={handleTimelineMouseDown}
          onMouseUp={handleTimelineMouseUp}
        >
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start border-t border-border/50"
              style={{ top: (hour - 6) * PX_PER_HOUR, height: PX_PER_HOUR }}
            >
              <span className="text-[10px] text-muted-foreground w-10 pl-2 pt-1">
                {hour}:00
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          {showCurrentTimeLine && (
            <div
              className="absolute left-8 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: currentTimeOffset }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div className="flex-1 h-[2px] bg-destructive" />
            </div>
          )}

          {/* Timed events */}
          <div className="absolute left-10 right-2 top-0 bottom-0" ref={timelineRef}>
            {positionedEvents.map(({ event, pos, index, total }) => {
              const color = getCategoryColor(event.category, categories);
              const eventWidth = total > 1 ? 100 / total : 100;
              const eventLeft = index * eventWidth;
              const isDragging = dragState?.event.id === event.id;
              const displayTop = isDragging ? dragState.currentTop : pos.top;
              const displayHeight = isDragging ? dragState.duration * PX_PER_HOUR : Math.max(pos.height, 24);

              // Show drag time preview
              const dragTimeStr = isDragging ? (() => {
                const h = (dragState.currentTop / PX_PER_HOUR) + 6;
                const sh = Math.floor(h);
                const sm = Math.round((h - sh) * 60);
                const eh = h + dragState.duration;
                const ehh = Math.floor(eh);
                const emm = Math.round((eh - ehh) * 60);
                return `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')} - ${String(ehh).padStart(2,'0')}:${String(emm).padStart(2,'0')}`;
              })() : null;

              return (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger asChild disabled={isDragging}>
                    <div
                      data-event="true"
                      className={cn(
                        "absolute rounded-md px-2 py-1 overflow-hidden select-none",
                        isDragging
                          ? "cursor-grabbing opacity-90 shadow-lg ring-2 ring-white/50 z-30"
                          : "cursor-grab hover:opacity-90 transition-opacity"
                      )}
                      style={{
                        top: displayTop,
                        height: Math.max(displayHeight, 24),
                        left: `${eventLeft}%`,
                        width: `${eventWidth}%`,
                        backgroundColor: color,
                        transition: isDragging ? 'none' : 'top 0.15s ease',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        e.stopPropagation(); // Prevent timeline from tracking this
                        // Only drag on left click
                        if (e.button === 0) handleDragStart(e, event);
                      }}
                      onMouseUp={(e) => {
                        // During drag, let mouseup bubble to document so the drag handler receives it.
                        // When not dragging, stop propagation to prevent timeline from acting on it.
                        if (!dragState) e.stopPropagation();
                      }}
                    >
                      <p className="text-[11px] font-medium text-white truncate">
                        {event.title || "Sem título"}
                      </p>
                      {displayHeight >= 36 && (
                        <p className="text-[10px] text-white/80">
                          {isDragging ? dragTimeStr : formatEventTime(event)}
                        </p>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-40">
                    <ContextMenuItem
                      onClick={() => handleEditEvent(event)}
                      className="gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => setDeleteTarget(event)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>

          {/* Drag ghost guide line */}
          {dragState && (
            <div
              className="absolute left-10 right-2 border-t-2 border-dashed border-primary/50 z-20 pointer-events-none"
              style={{ top: dragState.currentTop }}
            />
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with event count */}
      <div className="p-2 border-t text-center">
        <p className="text-xs text-muted-foreground">
          {events.length === 0
            ? "Sem eventos"
            : `${events.length} evento${events.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Event Dialog (Create or Edit) — single state prevents dual-open */}
      <CalendarEventDialog
        open={!!dialogState}
        onOpenChange={(open) => { if (!open) setDialogState(null); }}
        date={dateString}
        categories={categories}
        defaultStartHour={dialogState?.mode === "create" ? dialogState.defaultStartHour : undefined}
        editEvent={dialogState?.mode === "edit" ? dialogState.event : null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres eliminar{" "}
              <strong>"{deleteTarget?.title}"</strong>?
              {deleteTarget?.source === "google" && (
                <span className="block mt-2 text-amber-500">
                  Este evento e do Google Calendar. Sera eliminado localmente mas
                  permanecera no Google Calendar ate a proxima sincronizacao.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
