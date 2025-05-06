
import React from "react";
import { SubnetProject, Investment, InvestorMeeting } from "../types";

interface InvestmentActionsProps {
  onAddInvestment: (project?: SubnetProject) => void;
  onEditInvestment: (investment: Investment) => void;
  onAddMeeting: (project?: SubnetProject) => Promise<any>;
  saveInvestment: (investment: Partial<Investment>) => Promise<Investment>;
  saveMeeting: (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting) => Promise<InvestorMeeting>;
}

export const useInvestmentActions = ({
  onAddInvestment,
  onEditInvestment,
  onAddMeeting,
  saveInvestment,
  saveMeeting
}: InvestmentActionsProps) => {
  const handleProjectSelect = (project: SubnetProject, setSelectedProject: (project: SubnetProject) => void) => {
    setSelectedProject(project);
  };

  const handleBackToList = (setSelectedProject: (project: null) => void) => {
    setSelectedProject(null);
  };

  const handleAddInvestment = (project?: SubnetProject) => {
    onAddInvestment(project);
  };

  const handleEditInvestment = (investment: Investment) => {
    onEditInvestment(investment);
  };

  const handleAddMeeting = (project?: SubnetProject) => {
    return onAddMeeting(project);
  };

  // Properly handle investment saving with error handling
  const handleSaveInvestment = async (investment: Partial<Investment>) => {
    try {
      const result = await saveInvestment(investment);
      return result;
    } catch (error) {
      console.error("Failed to save investment:", error);
      throw error;
    }
  };

  // Fix the handleSaveMeeting function to explicitly return the Promise
  const handleSaveMeeting = (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting): Promise<InvestorMeeting> => {
    return saveMeeting(meeting);
  };

  return {
    handleProjectSelect,
    handleBackToList,
    handleAddInvestment,
    handleEditInvestment,
    handleAddMeeting,
    handleSaveInvestment,
    handleSaveMeeting
  };
};
