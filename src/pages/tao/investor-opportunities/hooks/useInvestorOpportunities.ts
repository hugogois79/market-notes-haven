
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
    isLoading,
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
    markAlertRead
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
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  };
}
