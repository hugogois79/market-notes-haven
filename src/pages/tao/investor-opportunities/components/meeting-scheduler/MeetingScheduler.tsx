
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { SubnetProject, InvestorMeeting } from "../../types";
import { useMeetingScheduler } from "./useMeetingScheduler";
import MeetingFormContent from "./MeetingFormContent";

interface MeetingSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: SubnetProject | null;
  meetings?: InvestorMeeting[];
  onSave: (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting) => Promise<InvestorMeeting>;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  open,
  onOpenChange,
  project,
  onSave
}) => {
  const {
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
  } = useMeetingScheduler({
    project,
    onOpenChange,
    onSave
  });
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {project ? `Schedule Meeting: ${project.name}` : 'Schedule Meeting'}
          </DialogTitle>
        </DialogHeader>
        
        <MeetingFormContent
          date={date}
          onDateChange={setDate}
          time={time}
          onTimeChange={setTime}
          attendees={attendees}
          onAttendeesChange={setAttendees}
          notes={notes}
          onNotesChange={setNotes}
          onCancel={() => onOpenChange(false)}
          onSchedule={handleSchedule}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MeetingScheduler;
