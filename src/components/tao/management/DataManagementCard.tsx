
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

const DataManagementCard = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          TAO Data Management
        </CardTitle>
        <CardDescription>
          Manage network data and storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Total Storage</span>
            <span className="font-medium">1.2 TB</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Used Storage</span>
            <span className="font-medium">765 GB</span>
          </div>
          
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "64%" }}></div>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Storage Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagementCard;
