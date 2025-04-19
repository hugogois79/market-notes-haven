
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchValidators, 
  TaoValidator,
  fetchContactLogs
} from "@/services/taoValidatorService";
import { toast } from "sonner";
import { TaoSubnet } from "@/services/subnets/types";
import { fetchSubnetsByValidator, fetchValidatorsBySubnet } from "@/services/subnets/subnetService";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { 
  fetchValidatorMetrics,
  fetchValidatorStakeHistory,
  generateRecommendedSubnets,
  generateCollaborationOpportunities
} from "../services/validatorRelationshipService";

export interface ValidatorMetrics {
  hardwareSpecs: string;
  uptime: number;
  specialty: string[];
  performanceScore: number;
  historicalPerformance: {
    date: string;
    score: number;
  }[];
}

export interface StakeHistory {
  date: string;
  amount: number;
  delegatorCount: number;
}

export interface CollaborationOpportunity {
  validatorId: string;
  validatorName: string;
  compatibilityScore: number;
  reason: string;
  potentialBenefit: string;
}

export function useValidatorRelationshipData() {
  const [selectedValidator, setSelectedValidator] = useState<TaoValidator | null>(null);
  const [validatorMetrics, setValidatorMetrics] = useState<ValidatorMetrics | null>(null);
  const [validatorSubnets, setValidatorSubnets] = useState<TaoSubnet[]>([]);
  const [validatorStakeHistory, setValidatorStakeHistory] = useState<StakeHistory[]>([]);
  const [recommendedSubnets, setRecommendedSubnets] = useState<TaoSubnet[]>([]);
  const [collaborationOpportunities, setCollaborationOpportunities] = useState<CollaborationOpportunity[]>([]);

  // Fetch validators
  const {
    data: validators = [],
    isLoading: isLoadingValidators,
    refetch: refetchValidators,
  } = useQuery({
    queryKey: ["tao-validators"],
    queryFn: fetchValidators,
  });

  // Fetch subnets
  const {
    data: subnets = [],
    isLoading: isLoadingSubnets,
    refetch: refetchSubnets,
  } = useQuery({
    queryKey: ["tao-subnets"],
    queryFn: fetchTaoSubnets,
  });

  // Fetch contact logs
  const {
    data: contactLogs = [],
    isLoading: isLoadingContactLogs,
    refetch: refetchContactLogs,
  } = useQuery({
    queryKey: ["tao-contact-logs"],
    queryFn: fetchContactLogs,
  });

  // Filter contact logs for selected validator
  const validatorCommunication = contactLogs.filter(
    log => selectedValidator && log.validator_id === selectedValidator.id
  );

  // Load validator-specific data when a validator is selected
  useEffect(() => {
    const loadValidatorData = async () => {
      if (!selectedValidator) return;
      
      try {
        // Fetch validator metrics
        const metrics = await fetchValidatorMetrics(selectedValidator.id);
        setValidatorMetrics(metrics);
        
        // Fetch validator stake history
        const stakeHistory = await fetchValidatorStakeHistory(selectedValidator.id);
        setValidatorStakeHistory(stakeHistory);
        
        // Fetch validator subnets
        const subnetIds = await fetchSubnetsByValidator(selectedValidator.id);
        const validatorSubnetList = subnets.filter(subnet => 
          subnetIds.includes(subnet.id)
        );
        setValidatorSubnets(validatorSubnetList);
        
        // Generate recommended subnets
        const recommended = await generateRecommendedSubnets(
          selectedValidator, 
          subnets,
          validatorSubnetList
        );
        setRecommendedSubnets(recommended);
        
        // Generate collaboration opportunities
        const opportunities = await generateCollaborationOpportunities(
          selectedValidator,
          validators,
          subnets
        );
        setCollaborationOpportunities(opportunities);
        
      } catch (error) {
        console.error("Error loading validator data:", error);
        toast.error("Failed to load validator data");
      }
    };

    loadValidatorData();
  }, [selectedValidator, subnets, validators]);

  // Refresh all data
  const refreshData = useCallback(() => {
    refetchValidators();
    refetchSubnets();
    refetchContactLogs();
    
    if (selectedValidator) {
      // Re-fetch the current validator to get latest data
      fetchValidators().then(updatedValidators => {
        const refreshedValidator = updatedValidators.find(v => v.id === selectedValidator.id);
        if (refreshedValidator) {
          setSelectedValidator(refreshedValidator);
        }
      });
    }
    
    toast.success("Data refreshed");
  }, [refetchValidators, refetchSubnets, refetchContactLogs, selectedValidator]);

  return {
    validators,
    selectedValidator,
    setSelectedValidator,
    isLoading: isLoadingValidators || isLoadingSubnets || isLoadingContactLogs,
    validatorMetrics,
    validatorSubnets,
    validatorStakeHistory,
    validatorCommunication,
    recommendedSubnets,
    collaborationOpportunities,
    refreshData
  };
}
