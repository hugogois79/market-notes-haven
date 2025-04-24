import { InvestmentPreference, SubnetProject, Investment, OpportunityMatch, InvestorMeeting, InvestorAlert, RiskAssessment } from "../types";
import { TaoSubnet as SubnetType } from "@/services/subnets/types";
import { TaoValidator } from "@/services/validators/types";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { fetchValidators } from "@/services/taoValidatorService";
import { adaptArrayToSubnetTypes } from "@/utils/subnetTypeAdapter";

// Mock investment preferences
let investmentPreferences: InvestmentPreference[] = [{
  id: "pref1",
  name: "Default Investment Strategy",
  subnetTypes: ["Machine Learning", "Data Storage", "Financial"],
  technicalFocus: ["NLP", "Computer Vision", "DeFi"],
  stagePreferences: ["growth", "established"],
  minTicketSize: 50000,
  maxTicketSize: 500000,
  requiresCoInvestment: true,
  decisionTimelineDays: 14,
  riskTolerance: "medium",
  createdAt: new Date(2023, 1, 15),
  updatedAt: new Date(2023, 5, 20)
}];

// Mock subnet projects
const generateMockProjects = async (): Promise<SubnetProject[]> => {
  const rawSubnets = await fetchTaoSubnets();
  const subnets = adaptArrayToSubnetTypes(rawSubnets);
  const validators = await fetchValidators();
  
  return [
    {
      id: "proj1",
      name: "NeuroNet AI Subnet",
      subnetId: subnets[0]?.id || 1,
      subnet: subnets[0],
      description: "Specialized subnet for neural network training and inference",
      stage: "growth",
      fundingTarget: 750000,
      currentFunding: 350000,
      technicalAreas: ["Machine Learning", "NLP", "Computer Vision"],
      leadValidators: validators.slice(0, 2),
      riskAssessment: {
        technical: 3,
        market: 5,
        team: 2,
        regulatory: 4,
        overall: 3,
        notes: "Strong technical team with proven track record"
      },
      roi: {
        projected: 2.5,
        timeframeMonths: 18
      },
      createdAt: new Date(2023, 3, 10),
      launchDate: new Date(2023, 9, 1)
    },
    {
      id: "proj2",
      name: "DataStore Subnet",
      subnetId: subnets[1]?.id || 2,
      subnet: subnets[1],
      description: "Distributed storage solution for large datasets",
      stage: "early",
      fundingTarget: 300000,
      currentFunding: 75000,
      technicalAreas: ["Data Storage", "Distributed Systems"],
      leadValidators: validators.slice(2, 4),
      riskAssessment: {
        technical: 6,
        market: 4,
        team: 5,
        regulatory: 2,
        overall: 5,
        notes: "Novel approach but untested in real-world scenarios"
      },
      roi: {
        projected: 4.0,
        timeframeMonths: 24
      },
      createdAt: new Date(2023, 5, 22)
    },
    {
      id: "proj3",
      name: "FinBlock Subnet",
      subnetId: subnets[2]?.id || 3,
      subnet: subnets[2],
      description: "Financial transactions and smart contract execution",
      stage: "established",
      fundingTarget: 1200000,
      currentFunding: 950000,
      technicalAreas: ["Financial", "DeFi", "Smart Contracts"],
      leadValidators: validators.slice(4, 7),
      riskAssessment: {
        technical: 2,
        market: 3,
        team: 1,
        regulatory: 7,
        overall: 3,
        notes: "Established team but regulatory challenges in some jurisdictions"
      },
      roi: {
        projected: 1.8,
        timeframeMonths: 12
      },
      createdAt: new Date(2022, 11, 5),
      launchDate: new Date(2023, 2, 15)
    }
  ];
};

// Mock portfolio investments
let investments: Investment[] = [
  {
    id: "inv1",
    projectId: "proj1",
    amount: 200000,
    date: new Date(2023, 4, 10),
    status: "deployed",
    notes: "Initial investment with option for follow-on"
  },
  {
    id: "inv2",
    projectId: "proj3",
    amount: 350000,
    date: new Date(2023, 1, 20),
    status: "deployed",
    returns: {
      amount: 70000,
      roi: 0.2
    },
    notes: "Performing well, considering increasing position"
  }
];

// Mock meetings
let meetings: InvestorMeeting[] = [
  {
    id: "meet1",
    projectId: "proj2",
    scheduledDate: new Date(2023, 7, 15, 14, 0), // Aug 15, 2023, 2:00 PM
    attendees: ["John Doe", "Alice Smith", "Bob Johnson"],
    status: "scheduled",
    notes: "Initial pitch meeting to discuss technical architecture"
  }
];

// Mock alerts
let alerts: InvestorAlert[] = [
  {
    id: "alert1",
    type: "new_opportunity",
    projectId: "proj2",
    message: "New opportunity matching your investment criteria: DataStore Subnet",
    date: new Date(2023, 5, 22),
    read: false
  },
  {
    id: "alert2",
    type: "milestone",
    projectId: "proj1",
    message: "NeuroNet AI Subnet has reached 50% of funding target",
    date: new Date(2023, 6, 5),
    read: true
  }
];

// Service API methods
export const fetchInvestmentPreferences = async (): Promise<InvestmentPreference[]> => {
  return [...investmentPreferences];
};

export const updateInvestmentPreference = async (preference: InvestmentPreference): Promise<InvestmentPreference> => {
  const index = investmentPreferences.findIndex(p => p.id === preference.id);
  if (index >= 0) {
    preference.updatedAt = new Date();
    investmentPreferences[index] = preference;
    return preference;
  }
  
  // New preference
  const newPreference = {
    ...preference,
    id: `pref${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  investmentPreferences.push(newPreference);
  return newPreference;
};

export const fetchSubnetProjects = async (): Promise<SubnetProject[]> => {
  return await generateMockProjects();
};

export const fetchProjectById = async (id: string): Promise<SubnetProject | null> => {
  const projects = await generateMockProjects();
  return projects.find(p => p.id === id) || null;
};

export const fetchInvestments = async (): Promise<Investment[]> => {
  const projects = await generateMockProjects();
  return investments.map(inv => ({
    ...inv,
    project: projects.find(p => p.id === inv.projectId)
  }));
};

export const addInvestment = async (investment: Omit<Investment, "id">): Promise<Investment> => {
  const newInvestment = {
    ...investment,
    id: `inv${Date.now()}`
  };
  investments.push(newInvestment);
  return newInvestment;
};

export const updateInvestment = async (investment: Investment): Promise<Investment> => {
  const index = investments.findIndex(i => i.id === investment.id);
  if (index >= 0) {
    investments[index] = investment;
    return investment;
  }
  throw new Error("Investment not found");
};

export const fetchMeetings = async (): Promise<InvestorMeeting[]> => {
  const projects = await generateMockProjects();
  return meetings.map(meeting => ({
    ...meeting,
    project: projects.find(p => p.id === meeting.projectId)
  }));
};

export const scheduleMeeting = async (meeting: Omit<InvestorMeeting, "id">): Promise<InvestorMeeting> => {
  const newMeeting = {
    ...meeting,
    id: `meet${Date.now()}`
  };
  meetings.push(newMeeting);
  return newMeeting;
};

export const updateMeeting = async (meeting: InvestorMeeting): Promise<InvestorMeeting> => {
  const index = meetings.findIndex(m => m.id === meeting.id);
  if (index >= 0) {
    meetings[index] = meeting;
    return meeting;
  }
  throw new Error("Meeting not found");
};

export const fetchAlerts = async (): Promise<InvestorAlert[]> => {
  return [...alerts].sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const markAlertAsRead = async (alertId: string): Promise<void> => {
  const index = alerts.findIndex(a => a.id === alertId);
  if (index >= 0) {
    alerts[index].read = true;
  }
};

export const generateOpportunityMatches = async (
  preference: InvestmentPreference
): Promise<OpportunityMatch[]> => {
  const projects = await generateMockProjects();
  
  const matches = projects.map(project => {
    // Calculate match scores based on various criteria
    const subnetTypeMatch = calculateOverlap(preference.subnetTypes, project.technicalAreas);
    const technicalFocusMatch = calculateOverlap(preference.technicalFocus, project.technicalAreas);
    const stageMatch = preference.stagePreferences.includes(project.stage) ? 1 : 0;
    const ticketSizeMatch = project.fundingTarget >= preference.minTicketSize && 
                          project.fundingTarget <= preference.maxTicketSize ? 1 : 0;
    
    // Risk alignment (compare preference risk tolerance with project risk)
    const riskMap = { "low": 2, "medium": 5, "high": 8 };
    const preferredRisk = riskMap[preference.riskTolerance];
    const projectRisk = project.riskAssessment.overall;
    const riskAlignmentMatch = 1 - Math.min(Math.abs(preferredRisk - projectRisk) / 10, 1);
    
    // Overall match score (weighted average)
    const matchScore = (
      subnetTypeMatch * 0.25 +
      technicalFocusMatch * 0.25 +
      stageMatch * 0.2 +
      ticketSizeMatch * 0.15 +
      riskAlignmentMatch * 0.15
    ) * 100;
    
    return {
      project,
      matchScore,
      matchDetails: {
        subnetTypeMatch: subnetTypeMatch * 100,
        technicalFocusMatch: technicalFocusMatch * 100,
        stageMatch: stageMatch * 100,
        ticketSizeMatch: ticketSizeMatch * 100,
        riskAlignmentMatch: riskAlignmentMatch * 100
      }
    };
  });
  
  // Sort by match score
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(match => {
      // Find similar projects for comparison
      const similarProjects = projects
        .filter(p => 
          p.id !== match.project.id && 
          p.stage === match.project.stage &&
          calculateOverlap(p.technicalAreas, match.project.technicalAreas) > 0.3
        )
        .slice(0, 2);
      
      return {
        ...match,
        comparisonProjects: similarProjects
      };
    });
};

// Helper function to calculate overlap between two arrays
const calculateOverlap = (arr1: string[], arr2: string[]): number => {
  if (!arr1.length || !arr2.length) return 0;
  
  const intersection = arr1.filter(item => arr2.includes(item));
  return intersection.length / Math.max(arr1.length, arr2.length);
};

// Return portfolio analytics
export const generatePortfolioAnalytics = async (): Promise<{
  totalInvested: number;
  totalReturns: number;
  overallRoi: number;
  diversification: { category: string; percentage: number }[];
  performanceByStage: { stage: string; roi: number }[];
  riskExposure: { risk: string; percentage: number }[];
}> => {
  const investmentsWithProjects = await fetchInvestments();
  
  const totalInvested = investmentsWithProjects.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investmentsWithProjects.reduce((sum, inv) => sum + (inv.returns?.amount || 0), 0);
  const overallRoi = totalInvested ? totalReturns / totalInvested : 0;
  
  // Calculate diversification
  const areaInvestments = investmentsWithProjects.reduce((acc, inv) => {
    if (!inv.project) return acc;
    
    inv.project.technicalAreas.forEach(area => {
      if (!acc[area]) acc[area] = 0;
      acc[area] += inv.amount;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const diversification = Object.entries(areaInvestments).map(([category, amount]) => ({
    category,
    percentage: (amount / totalInvested) * 100
  })).sort((a, b) => b.percentage - a.percentage);
  
  // Performance by stage
  const stageInvestments = investmentsWithProjects.reduce((acc, inv) => {
    if (!inv.project) return acc;
    
    const stage = inv.project.stage;
    if (!acc[stage]) acc[stage] = { invested: 0, returns: 0 };
    acc[stage].invested += inv.amount;
    acc[stage].returns += inv.returns?.amount || 0;
    
    return acc;
  }, {} as Record<string, { invested: number; returns: number }>);
  
  const performanceByStage = Object.entries(stageInvestments).map(([stage, data]) => ({
    stage,
    roi: data.invested ? data.returns / data.invested : 0
  }));
  
  // Risk exposure
  const riskExposure = [
    { risk: 'Low', percentage: 35 },
    { risk: 'Medium', percentage: 45 },
    { risk: 'High', percentage: 20 }
  ];
  
  return {
    totalInvested,
    totalReturns,
    overallRoi,
    diversification,
    performanceByStage,
    riskExposure
  };
};
