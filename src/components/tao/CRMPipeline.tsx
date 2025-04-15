
import React from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Mail, MessageCircle, Link2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CRMPipelineProps {
  validators: TaoValidator[];
  onView: (validator: TaoValidator) => void;
  onMoveStage: (validator: TaoValidator, newStage: TaoValidator["crm_stage"]) => void;
}

const CRMPipeline: React.FC<CRMPipelineProps> = ({
  validators,
  onView,
  onMoveStage,
}) => {
  // Define CRM stages in the desired order
  const stages: TaoValidator["crm_stage"][] = [
    "Prospect",
    "Contacted",
    "Follow-up",
    "Negotiation",
    "Active",
    "Inactive",
  ];

  // Group validators by CRM stage
  const validatorsByStage = stages.reduce<Record<string, TaoValidator[]>>(
    (acc, stage) => {
      acc[stage] = validators.filter((v) => v.crm_stage === stage);
      return acc;
    },
    {}
  );

  const getStageColor = (stage: TaoValidator["crm_stage"]) => {
    switch (stage) {
      case "Prospect":
        return "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100";
      case "Contacted":
        return "bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100";
      case "Follow-up":
        return "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100";
      case "Negotiation":
        return "bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100";
      case "Active":
        return "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100";
      case "Inactive":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };

  const getPriorityColor = (priority: TaoValidator["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "Medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getAvailableStages = (
    currentStage: TaoValidator["crm_stage"]
  ): TaoValidator["crm_stage"][] => {
    return stages.filter((stage) => stage !== currentStage);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid grid-cols-6 gap-4" style={{ minWidth: "1200px" }}>
        {stages.map((stage) => (
          <div key={stage} className="flex flex-col h-full">
            <div className={`px-3 py-2 rounded-t-md ${getStageColor(stage)}`}>
              <h3 className="font-medium">{stage}</h3>
              <div className="text-xs mt-1">
                {validatorsByStage[stage]?.length || 0} validators
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-b-md p-2 min-h-[calc(100vh-320px)]">
              <div className="space-y-2">
                {validatorsByStage[stage]?.map((validator) => (
                  <Card key={validator.id} className="shadow-sm">
                    <CardHeader className="p-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{validator.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="-mr-2 h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(validator)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Add Contact Log
                            </DropdownMenuItem>
                            <DropdownMenuContent className="w-52">
                              {getAvailableStages(validator.crm_stage).map(
                                (newStage) => (
                                  <DropdownMenuItem
                                    key={newStage}
                                    onClick={() => onMoveStage(validator, newStage)}
                                  >
                                    Move to {newStage}
                                  </DropdownMenuItem>
                                )
                              )}
                            </DropdownMenuContent>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex justify-between items-center mb-2">
                        <Badge
                          className={`${getPriorityColor(
                            validator.priority
                          )} border-0`}
                        >
                          {validator.priority}
                        </Badge>
                        <div className="flex space-x-1">
                          {validator.email && (
                            <a
                              href={`mailto:${validator.email}`}
                              className="text-blue-600 hover:text-blue-800"
                              title={validator.email}
                            >
                              <Mail size={14} />
                            </a>
                          )}
                          {validator.telegram && (
                            <a
                              href={`https://t.me/${validator.telegram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title={validator.telegram}
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                          {validator.linkedin && (
                            <a
                              href={`https://linkedin.com/in/${validator.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title={`linkedin.com/in/${validator.linkedin}`}
                            >
                              <Link2 size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {validatorsByStage[stage]?.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No validators
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRMPipeline;
