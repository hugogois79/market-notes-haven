
import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

interface MeetingDialogActionsProps {
  onCancel: () => void;
  onSchedule: () => void;
  isSubmitting: boolean;
}

const MeetingDialogActions: React.FC<MeetingDialogActionsProps> = ({
  onCancel,
  onSchedule,
  isSubmitting,
}) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSchedule} disabled={isSubmitting}>
        <CalendarDays className="mr-2 h-4 w-4" />
        {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
      </Button>
    </div>
  );
};

export default MeetingDialogActions;
