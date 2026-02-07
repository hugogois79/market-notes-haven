
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaoValidator, TaoContactLog, updateValidatorStage } from "@/services/taoValidatorService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { crmStages, getStageColor, getPriorityColor } from "./crmUtils";
import { Mail, MessageCircle, Link2, MoreHorizontal, Clock, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

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
  // Track local state for optimistic UI updates
  const [localValidators, setLocalValidators] = useState<TaoValidator[]>([]);
  
  // Initialize local state from props
  useEffect(() => {
    setLocalValidators(validators);
  }, [validators]);

  // Group validators by their CRM stage
  const validatorsByStage = crmStages.reduce<Record<string, TaoValidator[]>>((acc, stage) => {
    acc[stage] = localValidators.filter(v => v.crm_stage === stage);
    return acc;
  }, {} as Record<string, TaoValidator[]>);

  // Get the most recent contact logs for a validator
  const getRecentContactLogs = (validatorId: string) => {
    return contactLogs
      .filter(log => log.validator_id === validatorId)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())
      .slice(0, 1);
  };

  // Handle dragging and dropping of cards
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Return if dropped outside any droppable area
    if (!destination) return;

    // Return if dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // If moved to a different stage
    if (destination.droppableId !== source.droppableId) {
      const validator = localValidators.find(v => v.id === draggableId);
      if (!validator) {
        console.error("Validator not found for ID:", draggableId);
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
          // Dismiss loading toast
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
        {crmStages.map(stage => (
          <div key={stage} className="flex flex-col h-full">
            <div className={`px-3 py-2 rounded-t-md ${getStageColor(stage)}`}>
              <h3 className="font-medium text-white flex justify-between items-center">
                <span>{stage}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {validatorsByStage[stage]?.length || 0}
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
                  {validatorsByStage[stage]?.map((validator, index) => {
                    const recentContacts = getRecentContactLogs(validator.id);
                    
                    return (
                      <Draggable 
                        key={validator.id} 
                        draggableId={validator.id} 
                        index={index}
                        isDragDisabled={false}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? "opacity-75" : ""}
                          >
                            <Card className={`bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-move ${
                              snapshot.isDragging ? "ring-2 ring-primary shadow-lg" : ""
                            }`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium">{validator.name}</div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEditValidator(validator)}>
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
                                      Add Contact Log
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onAddNote(validator)}>
                                      Add Note
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={getPriorityColor(validator.priority)}>
                                  {validator.priority}
                                </Badge>
                                <div className="flex space-x-1">
                                  {validator.email && (
                                    <a
                                      href={`mailto:${validator.email}`}
                                      className="text-gray-500 hover:text-blue-600"
                                      title={validator.email}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </a>
                                  )}
                                  {validator.telegram && (
                                    <a
                                      href={`https://t.me/${validator.telegram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-500 hover:text-blue-600"
                                      title={validator.telegram}
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </a>
                                  )}
                                  {validator.linkedin && (
                                    <a
                                      href={`https://linkedin.com/in/${validator.linkedin}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-500 hover:text-blue-600"
                                      title={`linkedin.com/in/${validator.linkedin}`}
                                    >
                                      <Link2 className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {recentContacts.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      Last contact: {format(new Date(recentContacts[0].contact_date), "MMM d, yyyy")} 
                                      via {recentContacts[0].method}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {validator.wallet_address && (
                                <div className="text-xs text-muted-foreground truncate mt-1" title={validator.wallet_address}>
                                  {validator.wallet_address.substring(0, 8)}...{validator.wallet_address.substring(validator.wallet_address.length - 6)}
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full mt-2 border border-dashed border-gray-300 hover:border-gray-400 text-muted-foreground h-10"
                    onClick={onAddValidator}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Validator
                  </Button>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
