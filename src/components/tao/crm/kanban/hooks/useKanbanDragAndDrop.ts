
import { DropResult } from "react-beautiful-dnd";
import { TaoValidator } from "@/services/taoValidatorService";
import { toast } from "sonner";
import { updateValidatorStage } from "@/services/taoValidatorService";

interface UseKanbanDragAndDropProps {
  localValidators: TaoValidator[];
  setLocalValidators: (validators: TaoValidator[]) => void;
  onRefreshData: () => void;
}

export function useKanbanDragAndDrop({
  localValidators,
  setLocalValidators,
  onRefreshData,
}: UseKanbanDragAndDropProps) {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (destination.droppableId !== source.droppableId) {
      const validator = localValidators.find(v => v.id === draggableId);
      if (!validator) return;

      const newStage = destination.droppableId as TaoValidator["crm_stage"];
      
      try {
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
          setTimeout(() => onRefreshData(), 1000);
        } else {
          toast.dismiss(loadingToast);
          toast.error("Failed to update validator stage");
          setLocalValidators(localValidators);
          onRefreshData();
        }
      } catch (error) {
        console.error("Error moving validator:", error);
        toast.error("An error occurred while moving the validator");
        setLocalValidators(localValidators);
        onRefreshData();
      }
    }
  };

  return { handleDragEnd };
}
