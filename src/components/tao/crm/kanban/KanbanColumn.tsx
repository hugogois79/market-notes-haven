
import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TaoValidator, TaoContactLog } from "@/services/taoValidatorService";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  stage: TaoValidator["crm_stage"];
  validators: TaoValidator[];
  contactLogs: TaoContactLog[];
  stageColor: string;
  onEditValidator: (validator: TaoValidator) => void;
  onAddContactLog: (validator: TaoValidator) => void;
  onAddNote: (validator: TaoValidator) => void;
  onAddValidator: () => void;
  getRecentContactLogs: (validatorId: string) => TaoContactLog[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  validators,
  stageColor,
  onEditValidator,
  onAddContactLog,
  onAddNote,
  onAddValidator,
  getRecentContactLogs,
}) => {
  return (
    <div key={stage} className="flex flex-col h-full">
      <div className={`px-3 py-2 rounded-t-md ${stageColor}`}>
        <h3 className="font-medium text-white flex justify-between items-center">
          <span>{stage}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
            {validators.length || 0}
          </span>
        </h3>
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-b-md p-2 min-h-[calc(100vh-320px)] space-y-2 ${
              snapshot.isDraggingOver
                ? "bg-gray-100 dark:bg-gray-700/50"
                : "bg-gray-50 dark:bg-gray-800/50"
            } transition-colors duration-200`}
          >
            {validators.map((validator, index) => (
              <KanbanCard
                key={validator.id}
                validator={validator}
                index={index}
                recentContacts={getRecentContactLogs(validator.id)}
                onEditValidator={onEditValidator}
                onAddContactLog={onAddContactLog}
                onAddNote={onAddNote}
              />
            ))}
            {provided.placeholder}
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full mt-2 border border-dashed border-gray-300 hover:border-gray-400 text-muted-foreground h-10"
              onClick={onAddValidator}
            >
              <Users className="h-4 w-4 mr-1" />
              Add Organization
            </Button>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
