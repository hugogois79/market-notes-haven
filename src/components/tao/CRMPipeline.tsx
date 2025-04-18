
import React from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
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
    const validator = validators.find(v => v.id === draggableId);
    if (!validator) {
      console.error("Validator not found:", draggableId);
      return;
    }

    // Move the validator to the new stage
    if (destination.droppableId !== source.droppableId) {
      const newStage = destination.droppableId as TaoValidator["crm_stage"];
      console.log(`Moving ${validator.name} from ${validator.crm_stage} to ${newStage} stage`);
      
      try {
        // Call the onMoveStage handler with await to ensure it completes
        await onMoveStage(validator, newStage);
        
        // Toast is handled by the parent component
      } catch (error) {
        console.error("Error moving validator:", error);
        toast.error(`Failed to move ${validator.name} to ${newStage}`);
      }
    }
  };

  const validatorsByStage = groupValidatorsByStage(validators);

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
