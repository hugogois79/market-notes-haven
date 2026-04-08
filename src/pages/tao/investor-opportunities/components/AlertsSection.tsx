
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Check, 
  Zap, 
  Calendar, 
  TrendingUp, 
  DollarSign
} from "lucide-react";
import { InvestorAlert } from "../types";

interface AlertsSectionProps {
  alerts: InvestorAlert[];
  unreadCount: number;
  onMarkRead: (alertId: string) => Promise<void>;
  onSelectProject: (projectId: string) => void;
  className?: string;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  unreadCount,
  onMarkRead,
  onSelectProject,
  className
}) => {
  const getAlertIcon = (type: InvestorAlert["type"]) => {
    switch (type) {
      case "new_opportunity": return <Zap className="h-4 w-4 text-amber-500" />;
      case "milestone": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "funding_update": return <DollarSign className="h-4 w-4 text-green-500" />;
      case "performance": return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getAlertTitle = (type: InvestorAlert["type"]) => {
    switch (type) {
      case "new_opportunity": return "New Opportunity";
      case "milestone": return "Project Milestone";
      case "funding_update": return "Funding Update";
      case "performance": return "Performance Alert";
      default: return "Alert";
    }
  };
  
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Sort by unread first, then by date
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Alerts & Notifications</CardTitle>
          <Badge variant="outline">
            {unreadCount} unread
          </Badge>
        </div>
        <CardDescription>
          Stay updated on investment opportunities and project milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAlerts.length > 0 ? (
            sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start p-3 rounded-lg border ${
                  alert.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <div className="mr-3 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-medium">
                      {getAlertTitle(alert.type)}
                    </div>
                    {!alert.read && (
                      <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p 
                    className="text-sm mt-1 cursor-pointer hover:text-blue-500"
                    onClick={() => alert.projectId && onSelectProject(alert.projectId)}
                  >
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.date).toLocaleDateString()} at {new Date(alert.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!alert.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onMarkRead(alert.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No alerts at this time</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsSection;
