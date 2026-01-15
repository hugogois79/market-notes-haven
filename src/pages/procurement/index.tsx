import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  FolderKanban, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Mail,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useProcurementProjects, useProcurementSuppliers, useProcurementStats } from '@/hooks/procurement/useProcurementData';
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

export default function ProcurementDashboard() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const { data: projects, isLoading: projectsLoading } = useProcurementProjects();
  const { data: suppliers, isLoading: suppliersLoading } = useProcurementSuppliers();
  const stats = useProcurementStats();

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Procurement</h1>
          <p className="text-muted-foreground">
            Manage suppliers, RFPs, and sourcing projects
          </p>
        </div>
        <Button onClick={() => setShowProjectForm(true)} className="gap-2">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suppliers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sourcing
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsByStatus?.sourcing || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsByStatus?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/procurement/suppliers">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Supplier Management</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage supplier database
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/procurement/projects">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Active Projects</h3>
                  <p className="text-sm text-muted-foreground">
                    Track RFPs and sourcing missions
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Projects</CardTitle>
          <Link to="/procurement/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight size={14} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No projects yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowProjectForm(true)}
              >
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/procurement/projects/${project.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{project.title}</h4>
                      <Badge className={statusColors[project.status] || ''}>
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {project.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {format(new Date(project.deadline), 'MMM d, yyyy')}
                      </div>
                    )}
                    {project.budget && (
                      <div className="font-medium">
                        €{project.budget.toLocaleString()}
                      </div>
                    )}
                    <ArrowRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Form Dialog */}
      <ProjectFormDialog 
        open={showProjectForm} 
        onOpenChange={setShowProjectForm}
      />
    </div>
  );
}
