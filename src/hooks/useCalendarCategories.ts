import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CalendarCategory {
  value: string;
  label: string;
  bgClass: string;
  textClass: string;
  color: string;
}

interface DbCalendarCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

const DEFAULT_CATEGORIES: CalendarCategory[] = [
  { value: "legal", label: "Legal", bgClass: "bg-red-500", textClass: "text-white", color: "#ef4444" },
  { value: "family", label: "Família", bgClass: "bg-green-100", textClass: "text-green-900", color: "#dcfce7" },
  { value: "holidays", label: "Férias", bgClass: "bg-yellow-300", textClass: "text-yellow-900", color: "#fde047" },
  { value: "finance", label: "Finanças", bgClass: "bg-blue-200", textClass: "text-blue-900", color: "#bfdbfe" },
  { value: "health", label: "Saúde", bgClass: "bg-purple-100", textClass: "text-purple-900", color: "#f3e8ff" },
  { value: "work", label: "Trabalho", bgClass: "bg-orange-200", textClass: "text-orange-900", color: "#fed7aa" },
  { value: "personal", label: "Pessoal", bgClass: "bg-pink-100", textClass: "text-pink-900", color: "#fce7f3" },
];

// Helper to determine if a color is dark (needs white text)
const isDarkColor = (color: string): boolean => {
  const darkColors = ["#1e40af", "#1e3a8a", "#312e81", "#4c1d95", "#831843", "#7f1d1d", "#dc2626", "#b91c1c", "#991b1b", "#7c3aed", "#6d28d9", "#5b21b6", "#3b82f6", "#2563eb", "#ef4444"];
  return darkColors.includes(color.toLowerCase());
};

const getTextClass = (color: string) => isDarkColor(color) ? "text-white" : "text-black";
const getBgClass = (color: string) => ""; // We'll use inline style for bg

const dbToCategory = (db: DbCalendarCategory): CalendarCategory => ({
  value: db.name.toLowerCase().replace(/\s+/g, '_'),
  label: db.name,
  color: db.color,
  bgClass: getBgClass(db.color),
  textClass: getTextClass(db.color),
});

export function useCalendarCategories() {
  const queryClient = useQueryClient();

  const { data: categories = DEFAULT_CATEGORIES, isLoading } = useQuery({
    queryKey: ["calendar-categories"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_CATEGORIES;

      const { data, error } = await supabase
        .from("calendar_categories")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // If no categories in DB, return defaults
      if (!data || data.length === 0) {
        return DEFAULT_CATEGORIES;
      }

      return data.map(dbToCategory);
    },
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (newCategories: CalendarCategory[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Delete all existing categories for user
      await supabase
        .from("calendar_categories")
        .delete()
        .eq("user_id", user.id);

      // Insert new categories
      const { error } = await supabase
        .from("calendar_categories")
        .insert(
          newCategories.map(cat => ({
            user_id: user.id,
            name: cat.label,
            color: cat.color,
          }))
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-categories"] });
      toast.success("Categorias guardadas");
    },
    onError: () => {
      toast.error("Erro ao guardar categorias");
    },
  });

  const resetToDefaults = async () => {
    await saveCategoriesMutation.mutateAsync(DEFAULT_CATEGORIES);
    toast.success("Categorias restauradas");
  };

  return {
    categories,
    isLoading,
    saveCategories: saveCategoriesMutation.mutate,
    resetToDefaults,
    isSaving: saveCategoriesMutation.isPending,
    DEFAULT_CATEGORIES,
  };
}
