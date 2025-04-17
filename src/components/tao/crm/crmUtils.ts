
import { TaoValidator } from "@/services/taoValidatorService";

// Define CRM stages in the desired order
export const crmStages: TaoValidator["crm_stage"][] = [
  "Prospect",
  "Contacted",
  "Follow-up",
  "Negotiation",
  "Active",
  "Inactive",
];

// Helper function to get stage color
export const getStageColor = (stage: TaoValidator["crm_stage"]) => {
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

// Helper function to get priority color
export const getPriorityColor = (priority: TaoValidator["priority"]) => {
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

// Helper function to get available stages for a validator
export const getAvailableStages = (
  currentStage: TaoValidator["crm_stage"]
): TaoValidator["crm_stage"][] => {
  return crmStages.filter((stage) => stage !== currentStage);
};

// Helper function to group validators by CRM stage
export const groupValidatorsByStage = (validators: TaoValidator[]) => {
  return crmStages.reduce<Record<string, TaoValidator[]>>(
    (acc, stage) => {
      acc[stage] = validators.filter((v) => v.crm_stage === stage);
      return acc;
    },
    {}
  );
};
