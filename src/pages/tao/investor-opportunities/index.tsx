
import React, { useState } from "react";
import { useInvestorOpportunities } from "./hooks/useInvestorOpportunities";
import InvestmentProfileManager from "./components/InvestmentProfileManager";
import OpportunityMatchingEngine from "./components/OpportunityMatchingEngine";
import PortfolioManagementDashboard from "./components/PortfolioManagementDashboard";
import AlertsSection from "./components/AlertsSection";
import ProjectDetailView from "./components/ProjectDetailView";
import { SubnetProject } from "./types";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Bell,
  ChevronRight
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const InvestorOpportunitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("opportunities");
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  
  const {
    preferences,
    selectedPreference,
    setSelectedPreference,
    projects,
    investments,
    meetings,
    alerts,
    unreadAlertsCount,
    matchedOpportunities,
    portfolioAnalytics,
    selectedProject,
    setSelectedProject,
    isLoading,
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  } = useInvestorOpportunities();

  const handleSelectProject = (project: SubnetProject) => {
    setSelectedProject(project);
    setProjectDetailOpen(true);
  };

  const handleCloseProjectDetail = () => {
    setProjectDetailOpen(false);
  };

  // Find match data for the selected project
  const selectedProjectMatchData = matchedOpportunities.find(
    match => match.project.id === selectedProject?.id
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investor Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Manage investment profiles, discover opportunities, and track performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="opportunities" className="flex-1">Opportunities</TabsTrigger>
          <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <InvestmentProfileManager
                preferences={preferences}
                selectedPreference={selectedPreference}
                onSelectPreference={setSelectedPreference}
                onSavePreference={saveInvestmentPreference}
                isLoading={isLoading}
              />
            </div>
            <div className="md:col-span-1">
              <AlertsSection
                alerts={alerts}
                onMarkAsRead={markAlertRead}
                className="h-full"
              />
            </div>
          </div>
          
          <OpportunityMatchingEngine
            matchedOpportunities={matchedOpportunities}
            isLoading={isLoading}
            onSelectProject={handleSelectProject}
          />
        </TabsContent>
        
        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioManagementDashboard
            investments={investments}
            portfolioAnalytics={portfolioAnalytics}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
      
      <Dialog open={projectDetailOpen} onOpenChange={setProjectDetailOpen}>
        <DialogContent className="max-w-4xl">
          {selectedProject && (
            <ProjectDetailView
              project={selectedProject}
              matchData={selectedProjectMatchData}
              meetings={meetings.filter(m => m.projectId === selectedProject.id)}
              onScheduleMeeting={saveMeeting}
              onClose={handleCloseProjectDetail}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestorOpportunitiesPage;
