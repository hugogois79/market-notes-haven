
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const ConfigurationCard = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configuration
        </CardTitle>
        <CardDescription>
          Network configuration and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Network Version</span>
            <span className="font-medium">v3.4.2</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Last Updated</span>
            <span className="text-sm text-muted-foreground">2 days ago</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Update Available</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              v3.5.0
            </span>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Update Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationCard;
