import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchValidators, 
  TaoValidator,
  fetchContactLogs
} from "@/services/taoValidatorService";
import { toast } from "sonner";
import { TaoSubnet as SubnetType } from "@/services/subnets/types";
import { fetchSubnetsByValidator, fetchValidatorsBySubnet } from "@/services/subnets/subnetService";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { adaptArrayToSubnetTypes } from "@/utils/subnetTypeAdapter";
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
  const [validatorSubnets, setValidatorSubnets] = useState<SubnetType[]>([]);
  const [validatorStakeHistory, setValidatorStakeHistory] = useState<StakeHistory[]>([]);
  const [recommendedSubnets, setRecommendedSubnets] = useState<SubnetType[]>([]);
  const [collaborationOpportunities, setCollaborationOpportunities] = useState<CollaborationOpportunity[]>([]);

  const {
    data: validators = [],
    isLoading: isLoadingValidators,
    refetch: refetchValidators,
  } = useQuery({
    queryKey: ["tao-validators"],
    queryFn: fetchValidators,
  });

  const {
    data: rawSubnets = [],
    isLoading: isLoadingSubnets,
    refetch: refetchSubnets,
  } = useQuery({
    queryKey: ["tao-subnets"],
    queryFn: fetchTaoSubnets,
  });

  const subnets = adaptArrayToSubnetTypes(rawSubnets);

  const {
    data: contactLogs = [],
    isLoading: isLoadingContactLogs,
    refetch: refetchContactLogs,
  } = useQuery({
    queryKey: ["tao-contact-logs"],
    queryFn: fetchContactLogs,
  });

  const validatorCommunication = contactLogs.filter(
    log => selectedValidator && log.validator_id === selectedValidator.id
  );

  useEffect(() => {
    const loadValidatorData = async () => {
      if (!selectedValidator) return;
      
      try {
        const metrics = await fetchValidatorMetrics(selectedValidator.id);
        setValidatorMetrics(metrics);
        
        const stakeHistory = await fetchValidatorStakeHistory(selectedValidator.id);
        setValidatorStakeHistory(stakeHistory);
        
        const subnetIds = await fetchSubnetsByValidator(selectedValidator.id);
        const rawValidatorSubnetList = rawSubnets.filter(subnet => {
          const subnetId = typeof subnet.id === 'string' ? parseInt(subnet.id, 10) : subnet.id;
          return subnetIds.includes(subnetId);
        });
        
        const validatorSubnetList = adaptArrayToSubnetTypes(rawValidatorSubnetList);
        setValidatorSubnets(validatorSubnetList);
        
        const recommended = await generateRecommendedSubnets(
          selectedValidator, 
          subnets,
          validatorSubnetList
        );
        setRecommendedSubnets(recommended);
        
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
  }, [selectedValidator, rawSubnets, validators, subnets]);

  const refreshData = useCallback(() => {
    refetchValidators();
    refetchSubnets();
    refetchContactLogs();
    
    if (selectedValidator) {
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
