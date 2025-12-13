import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
}

export default function MonthlyObjectivesFooter({ year, monthOffset = 0 }: MonthlyObjectivesFooterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingToColumn, setAddingToColumn] = useState<number | null>(null);
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: objectives = [] } = useQuery({
    queryKey: ["monthly-objectives", year],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("monthly_objectives")
        .select("*")
        .eq("year", year)
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as MonthlyObjective[];
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
    mutationFn: async ({ content, column_index }: { content: string; column_index: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const columnObjectives = objectives.filter(o => o.column_index === column_index);
      const maxOrder = columnObjectives.length > 0 
        ? Math.max(...columnObjectives.map(o => o.display_order)) 
        : -1;

      const { error } = await supabase
        .from("monthly_objectives")
        .insert({
          user_id: user.id,
          year,
          content,
          column_index,
          display_order: maxOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-objectives"] });
      setAddingToColumn(null);
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

  useEffect(() => {
    if ((editingId || addingToColumn !== null) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId, addingToColumn]);

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

  const handleAddNew = (columnIndex: number) => {
    setAddingToColumn(columnIndex);
    setNewValue("");
  };

  const handleSaveNew = () => {
    if (addingToColumn !== null && newValue.trim()) {
      createMutation.mutate({ content: newValue.trim(), column_index: addingToColumn });
    } else {
      setAddingToColumn(null);
      setNewValue("");
    }
  };

  const getColumnObjectives = (columnIndex: number) => {
    return objectives
      .filter(o => o.column_index === columnIndex)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Calculate the next 3 months based on offset for column headers
  const getNext3Months = () => {
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

  const next3Months = getNext3Months();

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

  const formatBirthday = (child: Child): string => {
    return `${child.birthDay}/${child.birthMonth}`;
  };

  return (
    <div className="mt-4 border-t-2 border-slate-300 bg-slate-50 p-3 print:mt-2 print:p-2">
      <div className="grid grid-cols-4 gap-3">
        {/* 3 Objective Columns */}
        {[1, 2, 3].map((columnIndex) => (
          <div key={columnIndex} className="bg-white border border-slate-200 rounded p-2">
            <div className="text-xs font-semibold text-slate-600 mb-2 border-b pb-1">
              {next3Months[columnIndex - 1]?.label || `Mês ${columnIndex}`}
            </div>
            <div className="space-y-1">
              {getColumnObjectives(columnIndex).map((objective, index) => (
                <ContextMenu key={objective.id}>
                  <ContextMenuTrigger>
                    <div className="flex items-start gap-1 group">
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
                        <span
                          onClick={() => handleEdit(objective)}
                          className={`flex-1 text-[10px] cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 ${
                            objective.is_completed
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {objective.content}
                        </span>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleToggleComplete(objective)}>
                      <Check className="h-3 w-3 mr-2" />
                      {objective.is_completed ? "Marcar incompleto" : "Marcar completo"}
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={() => deleteMutation.mutate(objective.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Eliminar
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
              {addingToColumn === columnIndex ? (
                <div className="flex items-start gap-1">
                  <span className="text-[10px] text-slate-400 font-mono w-4 flex-shrink-0">
                    {getColumnObjectives(columnIndex).length + 1})
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
                        setAddingToColumn(null);
                        setNewValue("");
                      }
                    }}
                    placeholder="Novo objetivo..."
                    className="flex-1 text-[10px] bg-green-50 border border-green-300 rounded px-1 py-0.5 outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleAddNew(columnIndex)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 mt-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </button>
              )}
            </div>
          </div>
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
    </div>
  );
}