
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchValidators,
  fetchContactLogs,
  fetchTaoNotes,
  fetchSubnetsByValidator,
  fetchValidatorsBySubnet,
  createValidator,
  updateValidator,
  deleteValidator,
  createContactLog,
  createTaoNote,
  TaoValidator,
  TaoContactLog,
  TaoNote,
} from "@/services/taoValidatorService";
import { fetchTaoSubnets, TaoSubnet } from "@/services/taoSubnetService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PlusCircle, Users, Table2, Clock, LayoutGrid, Database, StickyNote, Layers } from "lucide-react";
import ValidatorsList from "./ValidatorsList";
import SubnetsOverview from "./SubnetsOverview";
import ContactTimeline from "./ContactTimeline";
import CRMPipeline from "./CRMPipeline";
import MondayCRMView from "./MondayCRMView";
import ValidatorForm from "./ValidatorForm";
import ContactLogForm from "./ContactLogForm";
import NoteForm from "./NoteForm";
import TaoNotesTab from "./TaoNotesTab";
import { useNotes } from "@/contexts/NotesContext";
import { useNavigate } from "react-router-dom";

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
  
  // Get notes from the main app context
  const { refetch: refetchAppNotes } = useNotes();
  
  // Fetch validators data
  const {
    data: validators = [],
    isLoading: isLoadingValidators,
    refetch: refetchValidators,
  } = useQuery({
    queryKey: ["tao-validators"],
    queryFn: fetchValidators,
  });

  // Fetch subnets data
  const {
    data: subnets = [],
    isLoading: isLoadingSubnets,
    refetch: refetchSubnets,
  } = useQuery({
    queryKey: ["tao-subnets"],
    queryFn: fetchTaoSubnets,
  });

  // Fetch contact logs
  const {
    data: contactLogs = [],
    isLoading: isLoadingContactLogs,
    refetch: refetchContactLogs,
  } = useQuery({
    queryKey: ["tao-contact-logs"],
    queryFn: fetchContactLogs,
  });

  // Fetch notes
  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ["tao-notes"],
    queryFn: fetchTaoNotes,
  });

  // Create mappings for subnet-validator relationships
  const [validatorsBySubnet, setValidatorsBySubnet] = useState<Record<number, string[]>>({});
  
  // Create a mapping of validator IDs to names for easier reference
  const validatorNames = validators.reduce<Record<string, string>>(
    (acc, validator) => {
      acc[validator.id] = validator.name;
      return acc;
    },
    {}
  );

  // Create a mapping of subnet IDs to names for easier reference
  const subnetNames = subnets.reduce<Record<number, string>>(
    (acc, subnet) => {
      acc[subnet.id] = subnet.name;
      return acc;
    },
    {}
  );

  // Load subnet-validator relationships
  useEffect(() => {
    const fetchSubnetValidators = async () => {
      const subnetValidatorMap: Record<number, string[]> = {};
      
      await Promise.all(
        subnets.map(async (subnet) => {
          const validatorIds = await fetchValidatorsBySubnet(subnet.id);
          subnetValidatorMap[subnet.id] = validatorIds;
        })
      );
      
      setValidatorsBySubnet(subnetValidatorMap);
    };

    if (subnets.length > 0) {
      fetchSubnetValidators();
    }
  }, [subnets]);

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

  // Handle confirming validator deletion
  const confirmDeleteValidator = async () => {
    if (!selectedValidator) return;
    
    try {
      const success = await deleteValidator(selectedValidator.id);
      if (success) {
        toast.success("Validator deleted successfully");
        refetchValidators();
      } else {
        toast.error("Failed to delete validator");
      }
    } catch (error) {
      console.error("Error deleting validator:", error);
      toast.error("An error occurred while deleting the validator");
    }
    
    setDeleteDialogOpen(false);
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
        refetchNotes();
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
      const updated = await updateValidator(validator.id, { crm_stage: newStage });
      if (updated) {
        toast.success(`Moved ${validator.name} to ${newStage}`);
        refetchValidators();
      } else {
        toast.error("Failed to update validator stage");
      }
    } catch (error) {
      console.error("Error updating validator stage:", error);
      toast.error("An error occurred while updating the validator stage");
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

  // Function to refresh all data
  const refreshAllData = () => {
    refetchValidators();
    refetchContactLogs();
    refetchNotes();
    refetchSubnets();
    refetchAppNotes();
  };

  // Loading state for the whole page
  const isLoading =
    isLoadingValidators || isLoadingSubnets || isLoadingContactLogs || isLoadingNotes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Validator Management</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddValidator}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Validator
          </Button>
          <Button variant="outline" onClick={() => handleAddContactLog()}>
            <Clock className="h-4 w-4 mr-2" />
            Add Contact Log
          </Button>
          <Button variant="outline" onClick={() => handleAddNote()}>
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b">
          <TabsList className="w-full justify-start h-auto">
            <TabsTrigger value="monday-crm" className="py-3">
              <Database className="mr-2 h-4 w-4" />
              CRM Dashboard
            </TabsTrigger>
            <TabsTrigger value="validators-list" className="py-3">
              <Table2 className="mr-2 h-4 w-4" />
              Validators List
            </TabsTrigger>
            <TabsTrigger value="subnets-overview" className="py-3">
              <Users className="mr-2 h-4 w-4" />
              Subnets Overview
            </TabsTrigger>
            <TabsTrigger value="contact-timeline" className="py-3">
              <Clock className="mr-2 h-4 w-4" />
              Contact Timeline
            </TabsTrigger>
            <TabsTrigger value="crm-pipeline" className="py-3">
              <LayoutGrid className="mr-2 h-4 w-4" />
              CRM Pipeline
            </TabsTrigger>
            <TabsTrigger value="notes" className="py-3">
              <StickyNote className="mr-2 h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

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
            />
          )}
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
          <TaoNotesTab validatorNames={validatorNames} />
        </TabsContent>
      </Tabs>

      {/* Validator Form Dialog */}
      <Dialog open={validatorFormOpen} onOpenChange={setValidatorFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedValidator ? "Edit Validator" : "Add New Validator"}
            </DialogTitle>
          </DialogHeader>
          <ValidatorForm
            validator={selectedValidator}
            onSubmit={handleValidatorFormSubmit}
            onCancel={() => setValidatorFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Log Form Dialog */}
      <Dialog open={contactLogFormOpen} onOpenChange={setContactLogFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedContactLog ? "View Contact Log" : "Add Contact Log"}
            </DialogTitle>
          </DialogHeader>
          <ContactLogForm
            validator={selectedValidator}
            subnets={subnets}
            contactLog={selectedContactLog}
            onSubmit={handleContactLogFormSubmit}
            onCancel={() => setContactLogFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Validator Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the validator{" "}
              <strong>{selectedValidator?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteValidator}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ValidatorManagement;
