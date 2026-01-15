import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Clock, 
  Euro,
  Users,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { 
  useProcurementProject, 
  useProjectAssignments,
  useDeleteProject,
  useProcurementSuppliers,
  useBulkCreateAssignments,
  useUpdateAssignmentStatus,
} from '@/hooks/procurement/useProcurementData';
import { format } from 'date-fns';
import ProjectFormDialog from '@/components/procurement/ProjectFormDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const assignmentStatuses = [
  { value: 'to_contact', label: 'To Contact', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'technical_clarification', label: 'Needs Info', color: 'bg-amber-500/20 text-amber-500', icon: 'AlertTriangle', attention: true },
  { value: 'proposal_received', label: 'Proposal Received', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'awarded', label: 'Awarded', color: 'bg-green-500/20 text-green-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddSuppliers, setShowAddSuppliers] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  const { data: project, isLoading: projectLoading } = useProcurementProject(id);
  const { data: assignments, isLoading: assignmentsLoading } = useProjectAssignments(id);
  const { data: allSuppliers } = useProcurementSuppliers();
  
  const deleteProject = useDeleteProject();
  const bulkCreateAssignments = useBulkCreateAssignments();
  const updateAssignmentStatus = useUpdateAssignmentStatus();

  if (projectLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/procurement/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const handleDeleteProject = async () => {
    await deleteProject.mutateAsync(project.id);
    navigate('/procurement/projects');
  };

  const assignedSupplierIds = assignments?.map(a => a.supplier_id) || [];
  const availableSuppliers = allSuppliers?.filter(s => !assignedSupplierIds.includes(s.id)) || [];

  const handleAddSuppliers = async () => {
    if (selectedSuppliers.length === 0) return;
    await bulkCreateAssignments.mutateAsync({ 
      projectId: project.id, 
      supplierIds: selectedSuppliers 
    });
    setSelectedSuppliers([]);
    setShowAddSuppliers(false);
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    await updateAssignmentStatus.mutateAsync({ id: assignmentId, status: newStatus });
  };

  // Group assignments by status for Kanban-style view
  const assignmentsByStatus = assignmentStatuses.reduce((acc, status) => {
    acc[status.value] = assignments?.filter(a => a.status === status.value) || [];
    return acc;
  }, {} as Record<string, typeof assignments>);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/procurement/projects')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <Badge className={statusColors[project.status] || ''}>
                {statusLabels[project.status] || project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {project.budget && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold">€{project.budget.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {project.deadline && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-semibold">{format(new Date(project.deadline), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {project.category && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold capitalize">{project.category}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Suppliers</p>
              <p className="font-semibold">{assignments?.length || 0} assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assigned Suppliers</CardTitle>
          <Button size="sm" onClick={() => setShowAddSuppliers(true)}>
            <Plus size={14} className="mr-1" />
            Add Suppliers
          </Button>
        </CardHeader>
        <CardContent>
          {assignmentsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assignments...
            </div>
          ) : !assignments?.length ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No suppliers assigned yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowAddSuppliers(true)}
              >
                Add suppliers to this project
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* Sort: technical_clarification first */}
              {[...(assignments || [])].sort((a, b) => {
                if (a.status === 'technical_clarification') return -1;
                if (b.status === 'technical_clarification') return 1;
                return 0;
              }).map((assignment) => {
                const statusConfig = assignmentStatuses.find(s => s.value === assignment.status);
                const needsAttention = statusConfig?.attention;
                
                return (
                  <div
                    key={assignment.id}
                    className={`flex flex-col p-4 rounded-lg border bg-card ${needsAttention ? 'border-amber-500/50 ring-1 ring-amber-500/20' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{assignment.supplier?.name}</h4>
                          <Badge className={`${statusConfig?.color || ''} ${needsAttention ? 'animate-pulse' : ''}`}>
                            {needsAttention && <AlertTriangle size={12} className="mr-1" />}
                            {statusConfig?.label || assignment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {assignment.supplier?.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={12} />
                              {assignment.supplier.email}
                            </div>
                          )}
                          {assignment.supplier?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={12} />
                              {assignment.supplier.phone}
                            </div>
                          )}
                          {assignment.quoted_price && (
                            <span>Quote: €{assignment.quoted_price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {assignmentStatuses.map((status) => (
                            <DropdownMenuItem 
                              key={status.value}
                              onClick={() => handleStatusChange(assignment.id, status.value)}
                              disabled={assignment.status === status.value}
                            >
                              Set as {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Show vendor question if in technical_clarification status */}
                    {assignment.status === 'technical_clarification' && (assignment as any).clarification_question && (
                      <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-amber-500 mb-1">Vendor Question:</p>
                            <p className="text-sm text-amber-200/90">{(assignment as any).clarification_question}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      <ProjectFormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        project={project}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.title}" and all its supplier assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Suppliers Dialog */}
      <Dialog open={showAddSuppliers} onOpenChange={setShowAddSuppliers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Suppliers to Project</DialogTitle>
          </DialogHeader>
          
          {availableSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              All suppliers are already assigned to this project
            </div>
          ) : (
            <>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {availableSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                      onClick={() => {
                        setSelectedSuppliers(prev =>
                          prev.includes(supplier.id)
                            ? prev.filter(id => id !== supplier.id)
                            : [...prev, supplier.id]
                        );
                      }}
                    >
                      <Checkbox 
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={(checked) => {
                          setSelectedSuppliers(prev =>
                            checked
                              ? [...prev, supplier.id]
                              : prev.filter(id => id !== supplier.id)
                          );
                        }}
                      />
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {(supplier as any).specialty && (
                          <p className="text-sm text-muted-foreground">
                            {(supplier as any).specialty}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddSuppliers(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSuppliers}
                  disabled={selectedSuppliers.length === 0 || bulkCreateAssignments.isPending}
                >
                  Add {selectedSuppliers.length} Supplier{selectedSuppliers.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
