
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
  project: SubnetProject;
  meetings: InvestorMeeting[];
  onScheduleMeeting: (meeting: Omit<InvestorMeeting, "id">) => Promise<InvestorMeeting>;
}

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  project,
  meetings,
  onScheduleMeeting
}) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("13:00");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  
  const handleSchedule = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    
    const meetingDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    meetingDate.setHours(hours, minutes);
    
    try {
      const formattedAttendees = attendees
        .split(',')
        .map(a => a.trim())
        .filter(a => a);
      
      await onScheduleMeeting({
        projectId: project.id,
        project: project,
        scheduledDate: meetingDate,
        attendees: formattedAttendees,
        status: "scheduled",
        notes: notes
      });
      
      setIsScheduling(false);
      setDate(undefined);
      setTime("13:00");
      setAttendees("");
      setNotes("");
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
    }
  };
  
  const getStatusColor = (status: InvestorMeeting["status"]) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "";
    }
  };
  
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  return (
    <>
      {isScheduling ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Schedule New Meeting</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsScheduling(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                <Button variant="outline" onClick={() => setIsScheduling(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSchedule}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{project.name} Meetings</h2>
            <Button onClick={() => setIsScheduling(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>
          
          {sortedMeetings.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMeetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>
                              {format(new Date(meeting.scheduledDate), "PPP")}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(meeting.scheduledDate), "h:mm a")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>{meeting.attendees.join(", ")}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(meeting.status)}>
                            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {meeting.notes ? (
                            <div className="max-w-xs truncate">{meeting.notes}</div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No notes</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Meetings Scheduled</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule your first meeting with the project team
                </p>
                <Button onClick={() => setIsScheduling(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Meeting Topics</CardTitle>
              <CardDescription>
                Suggested discussion points for your next meeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Technical Architecture Overview</span>
                    <p className="text-sm text-muted-foreground">
                      Deep dive into the technical implementation and architecture
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Validator Network Structure</span>
                    <p className="text-sm text-muted-foreground">
                      Discussion of validator selection criteria and network topology
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Funding Structure and Timeline</span>
                    <p className="text-sm text-muted-foreground">
                      Review funding requirements, tranches, and key milestones
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <span className="font-medium">Risk Mitigation Strategies</span>
                    <p className="text-sm text-muted-foreground">
                      Discuss how the team is addressing identified technical and market risks
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default MeetingScheduler;
