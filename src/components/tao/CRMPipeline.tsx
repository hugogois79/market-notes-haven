
import React, { useState } from "react";
import { TaoValidator, updateValidatorStage } from "@/services/taoValidatorService";
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
  // Group validators by CRM stage
  const validatorsByStage = groupValidatorsByStage(validators);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    // If there's no destination, the item was dropped outside droppable areas
    if (!destination) {
      console.log("No destination - dropped outside droppable area");
      return;
    }
    
    // If the item was dropped back to its original position
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      console.log("Dropped in same position - no changes");
      return;
    }

    // Find the validator that was dragged
    const validator = validators.find(v => v.id === draggableId);
    if (!validator) {
      console.error("Validator not found with ID:", draggableId);
      toast.error("Error: Validator not found");
      return;
    }

    // Move the validator to the new stage
    if (destination.droppableId !== source.droppableId) {
      const newStage = destination.droppableId as TaoValidator["crm_stage"];
      console.log(`Moving ${validator.name} from ${source.droppableId} to ${newStage}`);
      
      try {
        // Call the direct service function for more reliability
        const updatedValidator = await updateValidatorStage(validator.id, newStage);
        
        if (updatedValidator) {
          toast.success(`Moved ${validator.name} to ${newStage}`);
          // Call the parent handler to refresh data
          onMoveStage(validator, newStage);
        } else {
          toast.error(`Failed to move ${validator.name} to ${newStage}`);
        }
      } catch (error) {
        console.error("Error during drag and drop stage change:", error);
        toast.error("An error occurred while updating the stage");
      }
    } else {
      console.log(`Reordering within the same column: ${source.droppableId}`);
      // Note: If you want to implement ordering within columns, you would handle that here
    }
  };

  const handleDragStart = () => {
    console.log("Drag started");
    setIsDragging(true);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-6 gap-4" style={{ minWidth: "1200px" }}>
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
              isDragging={isDragging}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default CRMPipeline;
