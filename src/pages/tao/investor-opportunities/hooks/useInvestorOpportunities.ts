
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchInvestmentPreferences,
  updateInvestmentPreference,
  fetchSubnetProjects,
  fetchInvestments,
  fetchMeetings,
  fetchAlerts,
  generateOpportunityMatches,
  generatePortfolioAnalytics,
  markAlertAsRead,
  scheduleMeeting,
  updateMeeting,
  addInvestment,
  updateInvestment
} from "../services/investorOpportunityService";
import {
  InvestmentPreference,
  SubnetProject,
  Investment,
  InvestorMeeting,
  InvestorAlert,
  OpportunityMatch
} from "../types";
import { supabase } from "@/integrations/supabase/client";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { adaptArrayToSubnetTypes } from "@/utils/subnetTypeAdapter";

export function useInvestorOpportunities() {
  const [selectedPreference, setSelectedPreference] = useState<InvestmentPreference | null>(null);
  const [matchedOpportunities, setMatchedOpportunities] = useState<OpportunityMatch[]>([]);
  const [selectedProject, setSelectedProject] = useState<SubnetProject | null>(null);

  // Fetch investment preferences
  const {
    data: preferences = [],
    isLoading: isLoadingPreferences,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: ["investment-preferences"],
    queryFn: fetchInvestmentPreferences
  });

  // Fetch subnet projects
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ["subnet-projects"],
    queryFn: fetchSubnetProjects
  });

  // Fetch investments
  const {
    data: investments = [],
    isLoading: isLoadingInvestments,
    refetch: refetchInvestments
  } = useQuery({
    queryKey: ["investments"],
    queryFn: fetchInvestments
  });

  // Fetch meetings
  const {
    data: meetings = [],
    isLoading: isLoadingMeetings,
    refetch: refetchMeetings
  } = useQuery({
    queryKey: ["investor-meetings"],
    queryFn: fetchMeetings
  });

  // Fetch alerts
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useQuery({
    queryKey: ["investor-alerts"],
    queryFn: fetchAlerts
  });

  // Fetch available subnets
  const {
    data: availableSubnets = [],
    isLoading: isLoadingSubnets,
    refetch: refetchSubnets
  } = useQuery({
    queryKey: ["tao-subnets"],
    queryFn: fetchTaoSubnets
  });

  // Generate portfolio analytics
  const {
    data: portfolioAnalytics,
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ["portfolio-analytics"],
    queryFn: generatePortfolioAnalytics
  });

  // Update preference and generate matches whenever selected preference changes
  useEffect(() => {
    const generateMatches = async () => {
      if (selectedPreference) {
        try {
          const matches = await generateOpportunityMatches(selectedPreference);
          setMatchedOpportunities(matches);
        } catch (error) {
          console.error("Error generating matches:", error);
          toast.error("Failed to generate opportunity matches");
        }
      } else {
        setMatchedOpportunities([]);
      }
    };

    generateMatches();
  }, [selectedPreference]);

  // Set the first preference as default if none selected and preferences are loaded
  useEffect(() => {
    if (!selectedPreference && preferences.length > 0) {
      setSelectedPreference(preferences[0]);
    }
  }, [preferences, selectedPreference]);

  // Listen for real-time updates to investments
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        () => {
          // Refetch investments when they change
          refetchInvestments();
          refetchAnalytics();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchInvestments, refetchAnalytics]);

  // Save investment preference
  const saveInvestmentPreference = useCallback(async (preference: InvestmentPreference) => {
    try {
      const updatedPreference = await updateInvestmentPreference(preference);
      toast.success("Investment preference saved successfully");
      refetchPreferences();
      return updatedPreference;
    } catch (error) {
      console.error("Error saving investment preference:", error);
      toast.error("Failed to save investment preference");
      throw error;
    }
  }, [refetchPreferences]);

  // Add/update investment
  const saveInvestment = useCallback(async (investment: Partial<Investment>) => {
    try {
      let result;
      if ("id" in investment && investment.id) {
        console.log("Updating existing investment:", investment);
        result = await updateInvestment(investment as Investment);
        toast.success("Investment updated successfully");
      } else {
        console.log("Adding new investment:", investment);
        result = await addInvestment(investment as Omit<Investment, "id">);
        toast.success("Investment added successfully");
      }
      refetchInvestments();
      refetchAnalytics();
      return result;
    } catch (error) {
      console.error("Error saving investment:", error);
      toast.error("Failed to save investment");
      throw error;
    }
  }, [refetchInvestments, refetchAnalytics]);

  // Schedule a meeting
  const saveMeeting = useCallback(async (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting) => {
    try {
      let result;
      if ("id" in meeting) {
        result = await updateMeeting(meeting);
        toast.success("Meeting updated successfully");
      } else {
        result = await scheduleMeeting(meeting);
        toast.success("Meeting scheduled successfully");
      }
      refetchMeetings();
      return result;
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error("Failed to schedule meeting");
      throw error;
    }
  }, [refetchMeetings]);

  // Mark alert as read
  const markAlertRead = useCallback(async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      refetchAlerts();
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  }, [refetchAlerts]);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    refetchPreferences();
    refetchProjects();
    refetchInvestments();
    refetchMeetings();
    refetchAlerts();
    refetchAnalytics();
    refetchSubnets();
    
    toast.success("Data refreshed");
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

  // Transform available subnets for the UI
  const availableSubnetOptions = availableSubnets.map(subnet => ({
    id: subnet.id.toString(),
    name: subnet.name
  }));

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
    availableSubnets: availableSubnetOptions,
    isLoading: 
      isLoadingPreferences || 
      isLoadingProjects || 
      isLoadingInvestments || 
      isLoadingMeetings || 
      isLoadingAlerts ||
      isLoadingAnalytics ||
      isLoadingSubnets,
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead,
    refreshAllData
  };
}
