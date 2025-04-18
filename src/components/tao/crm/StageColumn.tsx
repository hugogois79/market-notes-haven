
import React from "react";
import { Droppable } from 'react-beautiful-dnd';
import ValidatorCard from "./ValidatorCard";
import { Button } from "@/components/ui/button";
import { TaoValidator } from "@/services/taoValidatorService";
import { Plus } from "lucide-react";

interface StageColumnProps {
  stage: TaoValidator["crm_stage"];
  validators: TaoValidator[];
  getStageColor: (stage: TaoValidator["crm_stage"]) => string;
  getPriorityColor: (priority: TaoValidator["priority"]) => string;
  getAvailableStages: (currentStage: TaoValidator["crm_stage"]) => TaoValidator["crm_stage"][];
  onView: (validator: TaoValidator) => void;
  onMoveStage: (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => void;
  onAddValidator?: () => void;
  isDragging?: boolean;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  validators,
  getStageColor,
  getPriorityColor,
  getAvailableStages,
  onView,
  onMoveStage,
  onAddValidator,
  isDragging = false,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className={`px-3 py-2 rounded-t-md ${getStageColor(stage)}`}>
        <h3 className="font-medium">{stage}</h3>
        <div className="text-xs mt-1">
          {validators.length || 0} validators
        </div>
      </div>
      
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-b-md p-2 min-h-[calc(100vh-320px)] transition-colors duration-200 ${
              snapshot.isDraggingOver 
                ? 'bg-gray-100 dark:bg-gray-700/50 border-2 border-primary/50' 
                : 'bg-gray-50 dark:bg-gray-800/50'
            } ${isDragging && !snapshot.isDraggingOver ? 'border-2 border-dashed border-gray-300' : ''}`}
          >
            <div className="space-y-2">
              {validators.map((validator, index) => (
                <ValidatorCard
                  key={validator.id}
                  validator={validator}
                  index={index}
                  onView={onView}
                  onMoveStage={onMoveStage}
                  getAvailableStages={getAvailableStages}
                  getPriorityColor={getPriorityColor}
                />
              ))}
              {provided.placeholder}

              {validators.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No validators
                </div>
              )}

              <div className="mt-2">
                <Button 
                  variant="ghost" 
                  className="w-full border border-dashed border-gray-300 hover:border-gray-400 text-muted-foreground"
                  size="sm"
                  onClick={onAddValidator}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Validator
                </Button>
              </div>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default StageColumn;
