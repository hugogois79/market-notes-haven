import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Clock, 
  ArrowRight,
  FolderKanban,
  Users,
  Euro,
} from 'lucide-react';
import { useProcurementProjects } from '@/hooks/procurement/useProcurementData';
import { format } from 'date-fns';
import ProjectFormDialog from '@/components/procurement/ProjectFormDialog';

const statusColors: Record<string, string> = {
  planning: 'bg-muted text-muted-foreground',
  sourcing: 'bg-blue-500/20 text-blue-400',
  negotiating: 'bg-amber-500/20 text-amber-400',
  awarded: 'bg-green-500/20 text-green-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
};

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  sourcing: 'Sourcing',
  negotiating: 'Negotiating',
  awarded: 'Awarded',
  completed: 'Completed',
};

export default function ProcurementProjects() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: projects, isLoading } = useProcurementProjects();

  const filteredProjects = statusFilter 
    ? projects?.filter(p => p.status === statusFilter) 
    : projects;

  const statuses = ['planning', 'sourcing', 'negotiating', 'awarded', 'completed'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Track RFPs and sourcing missions
          </p>
        </div>
        <Button onClick={() => setShowProjectForm(true)} className="gap-2">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={statusFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            {statuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading projects...
        </div>
      ) : filteredProjects?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {statusFilter ? 'No projects with this status' : 'No projects yet'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setShowProjectForm(true)}
            >
              Create your first project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <Link key={project.id} to={`/procurement/projects/${project.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.title}
                    </CardTitle>
                    <Badge className={statusColors[project.status] || ''}>
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {format(new Date(project.deadline), 'MMM d')}
                      </div>
                    )}
                    
                    {project.budget && (
                      <div className="flex items-center gap-1">
                        <Euro size={14} />
                        {project.budget.toLocaleString()}
                      </div>
                    )}
                    
                    {project.category && (
                      <Badge variant="outline" className="text-xs">
                        {project.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end mt-4">
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectFormDialog 
        open={showProjectForm} 
        onOpenChange={setShowProjectForm}
      />
    </div>
  );
}
