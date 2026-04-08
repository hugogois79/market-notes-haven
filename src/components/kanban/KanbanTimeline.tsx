import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, differenceInDays, isToday, isWeekend, addWeeks } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Pencil, Trash2, AlertCircle, ShoppingCart, CheckCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanCard, KanbanList } from "@/services/kanbanService";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KanbanCardModal } from "./KanbanCardModal";

interface KanbanTimelineProps {
  lists: KanbanList[];
  cards: KanbanCard[];
  boardId: string;
  onCardClick?: (card: KanbanCard) => void;
  onUpdateCard?: (id: string, updates: Partial<KanbanCard>) => Promise<void>;
  onDeleteCard?: (id: string) => void;
}

// Zoom levels: label, dayWidth, rowHeight, daysToShow
const ZOOM_LEVELS = [
  { label: "XXS", dayWidth: 18, rowHeight: 26, totalDays: 90 },
  { label: "XS",  dayWidth: 30, rowHeight: 30, totalDays: 70 },
  { label: "S",   dayWidth: 50, rowHeight: 34, totalDays: 56 },
  { label: "M",   dayWidth: 80, rowHeight: 38, totalDays: 42 },
  { label: "L",   dayWidth: 120, rowHeight: 40, totalDays: 35 },
] as const;
const DEFAULT_ZOOM = 4; // "L" = original size

// Constants
const HEADER_HEIGHT = 60;
const LIST_LABEL_WIDTH = 220;
const GROUP_HEADER_HEIGHT = 28;
const COLLAPSED_ROW_HEIGHT = GROUP_HEADER_HEIGHT;

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

function getCardColor(card: KanbanCard, listColor?: string): string {
  if (card.priority && PRIORITY_COLORS[card.priority]) {
    return PRIORITY_COLORS[card.priority];
  }
  return listColor || "#3b82f6";
}

function getTextColor(bgColor: string): string {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
}

// Drag state interface
interface DragState {
  cardId: string;
  card: KanbanCard;
  startX: number;
  originalLeft: number;
  originalWidth: number;
  dayOffset: number;           // original start day offset from timeline start
  originalDuration: number;    // original duration (immutable)
  currentDuration: number;     // current duration during resize
  currentDayOffset: number;    // current dragged day offset
  mode: "move" | "resize-end";
}

export default function KanbanTimeline({ lists, cards, boardId, onCardClick, onUpdateCard, onDeleteCard }: KanbanTimelineProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  const toggleGroup = useCallback((listId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  }, []);

  // Zoom-derived values
  const zoom = ZOOM_LEVELS[zoomIdx];
  const DAY_WIDTH = zoom.dayWidth;
  const ROW_HEIGHT = zoom.rowHeight;

  const zoomIn = () => setZoomIdx((z) => Math.min(z + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomIdx((z) => Math.max(z - 1, 0));

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const justDragged = useRef(false);

  // Calculate date range
  const baseDate = useMemo(() => {
    const now = new Date();
    return addWeeks(startOfWeek(now, { weekStartsOn: 1 }), weekOffset);
  }, [weekOffset]);

  const days = useMemo(() => {
    const start = subDays(baseDate, 7);
    return Array.from({ length: zoom.totalDays }, (_, i) => addDays(start, i));
  }, [baseDate, zoom.totalDays]);

  const startDate = days[0];
  const endDate = days[days.length - 1];

  // Group cards by list
  const listGroups = useMemo(() => {
    return lists.map((list) => {
      const listCards = cards
        .filter((c) => c.list_id === list.id && !c.concluded && !c.archived)
        .filter((c) => {
          if (!c.due_date && !c.starting_date) return false;
          const cardStart = c.starting_date ? new Date(c.starting_date) : c.due_date ? new Date(c.due_date) : null;
          const cardEnd = c.due_date ? new Date(c.due_date) : cardStart;
          if (!cardStart || !cardEnd) return false;
          return cardEnd >= startDate && cardStart <= endDate;
        })
        .sort((a, b) => {
          const aStart = a.starting_date || a.due_date || "";
          const bStart = b.starting_date || b.due_date || "";
          return aStart.localeCompare(bStart);
        });
      return { list, cards: listCards };
    }).filter(() => true);
  }, [lists, cards, startDate, endDate]);

  // Scroll to today on mount or zoom change
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const todayLeft = todayRef.current.offsetLeft;
      scrollRef.current.scrollLeft = todayLeft - LIST_LABEL_WIDTH - DAY_WIDTH * 2;
    }
  }, [weekOffset, DAY_WIDTH]);

  const goToPreviousWeek = () => setWeekOffset((w) => w - 1);
  const goToNextWeek = () => setWeekOffset((w) => w + 1);
  const goToToday = () => setWeekOffset(0);

  // Month headers
  const monthHeaders = useMemo(() => {
    const months: { label: string; startIdx: number; span: number }[] = [];
    let currentMonth = "";
    let currentStart = 0;
    let currentSpan = 0;
    days.forEach((day, idx) => {
      const monthLabel = format(day, "MMMM yyyy", { locale: pt });
      if (monthLabel !== currentMonth) {
        if (currentMonth) months.push({ label: currentMonth, startIdx: currentStart, span: currentSpan });
        currentMonth = monthLabel;
        currentStart = idx;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });
    if (currentMonth) months.push({ label: currentMonth, startIdx: currentStart, span: currentSpan });
    return months;
  }, [days]);

  // --- Drag and Drop Logic ---
  const handleDragStart = useCallback((e: React.MouseEvent, card: KanbanCard, mode: "move" | "resize-end") => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    // Clean up any stuck drag
    if (dragCleanupRef.current) {
      dragCleanupRef.current();
      dragCleanupRef.current = null;
      dragRef.current = null;
    }

    const cardStart = card.starting_date ? new Date(card.starting_date) : card.due_date ? new Date(card.due_date) : null;
    const cardEnd = card.due_date ? new Date(card.due_date) : cardStart;
    if (!cardStart || !cardEnd) return;

    const dayOff = differenceInDays(cardStart, startDate);
    const dur = Math.max(differenceInDays(cardEnd, cardStart) + 1, 1);
    const left = Math.max(dayOff, 0) * DAY_WIDTH;
    const clippedStart = Math.max(dayOff, 0);
    const clippedDur = Math.min(dur - (clippedStart - dayOff), days.length - clippedStart);
    const width = Math.max(clippedDur * DAY_WIDTH - 8, 40);

    const initial: DragState = {
      cardId: card.id,
      card,
      startX: e.clientX,
      originalLeft: left,
      originalWidth: width,
      dayOffset: dayOff,
      originalDuration: dur,
      currentDuration: dur,
      currentDayOffset: dayOff,
      mode,
    };

    dragRef.current = initial;
    setDragState(initial);

    const onMouseMove = (ev: MouseEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      const deltaX = ev.clientX - cur.startX;
      const daysDelta = Math.round(deltaX / DAY_WIDTH);

      if (cur.mode === "move") {
        cur.currentDayOffset = cur.dayOffset + daysDelta;
      } else {
        // resize-end: always calculate from original duration
        cur.currentDuration = Math.max(cur.originalDuration + daysDelta, 1);
      }
      setDragState({ ...cur });
    };

    const onMouseUp = () => {
      cleanup();
      const cur = dragRef.current;
      if (cur && onUpdateCard) {
        if (cur.mode === "move") {
          const daysDelta = cur.currentDayOffset - (differenceInDays(
            cur.card.starting_date ? new Date(cur.card.starting_date) : cur.card.due_date ? new Date(cur.card.due_date) : new Date(),
            startDate
          ));
          if (daysDelta !== 0) {
            const origStart = cur.card.starting_date ? new Date(cur.card.starting_date) : cur.card.due_date ? new Date(cur.card.due_date) : new Date();
            const origEnd = cur.card.due_date ? new Date(cur.card.due_date) : origStart;
            const newStart = addDays(origStart, daysDelta);
            const newEnd = addDays(origEnd, daysDelta);
            const updates: Partial<KanbanCard> = {};
            if (cur.card.starting_date) updates.starting_date = format(newStart, "yyyy-MM-dd");
            if (cur.card.due_date) updates.due_date = format(newEnd, "yyyy-MM-dd");
            // If only has due_date (no starting_date), move due_date
            if (!cur.card.starting_date && cur.card.due_date) {
              updates.due_date = format(newEnd, "yyyy-MM-dd");
            }
            onUpdateCard(cur.cardId, updates).then(() => {
              toast.success("Datas actualizadas");
            }).catch(() => {
              toast.error("Erro ao mover tarefa");
            });
          }
        } else {
          // resize-end
          const origStart = cur.card.starting_date ? new Date(cur.card.starting_date) : cur.card.due_date ? new Date(cur.card.due_date) : new Date();
          if (cur.currentDuration !== cur.originalDuration) {
            const newEnd = addDays(origStart, cur.currentDuration - 1);
            onUpdateCard(cur.cardId, { due_date: format(newEnd, "yyyy-MM-dd") }).then(() => {
              toast.success("Prazo actualizado");
            }).catch(() => {
              toast.error("Erro ao redimensionar");
            });
          }
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
  }, [startDate, days.length, onUpdateCard, DAY_WIDTH]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) dragCleanupRef.current();
    };
  }, []);

  // Helper: get drag-aware position for a card
  const getCardDisplay = useCallback((card: KanbanCard) => {
    const cardStart = card.starting_date ? new Date(card.starting_date) : card.due_date ? new Date(card.due_date) : null;
    const cardEnd = card.due_date ? new Date(card.due_date) : cardStart;
    if (!cardStart || !cardEnd) return null;

    let dayOffset = differenceInDays(cardStart, startDate);
    let duration = Math.max(differenceInDays(cardEnd, cardStart) + 1, 1);

    // If this card is being dragged, use drag state
    const ds = dragState;
    if (ds && ds.cardId === card.id) {
      if (ds.mode === "move") {
        dayOffset = ds.currentDayOffset;
      } else {
        duration = ds.currentDuration;
      }
    }

    const clippedStart = Math.max(dayOffset, 0);
    const clippedDuration = Math.min(duration - (clippedStart - dayOffset), days.length - clippedStart);
    const left = clippedStart * DAY_WIDTH;
    const width = Math.max(clippedDuration * DAY_WIDTH - 8, 40);

    // Date preview for tooltip
    const previewStart = addDays(startDate, dayOffset);
    const previewEnd = addDays(previewStart, duration - 1);

    return { left, width, dayOffset, duration, previewStart, previewEnd };
  }, [startDate, days.length, dragState, DAY_WIDTH]);

  return (
    <>
    <div className="border rounded-lg bg-background overflow-hidden">
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {format(days[7], "d MMM", { locale: pt })} — {format(days[days.length - 8], "d MMM yyyy", { locale: pt })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-[10px] hidden lg:inline">Arraste para mover | Ponta direita para redimensionar | Botão direito para opções</span>
          <div className="w-px h-3 bg-border" />
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-md border px-1 py-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background" onClick={zoomOut} disabled={zoomIdx === 0} title="Reduzir zoom (ver mais)">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex gap-0.5 px-1">
              {ZOOM_LEVELS.map((level, idx) => (
                <button
                  key={level.label}
                  onClick={() => setZoomIdx(idx)}
                  className={cn(
                    "w-6 h-5 rounded text-[10px] font-semibold transition-colors",
                    idx === zoomIdx
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted-foreground/10 text-muted-foreground"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background" onClick={zoomIn} disabled={zoomIdx === ZOOM_LEVELS.length - 1} title="Aumentar zoom (ver menos)">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Alta
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Media
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Baixa
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="flex overflow-hidden">
        {/* List labels (fixed left column) */}
        <div className="flex-shrink-0 border-r bg-muted/20 z-10" style={{ width: LIST_LABEL_WIDTH }}>
          <div className="border-b" style={{ height: 28 }} />
          <div className="border-b" style={{ height: HEADER_HEIGHT - 28 }} />
          {listGroups.map(({ list, cards: listCards }) => {
            const isCollapsed = collapsedGroups.has(list.id);
            const rowCount = isCollapsed ? 0 : Math.max(listCards.length, 1);
            const sectionHeight = GROUP_HEADER_HEIGHT + (isCollapsed ? 0 : rowCount * ROW_HEIGHT);
            return (
              <div key={list.id} className="border-b" style={{ height: sectionHeight }}>
                {/* Group header - clickable to toggle */}
                <button
                  onClick={() => toggleGroup(list.id)}
                  className="w-full flex items-center gap-1.5 px-2 hover:bg-muted/40 transition-colors text-left"
                  style={{ height: GROUP_HEADER_HEIGHT }}
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform", isCollapsed && "-rotate-90")} />
                  {list.color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />}
                  <span className="text-xs font-semibold truncate flex-1">{list.title}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">({listCards.length})</span>
                </button>
                {/* Card names list */}
                {!isCollapsed && listCards.map((card) => {
                  const bgColor = getCardColor(card, list.color);
                  return (
                    <div
                      key={card.id}
                      className="flex items-center gap-1.5 px-2 cursor-pointer hover:bg-muted/30 transition-colors"
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => { if (onCardClick) onCardClick(card); else setSelectedCard(card); }}
                      title={card.title}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: bgColor }} />
                      <span className="text-[11px] truncate text-foreground/80" style={{ maxWidth: LIST_LABEL_WIDTH - 36 }}>{card.title}</span>
                    </div>
                  );
                })}
                {!isCollapsed && listCards.length === 0 && (
                  <div className="flex items-center px-2 text-[10px] text-muted-foreground italic" style={{ height: ROW_HEIGHT }}>
                    Sem tarefas
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable timeline area */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: days.length * DAY_WIDTH, minWidth: "100%" }}>
            {/* Month headers row */}
            <div className="flex border-b" style={{ height: 28 }}>
              {monthHeaders.map((m, idx) => (
                <div key={idx} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 flex items-center border-r" style={{ width: m.span * DAY_WIDTH }}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* Day headers row */}
            <div className="flex border-b" style={{ height: HEADER_HEIGHT - 28 }}>
              {days.map((day, idx) => {
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <div key={idx} ref={today ? todayRef : undefined} className={cn("flex flex-col items-center justify-center border-r", today && "bg-primary/10", weekend && !today && "bg-muted/40")} style={{ width: DAY_WIDTH }}>
                    {DAY_WIDTH > 25 && <span className={cn("text-[10px] uppercase leading-none", today ? "text-primary font-bold" : "text-muted-foreground")}>{format(day, DAY_WIDTH >= 50 ? "EEE" : "EEEEE", { locale: pt })}</span>}
                    <span className={cn(DAY_WIDTH <= 25 ? "text-[9px]" : "text-sm", "leading-tight", today ? "text-primary font-bold" : weekend ? "text-muted-foreground" : "text-foreground")}>{format(day, "d")}</span>
                  </div>
                );
              })}
            </div>

            {/* Data rows */}
            {listGroups.map(({ list, cards: listCards }) => {
              const isCollapsed = collapsedGroups.has(list.id);
              const rowCount = isCollapsed ? 0 : Math.max(listCards.length, 1);
              const sectionHeight = GROUP_HEADER_HEIGHT + (isCollapsed ? 0 : rowCount * ROW_HEIGHT);
              return (
                <div key={list.id} className={cn("relative border-b", isCollapsed && "overflow-hidden")} style={{ height: sectionHeight }}>
                  {/* Day column backgrounds */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, idx) => {
                      const today = isToday(day);
                      const weekend = isWeekend(day);
                      return <div key={idx} className={cn("border-r", today && "bg-primary/5", weekend && !today && "bg-muted/20")} style={{ width: DAY_WIDTH }} />;
                    })}
                  </div>

                  {/* Today indicator line */}
                  {days.some((d) => isToday(d)) && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: days.findIndex((d) => isToday(d)) * DAY_WIDTH + DAY_WIDTH / 2 }} />
                  )}

                  {/* Card bars */}
                  {listCards.map((card, cardIdx) => {
                    const display = getCardDisplay(card);
                    if (!display) return null;

                    const { left, width, previewStart, previewEnd } = display;
                    const bgColor = getCardColor(card, list.color);
                    const textColor = getTextColor(bgColor);
                    const isDragging = dragState?.cardId === card.id;

                    const tasks = card.tasks || [];
                    const completed = tasks.filter((t) => t.completed).length;
                    const total = tasks.length;
                    const progress = total > 0 ? (completed / total) * 100 : 0;

                    const datePreview = isDragging
                      ? `${format(previewStart, "d MMM", { locale: pt })} → ${format(previewEnd, "d MMM", { locale: pt })}`
                      : "";

                    const isProcurement = card.labels?.includes('_procurement');

                    return (
                      <ContextMenu key={card.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn("absolute group", isDragging && "z-20")}
                            style={{
                              left: left + 4,
                              top: GROUP_HEADER_HEIGHT + cardIdx * ROW_HEIGHT + 4,
                              width,
                              height: ROW_HEIGHT - 8,
                              transition: isDragging ? "none" : "left 0.15s ease, width 0.15s ease",
                            }}
                          >
                            {/* Single bar - detect move vs resize by click position */}
                            <div
                              className={cn(
                                "w-full h-full rounded-md px-2 flex items-center justify-center gap-1.5 relative overflow-hidden shadow-sm",
                                isDragging && dragState?.mode === "move"
                                  ? "cursor-grabbing opacity-90 shadow-lg ring-2 ring-white/40"
                                  : isDragging && dragState?.mode === "resize-end"
                                    ? "cursor-ew-resize opacity-90 shadow-lg ring-2 ring-white/40"
                                    : "cursor-grab hover:brightness-110 hover:shadow-md"
                              )}
                              style={{ backgroundColor: bgColor, color: textColor }}
                              onMouseDown={(e) => {
                                if (e.button !== 0) return;
                                e.stopPropagation();
                                e.preventDefault();
                                // Detect click position: last 20px = resize, rest = move
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const isResizeZone = clickX >= rect.width - 20;
                                handleDragStart(e, card, isResizeZone ? "resize-end" : "move");
                              }}
                              onMouseMove={(e) => {
                                // Change cursor when near right edge
                                if (!isDragging) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  e.currentTarget.style.cursor = x >= rect.width - 20 ? "ew-resize" : "grab";
                                }
                              }}
                              title={isDragging ? datePreview : `${card.title}${card.due_date ? `\nPrazo: ${format(new Date(card.due_date), "d MMM yyyy", { locale: pt })}` : ""}${total > 0 ? `\nTarefas: ${completed}/${total}` : ""}\n\n↔ Arraste para mover\n⟷ Borda direita para estender prazo\n🖱 Botão direito para opções`}
                            >
                              {total > 0 && (
                                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(to right, rgba(255,255,255,0.3) ${progress}%, transparent ${progress}%)` }} />
                              )}
                              <span className={cn("font-medium truncate relative z-[1]", DAY_WIDTH <= 25 ? "text-[7px]" : DAY_WIDTH <= 50 ? "text-[9px]" : "text-[11px]")}>{card.title}</span>
                              {total > 0 && DAY_WIDTH > 25 && <span className={cn("opacity-75 whitespace-nowrap relative z-[1]", DAY_WIDTH <= 50 ? "text-[8px]" : "text-[9px]")}>{completed}/{total}</span>}

                              {/* Resize grip indicator on right edge */}
                              <div className={cn(
                                "absolute right-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full transition-colors",
                                isDragging && dragState?.mode === "resize-end"
                                  ? "bg-white/90"
                                  : "bg-white/30 group-hover:bg-white/60"
                              )} />

                              {/* Date preview badge during drag */}
                              {isDragging && (
                                <div className="absolute -top-6 left-0 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg z-30">
                                  {datePreview}
                                </div>
                              )}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52">
                          <ContextMenuItem onClick={() => setSelectedCard(card)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar card
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => onUpdateCard?.(card.id, { priority: 'high' })}
                            className="text-red-600"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Alta prioridade
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => onUpdateCard?.(card.id, { priority: 'medium' })}
                            className="text-orange-600"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Média prioridade
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => onUpdateCard?.(card.id, { priority: 'low' })}
                            className="text-green-600"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Baixa prioridade
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => onUpdateCard?.(card.id, { concluded: true })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como concluído
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => {
                              const currentLabels = card.labels || [];
                              const newLabels = isProcurement
                                ? currentLabels.filter(l => l !== '_procurement')
                                : [...currentLabels, '_procurement'];
                              onUpdateCard?.(card.id, { labels: newLabels });
                            }}
                            className="text-purple-600"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isProcurement ? 'Remover Procurement' : 'Pedir Orçamentos'}
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => onDeleteCard?.(card.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar card
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer summary */}
      <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {cards.filter((c) => (c.due_date || c.starting_date) && !c.concluded && !c.archived).length} tarefas com data
          {" / "}
          {cards.filter((c) => !c.due_date && !c.starting_date && !c.concluded && !c.archived).length} sem data
        </span>
        <span className="text-xs text-muted-foreground">{lists.length} listas</span>
      </div>
    </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <KanbanCardModal
          card={selectedCard}
          boardId={boardId}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={onUpdateCard ? (id, updates) => onUpdateCard(id, updates) : async () => {}}
          onDelete={(id) => { onDeleteCard?.(id); setSelectedCard(null); }}
        />
      )}
    </>
  );
}
