
import React from "react";
import { SubnetProject, Investment, InvestorMeeting } from "../types";
import InvestmentEditDialog from "./InvestmentEditDialog";
import MeetingScheduler from "./meeting-scheduler";

interface InvestorDialogsProps {
  isInvestmentDialogOpen: boolean;
  setIsInvestmentDialogOpen: (open: boolean) => void;
  editingInvestment: Investment | null;
  selectedProject: SubnetProject | null;
  matchedOpportunities: { project: SubnetProject }[];
  onSaveInvestment: (investment: Partial<Investment>) => Promise<Investment>;
  isSchedulerOpen: boolean;
  setIsSchedulerOpen: (open: boolean) => void;
  meetings: InvestorMeeting[];
  onSaveMeeting: (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting) => Promise<InvestorMeeting>;
}

const InvestorDialogs: React.FC<InvestorDialogsProps> = ({
  isInvestmentDialogOpen,
  setIsInvestmentDialogOpen,
  editingInvestment,
  selectedProject,
  matchedOpportunities,
  onSaveInvestment,
  isSchedulerOpen,
  setIsSchedulerOpen,
  meetings,
  onSaveMeeting
}) => {
  return (
    <>
      <InvestmentEditDialog 
        open={isInvestmentDialogOpen}
        onOpenChange={setIsInvestmentDialogOpen}
        investment={editingInvestment}
        project={selectedProject}
        projects={matchedOpportunities.map(match => match.project)}
        onSave={onSaveInvestment}
      />

      <MeetingScheduler 
        open={isSchedulerOpen}
        onOpenChange={setIsSchedulerOpen}
        project={selectedProject}
        meetings={meetings}
        onSave={onSaveMeeting}
      />
    </>
  );
};

export default InvestorDialogs;
