import React, { useState } from "react";
import {
  createValidator,
  updateValidator,
  updateValidatorStage,
  createContactLog,
  createTaoNote,
  TaoValidator,
  TaoContactLog,
  TaoNote,
} from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import ValidatorsList from "./ValidatorsList";
import SubnetsOverview from "./SubnetsOverview";
import ContactTimeline from "./ContactTimeline";
import CRMPipeline from "./CRMPipeline";
import MondayCRMView from "./MondayCRMView";
import TaoNotesTab from "./TaoNotesTab";
import { useNavigate } from "react-router-dom";
import { useValidatorData } from "@/hooks/useValidatorData";
import ValidatorDialogs from "./ValidatorDialogs";
import ValidatorManagementHeader from "./ValidatorManagementHeader";
import ValidatorManagementTabs from "./ValidatorManagementTabs";

const ValidatorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("monday-crm");
  
  // Dialogs state
  const [validatorFormOpen, setValidatorFormOpen] = useState(false);
  const [contactLogFormOpen, setContactLogFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected items for forms/dialogs
  const [selectedValidator, setSelectedValidator] = useState<TaoValidator | undefined>();
  const [selectedContactLog, setSelectedContactLog] = useState<TaoContactLog | undefined>();
  const [selectedNote, setSelectedNote] = useState<TaoNote | undefined>();
  const [selectedSubnet, setSelectedSubnet] = useState<TaoSubnet | undefined>();
  
  // Get data from our custom hook
  const {
    validators,
    subnets,
    contactLogs,
    notes,
    validatorsBySubnet,
    validatorNames,
    subnetNames,
    isLoading,
    refetchValidators,
    refetchContactLogs,
    refreshAllData
  } = useValidatorData();

  // Handle adding a new validator
  const handleAddValidator = () => {
    setSelectedValidator(undefined);
    setValidatorFormOpen(true);
  };

  // Handle editing a validator
  const handleEditValidator = (validator: TaoValidator) => {
    setSelectedValidator(validator);
    setValidatorFormOpen(true);
  };

  // Handle deleting a validator
  const handleDeleteValidator = (validator: TaoValidator) => {
    setSelectedValidator(validator);
    setDeleteDialogOpen(true);
  };

  // Handle viewing a validator's details
  const handleViewValidator = (validator: TaoValidator) => {
    // For now, this just redirects to the edit form
    handleEditValidator(validator);
  };

  // Handle adding a new contact log
  const handleAddContactLog = (validator?: TaoValidator) => {
    setSelectedValidator(validator);
    setSelectedContactLog(undefined);
    setContactLogFormOpen(true);
  };

  // Handle viewing a contact log
  const handleViewContactLog = (contactLog: TaoContactLog) => {
    setSelectedContactLog(contactLog);
    setContactLogFormOpen(true);
  };

  // Handle adding a new note
  const handleAddNote = (validator?: TaoValidator, subnet?: TaoSubnet) => {
    if (validator) {
      // Navigate to the editor with TAO tag and validator name in title
      navigate(`/editor/new?category=TAO&tags=TAO&title=${encodeURIComponent(`${validator.name} Note`)}`);
    } else {
      // Navigate to the editor with just the TAO tag
      navigate("/editor/new?category=TAO&tags=TAO");
    }
  };

  // Handle submitting validator form
  const handleValidatorFormSubmit = async (
    data: Omit<TaoValidator, "id" | "created_at" | "updated_at">
  ) => {
    try {
      if (selectedValidator) {
        // Update existing validator
        const updated = await updateValidator(selectedValidator.id, data);
        if (updated) {
          toast.success("Validator updated successfully");
          refetchValidators();
        } else {
          toast.error("Failed to update validator");
        }
      } else {
        // Create new validator
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

  // Handle submitting contact log form
  const handleContactLogFormSubmit = async (
    data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">
  ) => {
    try {
      // Currently only supporting creation, not updates
      const created = await createContactLog(data);
      if (created) {
        toast.success("Contact log added successfully");
        refetchContactLogs();
        
        // Refresh validators in case CRM stage was updated by the trigger
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

  // Handle submitting note form
  const handleNoteFormSubmit = async (
    data: Omit<TaoNote, "id" | "created_at" | "updated_at">
  ) => {
    try {
      // Currently only supporting creation, not updates
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

  // Handle moving a validator to a different CRM stage
  const handleMoveValidatorStage = async (
    validator: TaoValidator,
    newStage: TaoValidator["crm_stage"]
  ) => {
    try {
      console.log(`Moving validator ${validator.name} from ${validator.crm_stage} to ${newStage}`);
      
      // First try with the dedicated stage update function
      const result = await updateValidatorStage(validator.id, newStage);
      
      if (result) {
        toast.success(`Moved ${validator.name} to ${newStage}`);
        await refetchValidators(); // Make sure to await the refetch
      } else {
        // If the dedicated function fails, try with the standard update method
        console.log("Dedicated stage update failed, trying standard update function");
        const fallbackUpdate = await updateValidator(validator.id, { crm_stage: newStage });
        
        if (fallbackUpdate) {
          toast.success(`Moved ${validator.name} to ${newStage}`);
          await refetchValidators(); // Make sure to await the refetch
        } else {
          toast.error("Failed to update validator stage");
          // Force a refresh to ensure UI is in sync with backend
          await refreshAllData();
        }
      }
    } catch (error) {
      console.error("Error updating validator stage:", error);
      toast.error("An error occurred while updating the validator stage");
      // Force a refresh to ensure UI is in sync with backend
      await refreshAllData();
    }
  };

  const handleViewSubnet = (subnet: TaoSubnet) => {
    setSelectedSubnet(subnet);
    // Here we could navigate to a subnet detail view or open a dialog
    toast.info(`Viewing subnet: ${subnet.name}`);
  };

  const handleAddValidatorToSubnet = (subnet: TaoSubnet) => {
    // For now, we just log this action
    toast.info(`Add validator to subnet: ${subnet.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <ValidatorManagementHeader 
        onAddValidator={handleAddValidator}
        onAddContactLog={() => handleAddContactLog()}
        onAddNote={() => handleAddNote()}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Tabs navigation */}
        <ValidatorManagementTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <TabsContent value="monday-crm" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading data...</p>
            </div>
          ) : (
            <MondayCRMView
              validators={validators}
              subnets={subnets}
              contactLogs={contactLogs}
              notes={notes}
              validatorsBySubnet={validatorsBySubnet}
              validatorNames={validatorNames}
              subnetNames={subnetNames}
              onAddValidator={handleAddValidator}
              onEditValidator={handleEditValidator}
              onAddContactLog={handleAddContactLog}
              onAddNote={handleAddNote}
              onViewContactLog={handleViewContactLog}
              onRefreshData={refreshAllData}
              onViewSubnet={handleViewSubnet}
            />
          )}
        </TabsContent>

        <TabsContent value="validators-list" className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading validators...</p>
            </div>
          ) : (
            <ValidatorsList
              validators={validators}
              onView={handleViewValidator}
              onEdit={handleEditValidator}
              onDelete={handleDeleteValidator}
              onAddContactLog={handleAddContactLog}
            />
          )}
        </TabsContent>

        <TabsContent value="subnets-overview" className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading subnets...</p>
            </div>
          ) : (
            <SubnetsOverview
              subnets={subnets}
              validatorsBySubnet={validatorsBySubnet}
              validatorNames={validatorNames}
              onViewSubnet={handleViewSubnet}
              onAddValidator={handleAddValidatorToSubnet}
            />
          )}
        </TabsContent>

        <TabsContent value="contact-timeline" className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading contact logs...</p>
            </div>
          ) : (
            <ContactTimeline
              contactLogs={contactLogs}
              validatorNames={validatorNames}
              subnetNames={subnetNames}
              onViewLog={handleViewContactLog}
            />
          )}
        </TabsContent>

        <TabsContent value="crm-pipeline" className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading CRM data...</p>
            </div>
          ) : (
            <CRMPipeline
              validators={validators}
              onView={handleViewValidator}
              onMoveStage={handleMoveValidatorStage}
              onAddValidator={handleAddValidator}
            />
          )}
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
          <TaoNotesTab validatorNames={validatorNames} />
        </TabsContent>
      </Tabs>

      {/* Dialogs for forms and confirmations */}
      <ValidatorDialogs
        validatorFormOpen={validatorFormOpen}
        setValidatorFormOpen={setValidatorFormOpen}
        contactLogFormOpen={contactLogFormOpen}
        setContactLogFormOpen={setContactLogFormOpen}
        noteFormOpen={noteFormOpen}
        setNoteFormOpen={setNoteFormOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        selectedValidator={selectedValidator}
        selectedContactLog={selectedContactLog}
        selectedNote={selectedNote}
        subnets={subnets}
        onValidatorFormSubmit={handleValidatorFormSubmit}
        onContactLogFormSubmit={handleContactLogFormSubmit}
        onNoteFormSubmit={handleNoteFormSubmit}
        refetchValidators={refetchValidators}
      />
    </div>
  );
};

export default ValidatorManagement;
