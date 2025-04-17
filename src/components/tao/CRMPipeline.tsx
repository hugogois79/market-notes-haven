
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

interface CRMPipelineProps {
  validators: TaoValidator[];
  onView: (validator: TaoValidator) => void;
  onMoveStage: (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => void;
}

const CRMPipeline: React.FC<CRMPipelineProps> = ({
  validators,
  onView,
  onMoveStage,
}) => {
  // Group validators by CRM stage
  const validatorsByStage = groupValidatorsByStage(validators);

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back to its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the validator that was dragged
    const validator = validators.find(v => v.id === draggableId);
    if (!validator) return;

    // Move the validator to the new stage
    if (destination.droppableId !== source.droppableId) {
      console.log(`Moving ${validator.name} from ${source.droppableId} to ${destination.droppableId}`);
      onMoveStage(validator, destination.droppableId as TaoValidator["crm_stage"]);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default CRMPipeline;
