import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface CalendarCategory {
  value: string;
  label: string;
  bgClass: string;
  textClass: string;
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

const COLOR_PRESETS = [
  { color: "#ef4444", bgClass: "bg-red-500", textClass: "text-white" },
  { color: "#f97316", bgClass: "bg-orange-500", textClass: "text-white" },
  { color: "#eab308", bgClass: "bg-yellow-500", textClass: "text-yellow-900" },
  { color: "#22c55e", bgClass: "bg-green-500", textClass: "text-white" },
  { color: "#0ea5e9", bgClass: "bg-sky-500", textClass: "text-white" }, // bright light blue
  { color: "#3b82f6", bgClass: "bg-blue-500", textClass: "text-white" },
  { color: "#8b5cf6", bgClass: "bg-purple-500", textClass: "text-white" },
  { color: "#ec4899", bgClass: "bg-pink-500", textClass: "text-white" },
  { color: "#6b7280", bgClass: "bg-gray-500", textClass: "text-white" },
  { color: "#fecaca", bgClass: "bg-red-200", textClass: "text-red-900" },
  { color: "#fed7aa", bgClass: "bg-orange-200", textClass: "text-orange-900" },
  { color: "#fef08a", bgClass: "bg-yellow-200", textClass: "text-yellow-900" },
  { color: "#bbf7d0", bgClass: "bg-green-200", textClass: "text-green-900" },
  { color: "#7dd3fc", bgClass: "bg-sky-300", textClass: "text-sky-900" }, // light sky blue
  { color: "#bfdbfe", bgClass: "bg-blue-200", textClass: "text-blue-900" },
  { color: "#ddd6fe", bgClass: "bg-purple-200", textClass: "text-purple-900" },
  { color: "#fbcfe8", bgClass: "bg-pink-200", textClass: "text-pink-900" },
  { color: "#e5e7eb", bgClass: "bg-gray-200", textClass: "text-gray-900" },
];

interface CalendarSettingsSheetProps {
  categories: CalendarCategory[];
  onCategoriesChange: (categories: CalendarCategory[]) => void;
}

export default function CalendarSettingsSheet({ 
  categories, 
  onCategoriesChange 
}: CalendarSettingsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<CalendarCategory[]>(categories);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) {
      toast.error("Digite um nome para a categoria");
      return;
    }
    
    const value = newCategoryLabel.toLowerCase().replace(/\s+/g, '_');
    if (localCategories.some(c => c.value === value)) {
      toast.error("Esta categoria já existe");
      return;
    }

    const newCategory: CalendarCategory = {
      value,
      label: newCategoryLabel.trim(),
      bgClass: "bg-gray-200",
      textClass: "text-gray-900",
      color: "#e5e7eb",
    };

    setLocalCategories([...localCategories, newCategory]);
    setNewCategoryLabel("");
  };

  const handleDeleteCategory = (value: string) => {
    setLocalCategories(localCategories.filter(c => c.value !== value));
  };

  const handleColorChange = (value: string, preset: typeof COLOR_PRESETS[0]) => {
    setLocalCategories(localCategories.map(c => 
      c.value === value 
        ? { ...c, color: preset.color, bgClass: preset.bgClass, textClass: preset.textClass }
        : c
    ));
  };

  const handleLabelChange = (value: string, newLabel: string) => {
    setLocalCategories(localCategories.map(c => 
      c.value === value ? { ...c, label: newLabel } : c
    ));
  };

  const handleSave = () => {
    onCategoriesChange(localCategories);
    localStorage.setItem('calendar_categories', JSON.stringify(localCategories));
    toast.success("Configurações guardadas");
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalCategories(DEFAULT_CATEGORIES);
    onCategoriesChange(DEFAULT_CATEGORIES);
    localStorage.removeItem('calendar_categories');
    toast.success("Categorias restauradas");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs">Configurações</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Configurações do Calendário</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-sm font-medium">Categorias</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Personalize as categorias e cores do calendário
            </p>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {localCategories.map((category) => (
                <div 
                  key={category.value}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card"
                >
                  <Input
                    value={category.label}
                    onChange={(e) => handleLabelChange(category.value, e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => handleColorChange(category.value, preset)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          category.color === preset.color 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.value)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Add new category */}
            <div className="flex gap-2 mt-3">
              <Input
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Nova categoria..."
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-1"
                onClick={handleAddCategory}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Restaurar padrões
            </Button>
            <Button size="sm" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function loadCalendarCategories(): CalendarCategory[] {
  try {
    const stored = localStorage.getItem('calendar_categories');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading calendar categories:', e);
  }
  return DEFAULT_CATEGORIES;
}
