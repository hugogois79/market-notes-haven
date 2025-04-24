
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server } from "lucide-react";

const NetworkResourcesCard = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Network Resources
        </CardTitle>
        <CardDescription>
          Manage TAO network resources and allocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>CPU Allocation</span>
            <span className="font-medium">85%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <span>Memory Usage</span>
            <span className="font-medium">62%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "62%" }}></div>
          </div>
          
          <div className="pt-4">
            <Button variant="outline" size="sm" className="w-full">
              Resource Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkResourcesCard;
