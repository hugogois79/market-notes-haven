
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ValidatorManagement from "@/components/tao/ValidatorManagement";

const TAOValidatorManagement: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Validator Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ValidatorManagement initialTab="monday-crm" initialView="kanban" />
        </CardContent>
      </Card>
    </div>
  );
};

export default TAOValidatorManagement;
