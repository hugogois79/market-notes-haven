
import React from "react";
import { SubnetProject, OpportunityMatch, InvestorAlert } from "../types";
import InvestmentProfileManager from "./InvestmentProfileManager";
import OpportunityMatchingEngine from "./OpportunityMatchingEngine";
import ProjectDetailView from "./ProjectDetailView";
import AlertsSection from "./AlertsSection";

interface OpportunitiesTabContentProps {
  selectedProject: SubnetProject | null;
  matchedOpportunities: OpportunityMatch[];
  alerts: InvestorAlert[];
  unreadAlertsCount: number;
  preferences: any[];
  selectedPreference: any;
  availableSubnets: any[];
  isLoading: boolean;
  onBackToList: () => void;
  onSelectProject: (project: SubnetProject) => void;
  onSelectPreference: (preference: any) => void;
  onSavePreference: (preference: any) => Promise<any>;
  onAddInvestment: (project?: SubnetProject) => void;
  onScheduleMeeting: (project?: SubnetProject) => void;
  onMarkAlertRead: (alertId: string) => Promise<void>;
}

const OpportunitiesTabContent: React.FC<OpportunitiesTabContentProps> = ({
  selectedProject,
  matchedOpportunities,
  alerts,
  unreadAlertsCount,
  preferences,
  selectedPreference,
  availableSubnets,
  isLoading,
  onBackToList,
  onSelectProject,
  onSelectPreference,
  onSavePreference,
  onAddInvestment,
  onScheduleMeeting,
  onMarkAlertRead
}) => {
  if (selectedProject) {
    return (
      <ProjectDetailView 
        project={selectedProject}
        onBackToList={onBackToList}
        onAddInvestment={() => onAddInvestment(selectedProject)}
        onScheduleMeeting={() => onScheduleMeeting(selectedProject)}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-3">
          <InvestmentProfileManager 
            preferences={preferences}
            selectedPreference={selectedPreference}
            onSelectPreference={onSelectPreference}
            onSavePreference={onSavePreference}
            isLoading={isLoading}
            availableSubnets={availableSubnets}
          />
        </div>
        <div className="col-span-1">
          <AlertsSection 
            alerts={alerts}
            unreadCount={unreadAlertsCount}
            onMarkRead={onMarkAlertRead}
            onSelectProject={(projectId) => {
              const project = matchedOpportunities.find(m => m.project.id === projectId)?.project;
              if (project) {
                onSelectProject(project);
              }
            }}
          />
        </div>
      </div>
      
      <OpportunityMatchingEngine 
        matchedOpportunities={matchedOpportunities}
        isLoading={isLoading}
        onSelectProject={onSelectProject}
      />
    </>
  );
};

export default OpportunitiesTabContent;
