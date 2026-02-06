import { useState, useEffect } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

// Map period to time slots
const PERIOD_TIME_MAP: Record<string, { start: number; end: number }> = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 14, end: 18 },
};

function getEventPosition(period: string | null) {
  const slot = PERIOD_TIME_MAP[period || "morning"] || PERIOD_TIME_MAP.morning;
  const startOffset = (slot.start - 6) * 48; // 48px per hour
  const height = (slot.end - slot.start) * 48;
  return { top: startOffset, height };
}

function getCategoryColor(category: string | null, categories: CalendarCategory[]) {
  const found = categories.find(
    (c) => c.value === category || c.label.toLowerCase() === category?.toLowerCase()
  );
  return found?.color || "#3b82f6";
}

function formatPeriodTime(period: string | null) {
  const slot = PERIOD_TIME_MAP[period || "morning"] || PERIOD_TIME_MAP.morning;
  return `${slot.start}:00 - ${slot.end}:00`;
}

export default function DailyCalendarWidget({ onClose }: DailyCalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = format(selectedDate, "yyyy-MM-dd");
  
  const { data: events = [], isLoading } = useDailyCalendarEvents(dateString);
  const { categories } = useCalendarCategories();

  // Current time indicator
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeOffset = (currentHour - 6) * 48 + (currentMinute / 60) * 48;
  const showCurrentTimeLine = isToday(selectedDate) && currentHour >= 6 && currentHour < 24;

  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Group events by period for positioning
  const morningEvents = events.filter((e) => e.period === "morning");
  const afternoonEvents = events.filter((e) => e.period === "afternoon" || !e.period);

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
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="relative" style={{ height: HOURS.length * 48 }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start border-t border-border/50"
              style={{ top: (hour - 6) * 48, height: 48 }}
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

          {/* Events */}
          <div className="absolute left-10 right-2 top-0 bottom-0">
            {events.map((event, index) => {
              const { top, height } = getEventPosition(event.period);
              const color = getCategoryColor(event.category, categories);
              const eventsInSamePeriod = events.filter((e) => e.period === event.period);
              const eventIndex = eventsInSamePeriod.indexOf(event);
              const eventWidth = eventsInSamePeriod.length > 1 ? 100 / eventsInSamePeriod.length : 100;
              const eventLeft = eventIndex * eventWidth;

              return (
                <HoverCard key={event.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <div
                      className="absolute rounded-md px-2 py-1 cursor-pointer overflow-hidden transition-opacity hover:opacity-90"
                      style={{
                        top,
                        height: Math.max(height, 24),
                        left: `${eventLeft}%`,
                        width: `${eventWidth}%`,
                        backgroundColor: color,
                      }}
                    >
                      <p className="text-[11px] font-medium text-white truncate">
                        {event.title || "Sem título"}
                      </p>
                      <p className="text-[10px] text-white/80">
                        {formatPeriodTime(event.period)}
                      </p>
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
                            {formatPeriodTime(event.period)}
                          </p>
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
