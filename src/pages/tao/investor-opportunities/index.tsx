
import React, { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useInvestorOpportunities } from "./hooks/useInvestorOpportunities";
import InvestmentProfileManager from "./components/InvestmentProfileManager";
import OpportunityMatchingEngine from "./components/OpportunityMatchingEngine";
import ProjectDetailView from "./components/ProjectDetailView";
import PortfolioManagementDashboard from "./components/PortfolioManagementDashboard";
import AlertsSection from "./components/AlertsSection";
import InvestmentEditDialog from "./components/InvestmentEditDialog";
import MeetingScheduler from "./components/MeetingScheduler";
import { SubnetProject, Investment, InvestorMeeting } from "./types";

const InvestorOpportunitiesPage = () => {
  const [activeTab, setActiveTab] = useState("opportunities");
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  
  const { 
    preferences, 
    selectedPreference, 
    setSelectedPreference,
    matchedOpportunities,
    selectedProject,
    setSelectedProject,
    investments,
    meetings,
    alerts,
    unreadAlertsCount,
    availableSubnets,
    isLoading,
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  } = useInvestorOpportunities();

  const handleProjectSelect = (project: SubnetProject) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
  };

  const handleAddInvestment = (project?: SubnetProject) => {
    setEditingInvestment(project ? {
      id: "",
      projectId: project.id,
      amount: 0,
      date: new Date(),
      status: "pending",
      notes: ""
    } : null);
    setIsInvestmentDialogOpen(true);
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsInvestmentDialogOpen(true);
  };

  const handleAddMeeting = (project?: SubnetProject) => {
    if (project) {
      setSelectedProject(project);
    }
    setIsSchedulerOpen(true);
  };

  // Update the handleSaveMeeting function to explicitly return the Promise
  const handleSaveMeeting = async (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting): Promise<InvestorMeeting> => {
    return await saveMeeting(meeting);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investor Opportunities</h1>
          <p className="text-muted-foreground">
            Manage investment profiles, discover opportunities, and track performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAllData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="opportunities" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opportunities" className="space-y-6">
          {selectedProject ? (
            <ProjectDetailView 
              project={selectedProject}
              onBackToList={handleBackToList}
              onAddInvestment={() => handleAddInvestment(selectedProject)}
              onScheduleMeeting={() => handleAddMeeting(selectedProject)}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-3">
                  <InvestmentProfileManager 
                    preferences={preferences}
                    selectedPreference={selectedPreference}
                    onSelectPreference={setSelectedPreference}
                    onSavePreference={saveInvestmentPreference}
                    isLoading={isLoading}
                    availableSubnets={availableSubnets}
                  />
                </div>
                <div className="col-span-1">
                  <AlertsSection 
                    alerts={alerts}
                    unreadCount={unreadAlertsCount}
                    onMarkRead={markAlertRead}
                    onSelectProject={(projectId) => {
                      const project = matchedOpportunities.find(m => m.project.id === projectId)?.project;
                      if (project) {
                        handleProjectSelect(project);
                      }
                    }}
                  />
                </div>
              </div>
              
              <OpportunityMatchingEngine 
                matchedOpportunities={matchedOpportunities}
                isLoading={isLoading}
                onSelectProject={handleProjectSelect}
              />
            </>
          )}
        </TabsContent>
        
        <TabsContent value="portfolio">
          <PortfolioManagementDashboard 
            investments={investments}
            meetings={meetings}
            projects={matchedOpportunities.map(match => match.project)}
            onEditInvestment={handleEditInvestment}
            onAddInvestment={handleAddInvestment}
            onScheduleMeeting={handleAddMeeting}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <InvestmentEditDialog 
        open={isInvestmentDialogOpen}
        onOpenChange={setIsInvestmentDialogOpen}
        investment={editingInvestment}
        project={selectedProject}
        projects={matchedOpportunities.map(match => match.project)}
        onSave={saveInvestment}
      />

      <MeetingScheduler 
        open={isSchedulerOpen}
        onOpenChange={setIsSchedulerOpen}
        project={selectedProject}
        meetings={meetings}
        onSave={handleSaveMeeting}
      />
    </div>
  );
};

export default InvestorOpportunitiesPage;
