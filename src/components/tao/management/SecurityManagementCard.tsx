
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const SecurityManagementCard = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Management
        </CardTitle>
        <CardDescription>
          Manage network security and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Security Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Secure
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Last Security Scan</span>
            <span className="text-sm text-muted-foreground">Today, 09:45 AM</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Vulnerabilities</span>
            <span className="text-sm font-medium">None detected</span>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Security Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityManagementCard;
