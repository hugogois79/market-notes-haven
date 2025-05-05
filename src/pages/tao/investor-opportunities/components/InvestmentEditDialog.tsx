
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Investment, SubnetProject } from "../types";
import InvestmentForm from "./InvestmentForm";

interface InvestmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment;
  project: SubnetProject;
  onSave: (investment: Partial<Investment>) => Promise<Investment>;
}

const InvestmentEditDialog: React.FC<InvestmentEditDialogProps> = ({
  open,
  onOpenChange,
  investment,
  project,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Format the date value
      const dateObj = new Date(values.date);
      
      // Construct investment object with all fields
      const updatedInvestment: Partial<Investment> = {
        ...investment,
        projectId: project.id,
        amount: values.amount,
        date: dateObj,
        status: values.status,
        notes: values.notes,
      };
      
      await onSave(updatedInvestment);
      onOpenChange(false);
      toast.success(`Investment ${investment ? "updated" : "added"} successfully`);
    } catch (error) {
      console.error("Error saving investment:", error);
      toast.error(`Failed to ${investment ? "update" : "add"} investment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <InvestmentForm
          investment={investment}
          project={project}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentEditDialog;
