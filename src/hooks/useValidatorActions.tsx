
import { useState } from "react";
import { TaoValidator, TaoContactLog, TaoNote, createValidator, updateValidator, createContactLog, createTaoNote, updateValidatorStage } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useValidatorActions(
  refreshAllData: () => void,
  refetchValidators: () => void,
  refetchContactLogs: () => void,
  setValidatorFormOpen: (open: boolean) => void,
  setContactLogFormOpen: (open: boolean) => void,
  setNoteFormOpen: (open: boolean) => void,
) {
  const navigate = useNavigate();

  const handleValidatorFormSubmit = async (
    data: Omit<TaoValidator, "id" | "created_at" | "updated_at">,
    selectedValidator?: TaoValidator
  ) => {
    try {
      if (selectedValidator) {
        const updated = await updateValidator(selectedValidator.id, data);
        if (updated) {
          toast.success("Validator updated successfully");
          refetchValidators();
        } else {
          toast.error("Failed to update validator");
        }
      } else {
        const created = await createValidator(data);
        if (created) {
          toast.success("Validator created successfully");
          refetchValidators();
        } else {
          toast.error("Failed to create validator");
        }
      }
      
      setValidatorFormOpen(false);
    } catch (error) {
      console.error("Error saving validator:", error);
      toast.error("An error occurred while saving the validator");
    }
  };

  const handleContactLogFormSubmit = async (
    data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">
  ) => {
    try {
      const created = await createContactLog(data);
      if (created) {
        toast.success("Contact log added successfully");
        refetchContactLogs();
        refetchValidators();
      } else {
        toast.error("Failed to add contact log");
      }
      
      setContactLogFormOpen(false);
    } catch (error) {
      console.error("Error adding contact log:", error);
      toast.error("An error occurred while adding the contact log");
    }
  };

  const handleNoteFormSubmit = async (
    data: Omit<TaoNote, "id" | "created_at" | "updated_at">
  ) => {
    try {
      const created = await createTaoNote(data);
      if (created) {
        toast.success("Note added successfully");
        refreshAllData();
      } else {
        toast.error("Failed to add note");
      }
      
      setNoteFormOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("An error occurred while adding the note");
    }
  };

  const handleMoveValidatorStage = async (
    validator: TaoValidator,
    newStage: TaoValidator["crm_stage"]
  ) => {
    try {
      console.log(`Moving validator ${validator.name} from ${validator.crm_stage} to ${newStage}`);
      
      toast.loading(`Updating ${validator.name} to ${newStage} stage...`);
      
      const result = await updateValidatorStage(validator.id, newStage);
      
      if (result) {
        toast.success(`Moved ${validator.name} to ${newStage}`);
        
        setTimeout(async () => {
          await refreshAllData();
          console.log("Data refreshed after stage update");
        }, 1000);
      } else {
        const fallbackUpdate = await updateValidator(validator.id, { crm_stage: newStage });
        
        if (fallbackUpdate) {
          toast.success(`Moved ${validator.name} to ${newStage}`);
          
          setTimeout(async () => {
            await refreshAllData();
            console.log("Data refreshed after fallback update");
          }, 1000);
        } else {
          toast.error("Failed to update validator stage");
          await refreshAllData();
        }
      }
    } catch (error) {
      console.error("Error updating validator stage:", error);
      toast.error("An error occurred while updating the validator stage");
      await refreshAllData();
    }
  };

  const handleAddNote = (validator?: TaoValidator, subnet?: TaoSubnet) => {
    if (validator) {
      navigate(`/editor/new?category=TAO&tags=TAO&title=${encodeURIComponent(`${validator.name} Note`)}`);
    } else {
      navigate("/editor/new?category=TAO&tags=TAO");
    }
  };

  return {
    handleValidatorFormSubmit,
    handleContactLogFormSubmit,
    handleNoteFormSubmit,
    handleMoveValidatorStage,
    handleAddNote
  };
}
