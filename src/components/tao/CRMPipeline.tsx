import React, { useState } from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import StageColumn from "./crm/StageColumn";
import { 
  crmStages, 
  getStageColor, 
  getPriorityColor, 
  getAvailableStages,
  groupValidatorsByStage
} from "./crm/crmUtils";
import { toast } from "sonner";

interface CRMPipelineProps {
  validators: TaoValidator[];
  onView: (validator: TaoValidator) => void;
  onMoveStage: (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => void;
  onAddValidator?: () => void;
}

const CRMPipeline: React.FC<CRMPipelineProps> = ({
  validators,
  onView,
  onMoveStage,
  onAddValidator,
}) => {
  // Keep track of validators for optimistic updates
  const [localValidators, setLocalValidators] = useState<TaoValidator[]>(validators);

  // Update local state when props change
  React.useEffect(() => {
    setLocalValidators(validators);
  }, [validators]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Return if dropped outside any droppable
    if (!destination) return;

    // Return if dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the validator that was dragged
    const validator = localValidators.find(v => v.id === draggableId);
    if (!validator) {
      console.error("Validator not found:", draggableId);
      return;
    }

    // Move the validator to the new stage
    if (destination.droppableId !== source.droppableId) {
      const newStage = destination.droppableId as TaoValidator["crm_stage"];
      const oldStage = validator.crm_stage;
      
      console.log(`Moving ${validator.name} from ${oldStage} to ${newStage} stage`);
      
      try {
        // Update local state first for immediate UI feedback
        const updatedValidators = localValidators.map(v => 
          v.id === validator.id ? { ...v, crm_stage: newStage } : v
        );
        setLocalValidators(updatedValidators);
        
        // Show loading toast
        const loadingToast = toast.loading(`Moving ${validator.name} to ${newStage}...`);
        
        // Call the onMoveStage handler and wait for it to complete
        await onMoveStage(validator, newStage);
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Moved ${validator.name} to ${newStage} stage`);
      } catch (error) {
        console.error("Error moving validator:", error);
        toast.error(`Failed to move ${validator.name} to ${newStage}`);
        
        // Reset local state to match props on error
        setLocalValidators(validators);
      }
    }
  };

  const validatorsByStage = groupValidatorsByStage(localValidators);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-6 gap-4 min-w-[1200px]">
        {crmStages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            validators={validatorsByStage[stage] || []}
            getStageColor={getStageColor}
            getPriorityColor={getPriorityColor}
            getAvailableStages={getAvailableStages}
            onView={onView}
            onMoveStage={onMoveStage}
            onAddValidator={onAddValidator}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default CRMPipeline;
