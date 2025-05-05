
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus,
  Check,
  X,
  CalendarDays
} from "lucide-react";
import { SubnetProject, InvestorMeeting } from "../types";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("13:00");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const resetForm = () => {
    setDate(undefined);
    setTime("13:00");
    setAttendees("");
    setNotes("");
  };
  
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
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Select
                value={time}
                onValueChange={setTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Attendees (comma separated)</label>
            <Input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="e.g. John Doe, Jane Smith"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda items or other notes..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isSubmitting}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingScheduler;
