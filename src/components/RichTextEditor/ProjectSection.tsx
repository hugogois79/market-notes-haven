
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X, FolderOpen, Check, ChevronsUpDown } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ExpenseProject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
}

interface ProjectSectionProps {
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string | null) => void;
  compact?: boolean;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  selectedProjectId,
  onProjectSelect,
  compact = false
}) => {
  const [open, setOpen] = useState(false);

  // Fetch all active expense projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['expense-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_projects')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as ExpenseProject[];
    },
  });
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const handleSelectProject = (projectId: string) => {
    if (projectId === "none") {
      onProjectSelect(null);
    } else {
      onProjectSelect(projectId);
    }
    setOpen(false);
  };
  
  const handleRemoveProject = () => {
    onProjectSelect(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <FolderOpen size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Projeto
        </span>
      </div>
      
      {/* Selected project display */}
      {selectedProject && (
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge 
            variant="secondary" 
            className="px-3 py-1 text-xs gap-2"
            style={{ 
              backgroundColor: selectedProject.color || '#0A3A5C',
              color: 'white'
            }}
          >
            {selectedProject.name}
            <button 
              onClick={handleRemoveProject} 
              className="text-white/70 hover:text-white"
            >
              <X size={12} />
            </button>
          </Badge>
        </div>
      )}
      
      {/* Project selector with search */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] h-8 justify-between text-sm"
            disabled={isLoading}
          >
            {selectedProject ? selectedProject.name : "Selecionar projeto..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 z-[100]" align="start">
          <Command>
            <CommandInput placeholder="Pesquisar projeto..." />
            <CommandList>
              <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelectProject("none")}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selectedProjectId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Sem projeto
                </CommandItem>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleSelectProject(project.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {project.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectSection;
