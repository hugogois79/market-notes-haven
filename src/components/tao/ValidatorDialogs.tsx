
import React from "react";
import {
  TaoValidator,
  TaoContactLog,
  TaoNote,
  deleteValidator,
} from "@/services/taoValidatorService";
import { TaoSubnet } from "@/services/taoSubnetService";
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
import ValidatorForm from "./ValidatorForm";
import ContactLogForm from "./ContactLogForm";
import NoteForm from "./NoteForm";

interface ValidatorDialogsProps {
  validatorFormOpen: boolean;
  setValidatorFormOpen: (open: boolean) => void;
  contactLogFormOpen: boolean;
  setContactLogFormOpen: (open: boolean) => void;
  noteFormOpen: boolean;
  setNoteFormOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  selectedValidator: TaoValidator | undefined;
  selectedContactLog: TaoContactLog | undefined;
  selectedNote: TaoNote | undefined;
  subnets: TaoSubnet[]; // Changed to use the imported type
  onValidatorFormSubmit: (data: Omit<TaoValidator, "id" | "created_at" | "updated_at">) => Promise<void>;
  onContactLogFormSubmit: (data: Omit<TaoContactLog, "id" | "created_at" | "updated_at">) => Promise<void>;
  onNoteFormSubmit: (data: Omit<TaoNote, "id" | "created_at" | "updated_at">) => Promise<void>;
  refetchValidators: () => void;
}

const ValidatorDialogs: React.FC<ValidatorDialogsProps> = ({
  validatorFormOpen,
  setValidatorFormOpen,
  contactLogFormOpen,
  setContactLogFormOpen,
  noteFormOpen,
  setNoteFormOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  selectedValidator,
  selectedContactLog,
  selectedNote,
  subnets,
  onValidatorFormSubmit,
  onContactLogFormSubmit,
  onNoteFormSubmit,
  refetchValidators,
}) => {
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

  return (
    <>
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
            onSubmit={onValidatorFormSubmit}
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
            onSubmit={onContactLogFormSubmit}
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
    </>
  );
};

export default ValidatorDialogs;
