
import { TaoValidator } from "@/services/validators/types";
import { TaoSubnet } from "@/services/subnets/types";
import { ValidatorMetrics, StakeHistory, CollaborationOpportunity } from "../hooks/useValidatorRelationshipData";

// This service would normally connect to backend APIs
// For now, we'll simulate data

/**
 * Fetch validator metrics including hardware specs, uptime, specializations
 */
export const fetchValidatorMetrics = async (validatorId: string): Promise<ValidatorMetrics> => {
  // Simulate API call with mock data based on validator ID
  // In a real app, this would call your backend API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate deterministic but random-looking data based on validator ID
  const seed = validatorId.charCodeAt(0) + validatorId.charCodeAt(validatorId.length - 1);
  
  // Generate historical performance data
  const historicalPerformance = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate score with some variation but trending generally upward
    // and influenced by the validator ID for consistency
    const baseScore = 70 + (seed % 20);
    const dayVariation = Math.sin(i / 5) * 5; 
    const randomVariation = Math.cos(seed + i) * 3;
    const score = Math.min(99, Math.max(60, baseScore + dayVariation + randomVariation));
    
    historicalPerformance.push({
      date: date.toISOString().split('T')[0],
      score: parseFloat(score.toFixed(1))
    });
  }
  
  const specialties = [
    "High Performance Computing",
    "Machine Learning Operations",
    "Distributed Systems",
    "Consensus Algorithms",
    "Secure Multi-party Computation",
    "Language Models",
    "Computer Vision",
    "Reinforcement Learning"
  ];
  
  // Select 1-3 specialties based on validator ID
  const selectedSpecialties = [];
  const specialtyCount = 1 + (seed % 3);
  for (let i = 0; i < specialtyCount; i++) {
    const index = (seed + i * 7) % specialties.length;
    selectedSpecialties.push(specialties[index]);
  }
  
  return {
    hardwareSpecs: `CPU: ${4 + (seed % 64)} cores, RAM: ${16 + (seed % 112)}GB, Storage: ${1 + (seed % 19)}TB SSD`,
    uptime: 95 + (seed % 5), // 95-99%
    specialty: selectedSpecialties,
    performanceScore: historicalPerformance[historicalPerformance.length - 1].score,
    historicalPerformance
  };
};

/**
 * Fetch validator stake history 
 */
export const fetchValidatorStakeHistory = async (validatorId: string): Promise<StakeHistory[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generate deterministic but random-looking data based on validator ID
  const seed = validatorId.charCodeAt(0) + validatorId.charCodeAt(validatorId.length - 1);
  
  // Generate stake history
  const stakeHistory = [];
  const now = new Date();
  let currentStake = 10000 + (seed * 1000);
  let currentDelegators = 5 + (seed % 20);
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some variation to the stake amount and delegator count
    if (i % 7 === 0) {
      // Bigger changes every week
      currentStake = currentStake * (0.95 + (Math.sin(i / 10) + 1) * 0.05);
      currentDelegators += Math.floor(Math.sin(i / 15) * 3);
    } else {
      // Small daily variations
      currentStake = currentStake * (0.99 + (Math.random() * 0.03));
      if (Math.random() > 0.8) {
        currentDelegators += Math.random() > 0.5 ? 1 : -1;
      }
    }
    
    // Ensure values stay reasonable
    currentStake = Math.max(5000, currentStake);
    currentDelegators = Math.max(1, currentDelegators);
    
    stakeHistory.push({
      date: date.toISOString().split('T')[0],
      amount: Math.round(currentStake),
      delegatorCount: Math.round(currentDelegators)
    });
  }
  
  return stakeHistory;
};

/**
 * Generate recommended subnets for a validator
 */
export const generateRecommendedSubnets = async (
  validator: TaoValidator,
  allSubnets: TaoSubnet[],
  currentSubnets: TaoSubnet[]
): Promise<TaoSubnet[]> => {
  // In a real application, this would use more sophisticated matching algorithms
  const currentSubnetIds = currentSubnets.map(s => s.id);
  
  // Filter out subnets the validator is already participating in
  const availableSubnets = allSubnets.filter(subnet => 
    !currentSubnetIds.includes(subnet.id)
  );
  
  // Simple recommendation algorithm - just choose subnets with similar neuron counts
  // to what the validator is already participating in
  const averageCurrentNeurons = currentSubnets.length > 0
    ? currentSubnets.reduce((sum, s) => sum + s.neurons, 0) / currentSubnets.length
    : 100; // Default if not participating in any subnets
  
  // Sort by how close they are to the average neurons count
  const sortedRecommendations = availableSubnets
    .map(subnet => ({
      subnet,
      difference: Math.abs(subnet.neurons - averageCurrentNeurons)
    }))
    .sort((a, b) => a.difference - b.difference)
    .map(item => item.subnet);
  
  // Return top recommendations
  return sortedRecommendations.slice(0, 5);
};

/**
 * Generate collaboration opportunities with other validators
 */
export const generateCollaborationOpportunities = async (
  validator: TaoValidator,
  allValidators: TaoValidator[],
  allSubnets: TaoSubnet[]
): Promise<CollaborationOpportunity[]> => {
  // In a real application, this would use more sophisticated matching algorithms
  // Filter out the current validator
  const otherValidators = allValidators.filter(v => v.id !== validator.id);
  
  // Simple algorithm - match validators with similar CRM stages for potential collaboration
  const validatorsInSimilarStage = otherValidators.filter(v => 
    v.crm_stage === validator.crm_stage
  );
  
  // Create collaboration opportunities with random compatibility scores
  const opportunities = validatorsInSimilarStage.map(v => {
    // Generate a deterministic but seemingly random compatibility score
    const seed = (validator.id.charCodeAt(0) + v.id.charCodeAt(0)) % 100;
    const compatibilityScore = 65 + seed % 30; // 65-94% compatibility
    
    const benefits = [
      "Enhanced subnet coverage",
      "Shared technical knowledge",
      "Combined marketing efforts",
      "Improved network reliability",
      "Complementary infrastructure",
      "Regional market expansion"
    ];
    
    const reasons = [
      "Similar technical expertise",
      "Complementary subnet coverage",
      "Compatible organizational values",
      "History of successful collaborations",
      "Strategic geographic positioning",
      "Complementary resource allocation"
    ];
    
    return {
      validatorId: v.id,
      validatorName: v.name,
      compatibilityScore,
      reason: reasons[seed % reasons.length],
      potentialBenefit: benefits[(seed + 1) % benefits.length]
    };
  });
  
  // Sort by compatibility score (highest first) and take top 5
  return opportunities
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
};
