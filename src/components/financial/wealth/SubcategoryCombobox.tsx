import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface SubcategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  category: string;
}

export default function SubcategoryCombobox({
  value,
  onChange,
  category,
}: SubcategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const queryClient = useQueryClient();

  const { data: subcategories = [] } = useQuery({
    queryKey: ["wealth-subcategories", category],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wealth_subcategories")
        .select("*")
        .eq("category", category)
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!category,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("wealth_subcategories").insert({
        name: name.trim(),
        category,
        user_id: user.id,
      });

      if (error) throw error;
      return name.trim();
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ["wealth-subcategories", category] });
      onChange(name);
      setOpen(false);
      toast.success("Subcategoria criada");
    },
    onError: () => {
      toast.error("Erro ao criar subcategoria");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wealth_subcategories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wealth-subcategories", category] });
      toast.success("Subcategoria eliminada");
    },
    onError: () => {
      toast.error("Erro ao eliminar subcategoria");
    },
  });

  const handleCreate = () => {
    if (inputValue.trim()) {
      createMutation.mutate(inputValue.trim());
    }
  };

  const existingNames = subcategories.map((s) => s.name.toLowerCase());
  const showCreateOption = inputValue.trim() && !existingNames.includes(inputValue.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Selecionar subcategoria..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Pesquisar ou criar..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar "{inputValue.trim()}"
                </Button>
              ) : (
                "Nenhuma subcategoria encontrada"
              )}
            </CommandEmpty>
            <CommandGroup>
              {subcategories.map((sub) => (
                <CommandItem
                  key={sub.id}
                  value={sub.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === sub.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {sub.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(sub.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  value={`create-${inputValue}`}
                  onSelect={handleCreate}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar "{inputValue.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
