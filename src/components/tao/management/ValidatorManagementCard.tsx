
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, KanbanSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ValidatorManagementCard = () => {
  const navigate = useNavigate();

  const handleManageValidators = () => {
    navigate("/tao/validators");
  };

  const handleGoToKanban = () => {
    navigate("/tao/validators", { state: { initialTab: "monday-crm", initialView: "kanban" } });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Validator Management
        </CardTitle>
        <CardDescription>
          Manage validator access and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Active Validators</span>
            <span className="font-medium">124</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Pending Approval</span>
            <span className="font-medium text-amber-600">7</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Access Requests</span>
            <span className="font-medium text-blue-600">3</span>
          </div>
          
          <div className="pt-2 space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={handleManageValidators}>
              Manage Validators
            </Button>
            <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2" onClick={handleGoToKanban}>
              <KanbanSquare className="h-4 w-4" />
              CRM Kanban Board
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidatorManagementCard;
