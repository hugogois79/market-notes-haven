
import { useQuery } from "@tanstack/react-query";
import { 
  fetchInvestmentPreferences, 
  fetchSubnetProjects, 
  fetchInvestments, 
  fetchMeetings, 
  fetchAlerts 
} from "../services/investorOpportunityService";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { generatePortfolioAnalytics } from "../services/investorOpportunityService";

/**
 * Custom hook for fetching investment-related data
 */
export function useInvestorData() {
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

  const isLoading = 
    isLoadingPreferences || 
    isLoadingProjects || 
    isLoadingInvestments || 
    isLoadingMeetings || 
    isLoadingAlerts ||
    isLoadingAnalytics ||
    isLoadingSubnets;

  // Transform available subnets for the UI
  const availableSubnetOptions = availableSubnets.map(subnet => ({
    id: subnet.id.toString(),
    name: subnet.name
  }));

  return {
    preferences,
    projects,
    investments,
    meetings,
    alerts,
    availableSubnets: availableSubnetOptions,
    portfolioAnalytics,
    isLoading,
    refetchPreferences,
    refetchProjects,
    refetchInvestments,
    refetchMeetings,
    refetchAlerts,
    refetchAnalytics,
    refetchSubnets
  };
}
