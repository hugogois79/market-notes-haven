import React from "react";
import { TaoValidator, TaoContactLog, TaoNote } from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import ValidatorsList from "./ValidatorsList";
import SubnetsOverview from "./SubnetsOverview";
import ContactTimeline from "./ContactTimeline";
import CRMPipeline from "./CRMPipeline";
import MondayCRMView from "./MondayCRMView";
import TaoNotesTab from "./TaoNotesTab";
import ValidatorDialogs from "./ValidatorDialogs";
import ValidatorManagementHeader from "./ValidatorManagementHeader";
import ValidatorManagementTabs from "./ValidatorManagementTabs";
import { useValidatorData } from "@/hooks/useValidatorData";
import { useValidatorManagementState } from "@/hooks/useValidatorManagementState";
import { useValidatorActions } from "@/hooks/useValidatorActions";

interface ValidatorManagementProps {
  initialTab?: string;
  initialView?: "main" | "kanban";
}

const ValidatorManagement: React.FC<ValidatorManagementProps> = ({ 
  initialTab = "monday-crm", 
  initialView = "main" 
}) => {
  // Get data from our custom hooks
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

  // Get state management from our custom hook with initial values from props
  const {
    activeTab,
    setActiveTab,
    validatorFormOpen,
    setValidatorFormOpen,
    contactLogFormOpen,
    setContactLogFormOpen,
    noteFormOpen,
    setNoteFormOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedValidator,
    setSelectedValidator,
    selectedContactLog,
    setSelectedContactLog,
    selectedNote,
    setSelectedNote,
    selectedSubnet,
    setSelectedSubnet
  } = useValidatorManagementState(initialTab);

  // Get actions from our custom hook
  const {
    handleValidatorFormSubmit,
    handleContactLogFormSubmit,
    handleNoteFormSubmit,
    handleMoveValidatorStage,
    handleAddNote
  } = useValidatorActions(
    refreshAllData,
    refetchValidators,
    refetchContactLogs,
    setValidatorFormOpen,
    setContactLogFormOpen,
    setNoteFormOpen
  );

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

  const handleViewSubnet = (subnet: TaoSubnet) => {
    setSelectedSubnet(subnet);
    toast.info(`Viewing subnet: ${subnet.name}`);
  };

  const handleAddValidatorToSubnet = (subnet: TaoSubnet) => {
    toast.info(`Add validator to subnet: ${subnet.name}`);
  };

  return (
    <div className="space-y-6">
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
              initialView={initialView}
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
