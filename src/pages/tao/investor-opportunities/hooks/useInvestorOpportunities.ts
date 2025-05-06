
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { SubnetProject } from "../types";
import { useInvestorData } from "./useInvestorData";
import { useInvestorMutations } from "./useInvestorMutations";
import { useInvestmentSubscription } from "./useInvestmentSubscription";
import { useOpportunityMatching } from "./useOpportunityMatching";

/**
 * Main hook for investor opportunities functionality
 */
export function useInvestorOpportunities() {
  // State for selected project
  const [selectedProject, setSelectedProject] = useState<SubnetProject | null>(null);
  
  // Get investor data from queries
  const {
    preferences,
    projects,
    investments,
    meetings,
    alerts,
    availableSubnets,
    portfolioAnalytics,
    isLoading: isDataLoading,
    refetchPreferences,
    refetchProjects,
    refetchInvestments,
    refetchMeetings,
    refetchAlerts,
    refetchAnalytics,
    refetchSubnets
  } = useInvestorData();

  // Get opportunity matching functionality
  const {
    selectedPreference,
    setSelectedPreference,
    matchedOpportunities
  } = useOpportunityMatching(preferences);

  // Subscribe to real-time updates
  useInvestmentSubscription(refetchInvestments, refetchAnalytics);

  // Get mutation handlers
  const {
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    isSavingPreference,
    isSavingInvestment,
    isSavingMeeting,
    isMarkingAlertRead
  } = useInvestorMutations({
    refetchPreferences,
    refetchInvestments,
    refetchAnalytics,
    refetchMeetings,
    refetchAlerts
  });

  // Refresh all data
  const refreshAllData = useCallback(() => {
    try {
      refetchPreferences();
      refetchProjects();
      refetchInvestments();
      refetchMeetings();
      refetchAlerts();
      refetchAnalytics();
      refetchSubnets();
      
      toast({
        title: "Success",
        description: "Data refreshed"
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data. Please try again."
      });
    }
  }, [
    refetchPreferences,
    refetchProjects,
    refetchInvestments,
    refetchMeetings,
    refetchAlerts,
    refetchAnalytics,
    refetchSubnets
  ]);
  
  // Get unread alerts count
  const unreadAlertsCount = alerts.filter(alert => !alert.read).length;

  // Combine loading states
  const isLoading = isDataLoading || isSavingInvestment || isSavingMeeting || isMarkingAlertRead;

  const handleSaveInvestmentPreference = async (preference: any) => {
    try {
      const result = await saveInvestmentPreference(preference);
      return result;
    } catch (error) {
      console.error("Error saving investment preference:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save investment preference. Please try again."
      });
      throw error;
    }
  };

  return {
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
    availableSubnets,
    isLoading,
    isSavingPreference,
    saveInvestmentPreference: handleSaveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  };
}
