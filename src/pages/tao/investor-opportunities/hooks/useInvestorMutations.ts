
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { updateInvestmentPreference, updateInvestment, addInvestment, scheduleMeeting, updateMeeting, markAlertAsRead } from '../services/investorOpportunityService';
import type { Investment, InvestmentPreference, InvestorMeeting } from '../types';

interface UseInvestorMutationsProps {
  refetchPreferences: () => void;
  refetchInvestments: () => void;
  refetchAnalytics: () => void;
  refetchMeetings: () => void;
  refetchAlerts: () => void;
}

export function useInvestorMutations({
  refetchPreferences,
  refetchInvestments,
  refetchAnalytics,
  refetchMeetings,
  refetchAlerts
}: UseInvestorMutationsProps) {
  // Save investment preference mutation
  const { mutateAsync: saveInvestmentPreference } = useMutation({
    mutationFn: (preference: InvestmentPreference) => {
      return updateInvestmentPreference(preference);
    },
    onSuccess: () => {
      refetchPreferences();
    },
    onError: (error) => {
      console.error('Failed to save investment preference:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save investment preference. Please try again.'
      });
      throw error; // Re-throw the error so the component can handle it
    }
  });

  // Save investment mutation
  const { mutateAsync: saveInvestment } = useMutation({
    mutationFn: (investment: Partial<Investment>) => {
      if (investment.id) {
        return updateInvestment(investment);
      } else {
        return addInvestment(investment as Omit<Investment, 'id'>);
      }
    },
    onSuccess: () => {
      refetchInvestments();
      refetchAnalytics();
    },
    onError: (error) => {
      console.error('Failed to save investment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save investment. Please try again.'
      });
      throw error;
    }
  });

  // Save meeting mutation
  const { mutateAsync: saveMeeting } = useMutation({
    mutationFn: (meeting: Omit<InvestorMeeting, 'id'> | InvestorMeeting) => {
      if ('id' in meeting) {
        return updateMeeting(meeting);
      } else {
        return scheduleMeeting(meeting);
      }
    },
    onSuccess: () => {
      refetchMeetings();
    },
    onError: (error) => {
      console.error('Failed to save meeting:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to schedule meeting. Please try again.'
      });
      throw error;
    }
  });

  // Mark alert as read mutation
  const { mutateAsync: markAlertRead } = useMutation({
    mutationFn: (alertId: string) => {
      return markAlertAsRead(alertId);
    },
    onSuccess: () => {
      refetchAlerts();
    },
    onError: (error) => {
      console.error('Failed to mark alert as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update alert. Please try again.'
      });
      throw error;
    }
  });

  return {
    saveInvestmentPreference,
    saveInvestment,
    saveMeeting,
    markAlertRead
  };
}
