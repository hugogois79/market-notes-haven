
import { useCallback } from "react";
import { toast } from "sonner";
import {
  updateInvestmentPreference,
  addInvestment,
  updateInvestment,
  scheduleMeeting,
  updateMeeting,
  markAlertAsRead
} from "../services/investorOpportunityService";
import {
  InvestmentPreference,
  Investment,
  InvestorMeeting,
} from "../types";

/**
 * Custom hook for investor opportunity mutations
 */
export function useInvestorMutations(refetchCallbacks: {
  refetchPreferences: () => Promise<any>;
  refetchInvestments: () => Promise<any>;
  refetchAnalytics: () => Promise<any>;
  refetchMeetings: () => Promise<any>;
  refetchAlerts: () => Promise<any>;
}) {
  const { refetchPreferences, refetchInvestments, refetchAnalytics, refetchMeetings, refetchAlerts } = refetchCallbacks;
  
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
  const saveMeeting = useCallback(async (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting): Promise<InvestorMeeting> => {
    try {
      let result: InvestorMeeting;
      
      if ("id" in meeting) {
        result = await updateMeeting(meeting);
        toast.success("Meeting updated successfully");
      } else {
        result = await scheduleMeeting(meeting);
        toast.success("Meeting scheduled successfully");
      }
      
      // Make sure we await the refetch operation
      await refetchMeetings();
      
      // Explicitly return the result
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

  return {
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead
  };
}
