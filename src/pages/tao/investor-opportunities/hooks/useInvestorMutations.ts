
import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
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
  
  // Save investment preference with improved error handling
  const saveInvestmentPreference = useCallback(async (preference: InvestmentPreference) => {
    try {
      console.log("Saving investment preference:", preference);
      const updatedPreference = await updateInvestmentPreference(preference);
      toast({
        title: "Success",
        description: "Investment preference saved successfully"
      });
      await refetchPreferences();
      return updatedPreference;
    } catch (error) {
      console.error("Error saving investment preference:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save investment preference. Please check your inputs and try again."
      });
      throw error;
    }
  }, [refetchPreferences]);

  // Add/update investment with improved error handling
  const saveInvestment = useCallback(async (investment: Partial<Investment>) => {
    try {
      let result;
      if ("id" in investment && investment.id) {
        console.log("Updating existing investment:", investment);
        result = await updateInvestment(investment as Investment);
        toast({
          title: "Success",
          description: "Investment updated successfully"
        });
      } else {
        console.log("Adding new investment:", investment);
        result = await addInvestment(investment as Omit<Investment, "id">);
        toast({
          title: "Success",
          description: "Investment added successfully"
        });
      }
      await refetchInvestments();
      await refetchAnalytics();
      return result;
    } catch (error) {
      console.error("Error saving investment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save investment. Please check your inputs and try again."
      });
      throw error;
    }
  }, [refetchInvestments, refetchAnalytics]);

  // Schedule a meeting with proper error handling
  const saveMeeting = useCallback(async (meeting: Omit<InvestorMeeting, "id"> | InvestorMeeting): Promise<InvestorMeeting> => {
    try {
      let result: InvestorMeeting;
      
      if ("id" in meeting) {
        result = await updateMeeting(meeting);
        toast({
          title: "Success",
          description: "Meeting updated successfully"
        });
      } else {
        result = await scheduleMeeting(meeting);
        toast({
          title: "Success",
          description: "Meeting scheduled successfully"
        });
      }
      
      // Make sure we await the refetch operation
      await refetchMeetings();
      
      // Explicitly return the result
      return result;
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule meeting. Please try again."
      });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark alert as read"
      });
    }
  }, [refetchAlerts]);

  return {
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead
  };
}
