
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, FolderOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      
      {/* Project selector */}
      <Select 
        onValueChange={handleSelectProject} 
        disabled={isLoading}
        value={selectedProjectId || "none"}
      >
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Selecionar projeto..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg">
          <SelectItem value="none">Sem projeto</SelectItem>
          {!isLoading && projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSection;
