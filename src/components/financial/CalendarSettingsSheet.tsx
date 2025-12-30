import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Plus, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CalendarCategory {
  value: string;
  label: string;
  bgClass: string;
  textClass: string;
  color: string;
  isShared?: boolean;
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

// Light colors with black text, dark colors with white text
const COLOR_PRESETS = [
  { color: "#fecaca", bgClass: "bg-red-200", textClass: "text-black" },       // Light red
  { color: "#dc2626", bgClass: "bg-red-600", textClass: "text-white" },       // Dark red (strong)
  { color: "#fed7aa", bgClass: "bg-orange-200", textClass: "text-black" },    // Light orange
  { color: "#fef08a", bgClass: "bg-yellow-200", textClass: "text-black" },    // Light yellow
  { color: "#bbf7d0", bgClass: "bg-green-200", textClass: "text-black" },     // Light green
  { color: "#bae6fd", bgClass: "bg-sky-200", textClass: "text-black" },       // Light sky
  { color: "#93c5fd", bgClass: "bg-blue-300", textClass: "text-black" },      // Light blue (new for Férias)
  { color: "#3b82f6", bgClass: "bg-blue-500", textClass: "text-white" },      // Bright blue (strong)
  { color: "#1e40af", bgClass: "bg-blue-800", textClass: "text-white" },      // Dark blue (strong)
  { color: "#ddd6fe", bgClass: "bg-purple-200", textClass: "text-black" },    // Light purple
  { color: "#7c3aed", bgClass: "bg-violet-600", textClass: "text-white" },    // Dark purple (strong)
  { color: "#fbcfe8", bgClass: "bg-pink-200", textClass: "text-black" },      // Light pink
];

// Helper to determine if a color is dark (needs white text)
const isDarkColor = (color: string): boolean => {
  const darkColors = ["#1e40af", "#1e3a8a", "#312e81", "#4c1d95", "#831843", "#7f1d1d", "#dc2626", "#b91c1c", "#991b1b", "#7c3aed", "#6d28d9", "#5b21b6", "#3b82f6", "#2563eb", "#ef4444"];
  return darkColors.includes(color.toLowerCase());
};

interface CalendarSettingsSheetProps {
  categories: CalendarCategory[];
  onCategoriesChange: (categories: CalendarCategory[]) => void;
  isSaving?: boolean;
}

export default function CalendarSettingsSheet({ 
  categories, 
  onCategoriesChange,
  isSaving = false,
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

  const handleSharedChange = (value: string, isShared: boolean) => {
    setLocalCategories(localCategories.map(c => 
      c.value === value ? { ...c, isShared } : c
    ));
  };

  const handleSave = () => {
    onCategoriesChange(localCategories);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalCategories(DEFAULT_CATEGORIES);
    onCategoriesChange(DEFAULT_CATEGORIES);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5">
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs">Configurações</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-[700px]">
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
                  className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card"
                >
                  {/* Preview badge */}
                  <div 
                    className="px-2 py-1 rounded text-xs font-medium min-w-[80px] text-center"
                    style={{ 
                      backgroundColor: category.color,
                      color: isDarkColor(category.color) ? '#ffffff' : '#000000'
                    }}
                  >
                    {category.label}
                  </div>
                  
                  <Input
                    value={category.label}
                    onChange={(e) => handleLabelChange(category.value, e.target.value)}
                    className="h-8 text-sm w-[120px] min-w-[120px]"
                  />
                  
                  <div className="flex gap-1">
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
                  
                  {/* Share toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <Share2 className={`h-3.5 w-3.5 ${category.isShared ? 'text-primary' : 'text-muted-foreground'}`} />
                          <Switch
                            checked={category.isShared || false}
                            onCheckedChange={(checked) => handleSharedChange(category.value, checked)}
                            className="scale-75"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {category.isShared 
                            ? "Eventos visíveis para todos os utilizadores" 
                            : "Clique para partilhar com outros utilizadores"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
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
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { DEFAULT_CATEGORIES };
