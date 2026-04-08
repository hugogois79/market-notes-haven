
import React from "react";
import MeetingDatePicker from "./MeetingDatePicker";
import MeetingTimeSelector from "./MeetingTimeSelector";
import MeetingAttendeesInput from "./MeetingAttendeesInput";
import MeetingNotesInput from "./MeetingNotesInput";
import MeetingDialogActions from "./MeetingDialogActions";

interface MeetingFormContentProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  time: string;
  onTimeChange: (value: string) => void;
  attendees: string;
  onAttendeesChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onSchedule: () => void;
  isSubmitting: boolean;
}

const MeetingFormContent: React.FC<MeetingFormContentProps> = ({
  date,
  onDateChange,
  time,
  onTimeChange,
  attendees,
  onAttendeesChange,
  notes,
  onNotesChange,
  onCancel,
  onSchedule,
  isSubmitting
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MeetingDatePicker date={date} onDateChange={onDateChange} />
        <MeetingTimeSelector time={time} onTimeChange={onTimeChange} />
      </div>
      
      <MeetingAttendeesInput 
        attendees={attendees} 
        onAttendeesChange={onAttendeesChange} 
      />
      
      <MeetingNotesInput 
        notes={notes} 
        onNotesChange={onNotesChange} 
      />
      
      <MeetingDialogActions 
        onCancel={onCancel} 
        onSchedule={onSchedule} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
};

export default MeetingFormContent;
