
import { TaoValidator } from "@/services/taoValidatorService";

// Define the CRM stages in the order they should appear
export const crmStages: TaoValidator["crm_stage"][] = [
  "Prospect",
  "Contacted",
  "Follow-up",
  "Negotiation",
  "Active",
  "Inactive"
];

// Get the color for each stage
export const getStageColor = (stage: TaoValidator["crm_stage"]): string => {
  switch (stage) {
    case "Prospect":
      return "bg-blue-500";
    case "Contacted":
      return "bg-purple-500";
    case "Follow-up":
      return "bg-yellow-500";
    case "Negotiation":
      return "bg-orange-500";
    case "Active":
      return "bg-green-500";
    case "Inactive":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
};

// Get the color for each priority level
export const getPriorityColor = (priority: TaoValidator["priority"]): string => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "Medium":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "Low":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

// Get the available stages that a validator can be moved to from the current stage
export const getAvailableStages = (currentStage: TaoValidator["crm_stage"]): TaoValidator["crm_stage"][] => {
  return crmStages.filter(stage => stage !== currentStage);
};

// Group validators by their CRM stage
export const groupValidatorsByStage = (
  validators: TaoValidator[]
): Record<TaoValidator["crm_stage"], TaoValidator[]> => {
  return validators.reduce((acc, validator) => {
    if (!acc[validator.crm_stage]) {
      acc[validator.crm_stage] = [];
    }
    acc[validator.crm_stage].push(validator);
    return acc;
  }, {} as Record<TaoValidator["crm_stage"], TaoValidator[]>);
};
