import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, Trash2, GripVertical, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MonthlyObjective {
  id: string;
  user_id: string;
  month: number | null;
  year: number;
  content: string;
  is_completed: boolean;
  column_index: number;
  display_order: number;
  created_at: string;
}

interface Child {
  name: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number;
}

interface MonthlyObjectivesFooterProps {
  year: number;
  monthOffset?: number;
  scheduledTitles?: string[];
}

export default function MonthlyObjectivesFooter({ year, monthOffset = 0, scheduledTitles = [] }: MonthlyObjectivesFooterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingToMonth, setAddingToMonth] = useState<{ month: number; year: number } | null>(null);
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Calculate the 3 visible months
  const getVisibleMonths = () => {
    const today = new Date();
    const months: { label: string; month: number; year: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + monthOffset + i, 1);
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      months.push({
        label: `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }
    return months;
  };

  const visibleMonths = getVisibleMonths();

  const { data: objectives = [] } = useQuery({
    queryKey: ["monthly-objectives", visibleMonths.map(m => `${m.year}-${m.month}`).join(",")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Fetch objectives for all visible months
      const allObjectives: MonthlyObjective[] = [];
      for (const m of visibleMonths) {
        const { data, error } = await supabase
          .from("monthly_objectives")
          .select("*")
          .eq("year", m.year)
          .eq("month", m.month)
          .eq("user_id", user.id)
          .order("display_order", { ascending: true });
        
        if (error) throw error;
        if (data) allObjectives.push(...(data as MonthlyObjective[]));
      }
      return allObjectives;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, content, is_completed }: { id?: string; content?: string; is_completed?: boolean; column_index?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (id) {
        const updateData: Partial<MonthlyObjective> = {};
        if (content !== undefined) updateData.content = content;
        if (is_completed !== undefined) updateData.is_completed = is_completed;
        
        const { error } = await supabase
          .from("monthly_objectives")
          .update(updateData)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-objectives"] });
    },
    onError: () => {
      toast.error("Erro ao guardar objetivo");
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ content, month, year }: { content: string; month: number; year: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const monthObjectives = objectives.filter(o => o.month === month && o.year === year);
      const maxOrder = monthObjectives.length > 0 
        ? Math.max(...monthObjectives.map(o => o.display_order)) 
        : -1;

      const { error } = await supabase
        .from("monthly_objectives")
        .insert({
          user_id: user.id,
          year,
          month,
          content,
          display_order: maxOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-objectives"] });
      setAddingToMonth(null);
      setNewValue("");
      toast.success("Objetivo adicionado");
    },
    onError: () => {
      toast.error("Erro ao criar objetivo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monthly_objectives")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-objectives"] });
      toast.success("Objetivo eliminado");
    },
    onError: () => {
      toast.error("Erro ao eliminar objetivo");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; month: number; year: number; display_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("monthly_objectives")
          .update({ month: update.month, year: update.year, display_order: update.display_order })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-objectives"] });
    },
    onError: () => {
      toast.error("Erro ao reordenar objetivos");
    },
  });

  useEffect(() => {
    if ((editingId || addingToMonth !== null) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId, addingToMonth]);

  const handleEdit = (objective: MonthlyObjective) => {
    setEditingId(objective.id);
    setEditValue(objective.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      saveMutation.mutate({ id: editingId, content: editValue.trim() });
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleToggleComplete = (objective: MonthlyObjective) => {
    saveMutation.mutate({ id: objective.id, is_completed: !objective.is_completed });
  };

  const handleAddNew = (monthInfo: { month: number; year: number }) => {
    setAddingToMonth(monthInfo);
    setNewValue("");
  };

  const handleSaveNew = () => {
    if (addingToMonth !== null && newValue.trim()) {
      createMutation.mutate({ content: newValue.trim(), month: addingToMonth.month, year: addingToMonth.year });
    } else {
      setAddingToMonth(null);
      setNewValue("");
    }
  };

  const getMonthObjectives = (month: number, year: number) => {
    return objectives
      .filter(o => o.month === month && o.year === year)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceIdx = parseInt(source.droppableId.replace("month-", ""));
    const destIdx = parseInt(destination.droppableId.replace("month-", ""));

    const sourceMonthInfo = visibleMonths[sourceIdx];
    const destMonthInfo = visibleMonths[destIdx];

    if (!sourceMonthInfo || !destMonthInfo) return;

    // Get all objectives for affected months
    const sourceItems = getMonthObjectives(sourceMonthInfo.month, sourceMonthInfo.year);
    const destItems = sourceIdx === destIdx ? sourceItems : getMonthObjectives(destMonthInfo.month, destMonthInfo.year);

    // Find the dragged item
    const draggedItem = objectives.find(o => o.id === draggableId);
    if (!draggedItem) return;

    const updates: { id: string; month: number; year: number; display_order: number }[] = [];

    if (sourceIdx === destIdx) {
      // Reorder within same month
      const newItems = [...sourceItems];
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);

      newItems.forEach((item, index) => {
        updates.push({ id: item.id, month: destMonthInfo.month, year: destMonthInfo.year, display_order: index });
      });
    } else {
      // Move between months
      const newSourceItems = sourceItems.filter(item => item.id !== draggableId);
      const newDestItems = [...destItems];
      newDestItems.splice(destination.index, 0, draggedItem);

      // Update source month orders
      newSourceItems.forEach((item, index) => {
        updates.push({ id: item.id, month: sourceMonthInfo.month, year: sourceMonthInfo.year, display_order: index });
      });

      // Update destination month orders
      newDestItems.forEach((item, index) => {
        updates.push({ id: item.id, month: destMonthInfo.month, year: destMonthInfo.year, display_order: index });
      });
    }

    reorderMutation.mutate(updates);
  };

  // Reference date for age calculations (first day of first visible month)
  const referenceDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);

  // Children data with birthdays (ages as of Dec 2024: Diana 5, Bea 10, André 23, José 11)
  const children: Child[] = [
    { name: "Diana", birthMonth: 4, birthDay: 21, birthYear: 2020 },
    { name: "Beatriz", birthMonth: 8, birthDay: 5, birthYear: 2015 },
    { name: "André", birthMonth: 5, birthDay: 1, birthYear: 2002 },
    { name: "José", birthMonth: 8, birthDay: 8, birthYear: 2014 },
  ];

  // Calculate age based on birthday and reference date (first visible month)
  // Age increases when the first visible month is >= the birthday month
  const calculateAge = (child: Child): number => {
    let age = referenceDate.getFullYear() - child.birthYear;
    const referenceMonth = referenceDate.getMonth() + 1; // 1-12
    
    // Only increase age when we've reached or passed the birthday month
    if (referenceMonth < child.birthMonth) {
      age--;
    }
    return age;
  };

  return (
    <div className="mt-4 border-t-2 border-slate-300 bg-slate-50 p-3 print:mt-2 print:p-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-3">
          {/* 3 Objective Columns */}
          {visibleMonths.map((monthInfo, idx) => (
            <Droppable key={`${monthInfo.year}-${monthInfo.month}`} droppableId={`month-${idx}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-white border rounded p-2 h-[150px] transition-colors ${
                    snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-600 mb-2 border-b pb-1">
                    {monthInfo.label}
                  </div>
                  <div className="space-y-0.5">
                    {getMonthObjectives(monthInfo.month, monthInfo.year).slice(0, 5).map((objective, index) => (
                      <Draggable key={objective.id} draggableId={objective.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? "opacity-90 shadow-lg" : ""}`}
                          >
                            <ContextMenu modal={false}>
                              <ContextMenuTrigger asChild>
                                <div className="flex items-start gap-1 group">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex-shrink-0 cursor-grab text-slate-300 hover:text-slate-500 mt-0.5"
                                    title="Arraste para mover entre meses"
                                  >
                                    <GripVertical className="h-3 w-3" />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono w-4 flex-shrink-0">
                                    {index + 1})
                                  </span>
                                  {editingId === objective.id ? (
                                    <input
                                      ref={inputRef}
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={handleSaveEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit();
                                        if (e.key === "Escape") {
                                          setEditingId(null);
                                          setEditValue("");
                                        }
                                      }}
                                      className="flex-1 text-[10px] bg-yellow-50 border border-yellow-300 rounded px-1 py-0.5 outline-none"
                                    />
                                  ) : (
                                    <>
                                      <span
                                        onClick={() => handleEdit(objective)}
                                        className={`flex-1 text-[10px] cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 ${
                                          objective.is_completed
                                            ? "line-through text-slate-400"
                                            : scheduledTitles.some(t => t?.toLowerCase() === objective.content.toLowerCase())
                                              ? "underline text-slate-800"
                                              : "text-slate-800"
                                        }`}
                                      >
                                        {objective.content}
                                      </span>
                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          e.stopPropagation();
                                          e.dataTransfer.setData('text/plain', objective.content);
                                          e.dataTransfer.setData('application/x-objective', 'true');
                                          e.dataTransfer.setData('application/x-objective-id', objective.id);
                                          e.dataTransfer.effectAllowed = 'copy';
                                          e.dataTransfer.dropEffect = 'copy';
                                        }}
                                        className="flex-shrink-0 cursor-grab text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Arraste para o calendário"
                                      >
                                        <Calendar className="h-3 w-3" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="z-50">
                                <ContextMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleToggleComplete(objective);
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-2" />
                                  {objective.is_completed ? "Marcar incompleto" : "Marcar completo"}
                                </ContextMenuItem>
                                <ContextMenuItem 
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    deleteMutation.mutate(objective.id);
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Eliminar
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {addingToMonth?.month === monthInfo.month && addingToMonth?.year === monthInfo.year ? (
                      <div className="flex items-start gap-1">
                        <span className="text-[10px] text-slate-400 font-mono w-4 flex-shrink-0 ml-4">
                          {getMonthObjectives(monthInfo.month, monthInfo.year).length + 1})
                        </span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onBlur={handleSaveNew}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveNew();
                            if (e.key === "Escape") {
                              setAddingToMonth(null);
                              setNewValue("");
                            }
                          }}
                          placeholder="Novo objetivo..."
                          className="flex-1 text-[10px] bg-green-50 border border-green-300 rounded px-1 py-0.5 outline-none"
                        />
                      </div>
                    ) : getMonthObjectives(monthInfo.month, monthInfo.year).length < 5 ? (
                      <button
                        onClick={() => handleAddNew(monthInfo)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 mt-0.5 ml-4"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </Droppable>
          ))}

          {/* Context Box - Assets & Kids Ages */}
          <div className="space-y-2">
            {/* Kids Ages Table */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
              <div className="text-[10px] font-semibold text-emerald-700 mb-1">
                Idade Filhos
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-emerald-200">
                    <th className="text-left text-emerald-600 font-medium py-0.5">Nome</th>
                    <th className="text-right text-emerald-600 font-medium py-0.5">Idade</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.name} className="border-b border-emerald-100 last:border-0">
                      <td className="text-emerald-700 py-0.5">{child.name}</td>
                      <td className="text-right font-semibold text-emerald-800 py-0.5">{calculateAge(child)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Assets Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="text-[10px] font-semibold text-blue-700 mb-1">
                Assets
              </div>
              <div className="space-y-0.5 text-[10px] text-blue-600">
                <div className="flex justify-between">
                  <span>Imóveis:</span>
                  <span className="font-mono">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Crypto:</span>
                  <span className="font-mono">-</span>
                </div>
                <div className="flex justify-between">
                  <span>Investimentos:</span>
                  <span className="font-mono">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
