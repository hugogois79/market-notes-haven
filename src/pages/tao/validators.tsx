
import React from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ValidatorManagement from "@/components/tao/ValidatorManagement";

const TAOValidatorManagement: React.FC = () => {
  const location = useLocation();
  
  // Get the initial state parameters if they exist
  const initialTab = location.state?.initialTab || "monday-crm";
  const initialView = location.state?.initialView || "main";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Validator Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ValidatorManagement initialTab={initialTab} initialView={initialView} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TAOValidatorManagement;
