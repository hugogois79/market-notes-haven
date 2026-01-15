import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, ProcurementProject, ProcurementProjectInsert } from '@/services/procurement/projectService';
import { assignmentService, ProcurementAssignment, ProcurementAssignmentInsert } from '@/services/procurement/assignmentService';
import { contactLogService, SupplierContactLog, SupplierContactLogInsert } from '@/services/procurement/contactLogService';
import { supplierService } from '@/services/supplierService';
import { toast } from 'sonner';

export const useProcurementProjects = () => {
  return useQuery({
    queryKey: ['procurement-projects'],
    queryFn: () => projectService.getProjects(),
  });
};

export const useProcurementProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['procurement-project', id],
    queryFn: () => id ? projectService.getProjectById(id) : null,
    enabled: !!id,
  });
};

export const useProjectAssignments = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['procurement-assignments', projectId],
    queryFn: () => projectId ? assignmentService.getAssignmentsByProject(projectId) : [],
    enabled: !!projectId,
  });
};

export const useSupplierContactLogs = (supplierId: string | undefined) => {
  return useQuery({
    queryKey: ['supplier-contact-logs', supplierId],
    queryFn: () => supplierId ? contactLogService.getLogsBySupplier(supplierId) : [],
    enabled: !!supplierId,
  });
};

export const useProcurementSuppliers = () => {
  return useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: () => supplierService.getSuppliers(),
  });
};

// Mutations
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (project: ProcurementProjectInsert) => projectService.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create project');
      console.error('Create project error:', error);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProcurementProjectInsert> }) => 
      projectService.updateProject(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['procurement-projects'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-project', id] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project');
      console.error('Update project error:', error);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project');
      console.error('Delete project error:', error);
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignment: ProcurementAssignmentInsert) => assignmentService.createAssignment(assignment),
    onSuccess: (_, { project_id }) => {
      queryClient.invalidateQueries({ queryKey: ['procurement-assignments', project_id] });
      toast.success('Supplier assigned to project');
    },
    onError: (error) => {
      toast.error('Failed to assign supplier');
      console.error('Create assignment error:', error);
    },
  });
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      assignmentService.updateAssignmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-assignments'] });
      toast.success('Status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status');
      console.error('Update status error:', error);
    },
  });
};

export const useBulkCreateAssignments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, supplierIds }: { projectId: string; supplierIds: string[] }) => 
      assignmentService.bulkCreateAssignments(projectId, supplierIds),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['procurement-assignments', projectId] });
      toast.success('Suppliers assigned to project');
    },
    onError: (error) => {
      toast.error('Failed to assign suppliers');
      console.error('Bulk assign error:', error);
    },
  });
};

export const useCreateContactLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (log: SupplierContactLogInsert) => contactLogService.createLog(log),
    onSuccess: (_, { supplier_id, project_id }) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-contact-logs', supplier_id] });
      if (project_id) {
        queryClient.invalidateQueries({ queryKey: ['project-contact-logs', project_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['procurement-suppliers'] });
      toast.success('Contact log added');
    },
    onError: (error) => {
      toast.error('Failed to add contact log');
      console.error('Create contact log error:', error);
    },
  });
};

// Stats hook
export const useProcurementStats = () => {
  const { data: projects } = useProcurementProjects();
  const { data: suppliers } = useProcurementSuppliers();
  
  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.status === 'sourcing' || p.status === 'negotiating').length || 0,
    totalSuppliers: suppliers?.length || 0,
    projectsByStatus: projects?.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };
  
  return stats;
};
