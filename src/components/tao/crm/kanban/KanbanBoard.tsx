
import React from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { TaoValidator, TaoContactLog, updateValidatorStage } from "@/services/taoValidatorService";
import { crmStages, getStageColor } from "../crmUtils";
import { toast } from "sonner";
import KanbanColumn from "./KanbanColumn";
import { useKanbanState } from "./useKanbanState";

interface KanbanBoardProps {
  validators: TaoValidator[];
  contactLogs: TaoContactLog[];
  onEditValidator: (validator: TaoValidator) => void;
  onAddValidator: () => void;
  onAddContactLog: (validator?: TaoValidator) => void;
  onAddNote: (validator?: TaoValidator) => void;
  onRefreshData: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  validators,
  contactLogs,
  onEditValidator,
  onAddValidator,
  onAddContactLog,
  onAddNote,
  onRefreshData,
}) => {
  const { localValidators, setLocalValidators } = useKanbanState(validators);

  const getRecentContactLogs = (validatorId: string) => {
    return contactLogs
      .filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 1);
  };

  // Group validators by their CRM stage
  const validatorsByStage = crmStages.reduce<Record<string, TaoValidator[]>>((acc, stage) => {
    acc[stage] = localValidators.filter(v => v.crm_stage === stage);
    return acc;
  }, {} as Record<string, TaoValidator[]>);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (destination.droppableId !== source.droppableId) {
      const validator = localValidators.find(v => v.id === draggableId);
      if (!validator) {
        console.error("Validator not found:", draggableId);
        return;
      }

      const newStage = destination.droppableId as TaoValidator["crm_stage"];
      const oldStage = validator.crm_stage;
      
      try {
        console.log(`Moving validator ${validator.name} from ${oldStage} to ${newStage}`);
        
        // Update local state first for optimistic UI update
        const updatedValidators = localValidators.map(v => 
          v.id === validator.id ? { ...v, crm_stage: newStage } : v
        );
        setLocalValidators(updatedValidators);
        
        // Show loading toast
        const loadingToast = toast.loading(`Moving ${validator.name} to ${newStage}...`);
        
        // Update the database
        const result = await updateValidatorStage(validator.id, newStage);
        
        if (result) {
          toast.dismiss(loadingToast);
          toast.success(`Moved ${validator.name} to ${newStage} stage`);
          
          // Force a complete refresh after a delay
          setTimeout(() => {
            console.log("Refreshing data after stage update");
            onRefreshData();
          }, 1000);
        } else {
          toast.dismiss(loadingToast);
          toast.error("Failed to update validator stage");
          
          // Reset local state on failure
          setLocalValidators(validators);
          
          // Force refresh to show correct data
          onRefreshData();
        }
      } catch (error) {
        console.error("Error moving validator:", error);
        toast.error("An error occurred while moving the validator");
        
        // Reset local state on error
        setLocalValidators(validators);
        onRefreshData();
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-6 min-w-[1200px]">
        {crmStages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            validators={validatorsByStage[stage] || []}
            contactLogs={contactLogs}
            stageColor={getStageColor(stage)}
            onEditValidator={onEditValidator}
            onAddContactLog={onAddContactLog}
            onAddNote={onAddNote}
            onAddValidator={onAddValidator}
            getRecentContactLogs={getRecentContactLogs}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
