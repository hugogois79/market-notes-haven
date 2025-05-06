
import { useState } from "react";
import { toast } from "sonner";
import { SubnetProject, InvestorMeeting } from "../../types";

interface UseMeetingSchedulerProps {
  project: SubnetProject | null;
  onOpenChange: (open: boolean) => void;
  onSave: (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting) => Promise<InvestorMeeting>;
}

export const useMeetingScheduler = ({
  project,
  onOpenChange,
  onSave
}: UseMeetingSchedulerProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("13:00");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const resetForm = () => {
    setDate(undefined);
    setTime("13:00");
    setAttendees("");
    setNotes("");
  };

  const handleSchedule = async () => {
    if (!project) {
      toast.error("No project selected");
      return;
    }
    
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const meetingDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      meetingDate.setHours(hours, minutes);
      
      const formattedAttendees = attendees
        .split(',')
        .map(a => a.trim())
        .filter(a => a);
      
      await onSave({
        projectId: project.id,
        scheduledDate: meetingDate,
        attendees: formattedAttendees,
        status: "scheduled",
        notes: notes
      });
      
      onOpenChange(false);
      resetForm();
      toast.success("Meeting scheduled successfully");
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    date,
    setDate,
    time,
    setTime,
    attendees,
    setAttendees,
    notes,
    setNotes,
    isSubmitting,
    resetForm,
    handleSchedule
  };
};
