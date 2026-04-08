
import React, { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useInvestorOpportunities } from "./hooks/useInvestorOpportunities";
import { SubnetProject, Investment } from "./types";
import { toast } from "@/components/ui/use-toast";
import InvestorOpportunitiesHeader from "./components/InvestorOpportunitiesHeader";
import OpportunitiesTabContent from "./components/OpportunitiesTabContent";
import PortfolioManagementDashboard from "./components/PortfolioManagementDashboard";
import InvestorDialogs from "./components/InvestorDialogs";
import { useInvestmentActions } from "./components/InvestmentActions";

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
    isSavingPreference,
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  } = useInvestorOpportunities();

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

  const { 
    handleProjectSelect, 
    handleBackToList,
    handleSaveInvestment,
    handleSaveMeeting,
    handleAddMeeting
  } = useInvestmentActions({
    onAddInvestment: handleAddInvestment,
    onEditInvestment: handleEditInvestment,
    onAddMeeting: (project) => {
      if (project) {
        setSelectedProject(project);
      }
      setIsSchedulerOpen(true);
      // Return a promise to match the expected type
      return Promise.resolve(null);
    },
    saveInvestment: async (investment) => {
      try {
        const result = await saveInvestment(investment);
        setIsInvestmentDialogOpen(false);
        toast({
          title: "Success",
          description: `Investment ${investment.id ? "updated" : "added"} successfully`
        });
        return result;
      } catch (error) {
        console.error("Failed to save investment:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save investment. Please try again."
        });
        throw error;
      }
    },
    saveMeeting
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <InvestorOpportunitiesHeader 
        isLoading={isLoading}
        onRefresh={refreshAllData}
      />

      <Tabs defaultValue="opportunities" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opportunities" className="space-y-6">
          <OpportunitiesTabContent
            selectedProject={selectedProject}
            matchedOpportunities={matchedOpportunities}
            alerts={alerts}
            unreadAlertsCount={unreadAlertsCount}
            preferences={preferences}
            selectedPreference={selectedPreference}
            availableSubnets={availableSubnets}
            isLoading={isLoading}
            isSavingPreference={isSavingPreference}
            onBackToList={() => handleBackToList(setSelectedProject)}
            onSelectProject={(project) => handleProjectSelect(project, setSelectedProject)}
            onSelectPreference={setSelectedPreference}
            onSavePreference={saveInvestmentPreference}
            onAddInvestment={handleAddInvestment}
            onScheduleMeeting={handleAddMeeting}
            onMarkAlertRead={markAlertRead}
          />
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

      <InvestorDialogs
        isInvestmentDialogOpen={isInvestmentDialogOpen}
        setIsInvestmentDialogOpen={setIsInvestmentDialogOpen}
        editingInvestment={editingInvestment}
        selectedProject={selectedProject}
        matchedOpportunities={matchedOpportunities}
        onSaveInvestment={handleSaveInvestment}
        isSchedulerOpen={isSchedulerOpen}
        setIsSchedulerOpen={setIsSchedulerOpen}
        meetings={meetings}
        onSaveMeeting={handleSaveMeeting}
      />
    </div>
  );
};

export default InvestorOpportunitiesPage;
