
import React from "react";
import { TaoContactLog } from "@/services/taoValidatorService";
import {
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  Video,
  MessageSquare,
  UserRound,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface ContactTimelineProps {
  contactLogs: TaoContactLog[];
  validatorNames: Record<string, string>;
  subnetNames: Record<number, string>;
  onViewLog: (log: TaoContactLog) => void;
}

const ContactTimeline: React.FC<ContactTimelineProps> = ({
  contactLogs,
  validatorNames,
  subnetNames,
  onViewLog,
}) => {
  const getMethodIcon = (method: TaoContactLog["method"]) => {
    switch (method) {
      case "Email":
        return <Mail className="h-4 w-4" />;
      case "Telegram":
        return <MessageCircle className="h-4 w-4" />;
      case "Call":
        return <Phone className="h-4 w-4" />;
      case "DM":
        return <MessageSquare className="h-4 w-4" />;
      case "Zoom":
        return <Video className="h-4 w-4" />;
      case "In Person":
        return <UserRound className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {contactLogs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-1">No Contact Logs</h3>
          <p className="text-muted-foreground">
            There are no contact logs to display.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          {contactLogs.map((log) => (
            <div
              key={log.id}
              className="relative pl-10 pb-6"
            >
              <div className="absolute left-0 top-3 rounded-full w-8 h-8 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {getMethodIcon(log.method)}
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(log.contact_date), "PPP")}
                    </div>
                    <h4 className="font-medium mb-1">
                      {validatorNames[log.validator_id] || "Unknown Validator"}
                      {log.subnet_id && (
                        <span className="text-muted-foreground ml-2">
                          · {subnetNames[log.subnet_id] || `Subnet ${log.subnet_id}`}
                        </span>
                      )}
                    </h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewLog(log)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2">
                  {log.summary && (
                    <p className="text-sm mb-2">{log.summary}</p>
                  )}
                  {log.next_steps && (
                    <p className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded border-l-2 border-blue-500">
                      <strong>Next Steps:</strong> {log.next_steps}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactTimeline;
