import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDailyCalendarEvents, DailyCalendarEvent } from "@/hooks/useDailyCalendarEvents";
import { useCalendarCategories, CalendarCategory } from "@/hooks/useCalendarCategories";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
    <div className="w-72 bg-background border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={goToToday}
            className={cn(
              "text-sm font-medium px-2 py-1 rounded hover:bg-accent transition-colors",
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
              <div
                key={event.id}
                className="rounded px-2 py-0.5 text-[11px] font-medium truncate"
                style={{ backgroundColor: color, color: "#fff" }}
              >
                {event.title || "Sem título"}
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="relative" style={{ height: HOURS.length * PX_PER_HOUR }}>
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
          <div className="absolute left-10 right-2 top-0 bottom-0">
            {positionedEvents.map(({ event, pos, index, total }) => {
              const color = getCategoryColor(event.category, categories);
              const eventWidth = total > 1 ? 100 / total : 100;
              const eventLeft = index * eventWidth;

              return (
                <HoverCard key={event.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div
                      className="absolute rounded-md px-2 py-1 cursor-pointer overflow-hidden transition-opacity hover:opacity-90"
                      style={{
                        top: pos.top,
                        height: Math.max(pos.height, 24),
                        left: `${eventLeft}%`,
                        width: `${eventWidth}%`,
                        backgroundColor: color,
                      }}
                    >
                      <p className="text-[11px] font-medium text-white truncate">
                        {event.title || "Sem título"}
                      </p>
                      {pos.height >= 36 && (
                        <p className="text-[10px] text-white/80">
                          {formatEventTime(event)}
                        </p>
                      )}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" className="w-64">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <p className="font-medium">{event.title || "Sem título"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatEventTime(event)}
                          </p>
                          {event.source === "google" && (
                            <p className="text-[10px] text-blue-500">Google Calendar</p>
                          )}
                        </div>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground pl-5">
                          {event.notes}
                        </p>
                      )}
                      {event.category && (
                        <p className="text-xs text-muted-foreground pl-5">
                          Categoria: {event.category}
                        </p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>

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
    </div>
  );
}
