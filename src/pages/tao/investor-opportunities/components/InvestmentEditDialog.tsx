
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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Submitting investment values:", values);
      
      // Format the date value
      const dateObj = new Date(values.date);
      
      // Construct investment object with all fields
      const updatedInvestment: Partial<Investment> = {
        ...investment,
        projectId: project.id,
        amount: parseFloat(values.amount),
        date: dateObj,
        status: values.status as "committed" | "pending" | "deployed" | "exited",
        notes: values.notes,
      };
      
      console.log("Processed investment data:", updatedInvestment);
      
      const result = await onSave(updatedInvestment);
      console.log("Save result:", result);
      
      onOpenChange(false);
      toast.success(`Investment ${investment ? "updated" : "added"} successfully`);
    } catch (error) {
      console.error("Error saving investment:", error);
      setError(`Failed to ${investment ? "update" : "add"} investment. Please try again.`);
      toast.error(`Failed to ${investment ? "update" : "add"} investment`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
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
