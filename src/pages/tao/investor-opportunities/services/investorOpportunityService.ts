
import { InvestmentPreference, SubnetProject, Investment, OpportunityMatch, InvestorMeeting, InvestorAlert, RiskAssessment } from "../types";
import { TaoSubnet as SubnetType } from "@/services/subnets/types";
import { TaoValidator } from "@/services/validators/types";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { fetchValidators } from "@/services/taoValidatorService";
import { adaptArrayToSubnetTypes } from "@/utils/subnetTypeAdapter";
import { supabase } from "@/integrations/supabase/client";

// Fetch investment preferences from Supabase
export const fetchInvestmentPreferences = async (): Promise<InvestmentPreference[]> => {
  const { data, error } = await supabase
    .from('investment_preferences')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching investment preferences:", error);
    return [];
  }
  
  return data || [];
};

// Create or update investment preference in Supabase
export const updateInvestmentPreference = async (preference: InvestmentPreference): Promise<InvestmentPreference> => {
  const { id, ...preferenceData } = preference;
  
  if (id) {
    // Update existing preference
    const { data, error } = await supabase
      .from('investment_preferences')
      .update({ ...preferenceData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating investment preference:", error);
      throw error;
    }
    
    return data;
  } else {
    // Create new preference
    const { data, error } = await supabase
      .from('investment_preferences')
      .insert([{ ...preferenceData }])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating investment preference:", error);
      throw error;
    }
    
    return data;
  }
};

// Fetch subnet projects with mock data if needed
export const fetchSubnetProjects = async (): Promise<SubnetProject[]> => {
  const { data, error } = await supabase
    .from('subnet_projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching subnet projects:", error);
    return generateMockProjects();
  }
  
  if (!data || data.length === 0) {
    // If no projects in database, generate and insert mock data
    const mockProjects = await generateMockProjects();
    await populateMockProjects(mockProjects);
    return mockProjects;
  }
  
  return data;
};

// Generate mock projects for initial setup
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

// Add mock projects to database for initial setup
const populateMockProjects = async (projects: SubnetProject[]): Promise<void> => {
  try {
    for (const project of projects) {
      const { data, error } = await supabase
        .from('subnet_projects')
        .insert([{
          id: project.id,
          name: project.name,
          subnet_id: project.subnetId,
          description: project.description,
          stage: project.stage,
          funding_target: project.fundingTarget,
          current_funding: project.currentFunding,
          technical_areas: project.technicalAreas,
          risk_assessment: project.riskAssessment,
          roi: project.roi,
          created_at: project.createdAt,
          launch_date: project.launchDate
        }]);
      
      if (error) {
        console.error("Error inserting mock project:", error);
      }
    }
  } catch (error) {
    console.error("Error populating mock projects:", error);
  }
};

// Fetch project by ID
export const fetchProjectById = async (id: string): Promise<SubnetProject | null> => {
  const { data, error } = await supabase
    .from('subnet_projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }
  
  return data;
};

// Fetch investments from Supabase
export const fetchInvestments = async (): Promise<Investment[]> => {
  const { data, error } = await supabase
    .from('investments')
    .select(`
      *,
      project:project_id (*)
    `)
    .order('date', { ascending: false });
  
  if (error) {
    console.error("Error fetching investments:", error);
    return [];
  }
  
  // If no investments, insert mock data
  if (!data || data.length === 0) {
    const mockInvestments = await generateMockInvestments();
    return mockInvestments;
  }
  
  return data.map(inv => ({
    id: inv.id,
    projectId: inv.project_id,
    project: inv.project,
    amount: inv.amount,
    date: new Date(inv.date),
    status: inv.status,
    returns: inv.returns,
    notes: inv.notes
  }));
};

// Generate and insert mock investments for initial setup
const generateMockInvestments = async (): Promise<Investment[]> => {
  const projects = await fetchSubnetProjects();
  
  const mockInvestments = [
    {
      id: "inv1",
      projectId: projects[0]?.id || "proj1",
      amount: 200000,
      date: new Date(2023, 4, 10),
      status: "deployed",
      notes: "Initial investment with option for follow-on"
    },
    {
      id: "inv2",
      projectId: projects[2]?.id || "proj3",
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
  
  // Insert mock investments to database
  try {
    for (const inv of mockInvestments) {
      const { error } = await supabase
        .from('investments')
        .insert([{
          id: inv.id,
          project_id: inv.projectId,
          amount: inv.amount,
          date: inv.date,
          status: inv.status,
          returns: inv.returns,
          notes: inv.notes
        }]);
      
      if (error) {
        console.error("Error inserting mock investment:", error);
      }
    }
  } catch (error) {
    console.error("Error populating mock investments:", error);
  }
  
  return mockInvestments;
};

// Add new investment to Supabase
export const addInvestment = async (investment: Omit<Investment, "id">): Promise<Investment> => {
  const { data, error } = await supabase
    .from('investments')
    .insert([{
      project_id: investment.projectId,
      amount: investment.amount,
      date: investment.date,
      status: investment.status,
      returns: investment.returns,
      notes: investment.notes
    }])
    .select()
    .single();
  
  if (error) {
    console.error("Error adding investment:", error);
    throw error;
  }
  
  return {
    id: data.id,
    projectId: data.project_id,
    amount: data.amount,
    date: new Date(data.date),
    status: data.status,
    returns: data.returns,
    notes: data.notes
  };
};

// Update existing investment in Supabase
export const updateInvestment = async (investment: Investment): Promise<Investment> => {
  const { data, error } = await supabase
    .from('investments')
    .update({
      project_id: investment.projectId,
      amount: investment.amount,
      date: investment.date,
      status: investment.status,
      returns: investment.returns,
      notes: investment.notes
    })
    .eq('id', investment.id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating investment:", error);
    throw error;
  }
  
  return {
    id: data.id,
    projectId: data.project_id,
    amount: data.amount,
    date: new Date(data.date),
    status: data.status,
    returns: data.returns,
    notes: data.notes
  };
};

// Fetch meetings from Supabase
export const fetchMeetings = async (): Promise<InvestorMeeting[]> => {
  const { data, error } = await supabase
    .from('investor_meetings')
    .select(`
      *,
      project:project_id (*)
    `)
    .order('scheduled_date', { ascending: true });
  
  if (error) {
    console.error("Error fetching meetings:", error);
    return [];
  }
  
  if (!data || data.length === 0) {
    // Insert mock meeting
    const mockMeeting = await generateMockMeeting();
    return [mockMeeting];
  }
  
  return data.map(meeting => ({
    id: meeting.id,
    projectId: meeting.project_id,
    project: meeting.project,
    scheduledDate: new Date(meeting.scheduled_date),
    attendees: meeting.attendees,
    status: meeting.status,
    notes: meeting.notes,
    followUpDate: meeting.follow_up_date ? new Date(meeting.follow_up_date) : undefined
  }));
};

// Generate and insert mock meeting for initial setup
const generateMockMeeting = async (): Promise<InvestorMeeting> => {
  const projects = await fetchSubnetProjects();
  
  const mockMeeting = {
    id: "meet1",
    projectId: projects[1]?.id || "proj2",
    scheduledDate: new Date(2023, 7, 15, 14, 0), // Aug 15, 2023, 2:00 PM
    attendees: ["John Doe", "Alice Smith", "Bob Johnson"],
    status: "scheduled",
    notes: "Initial pitch meeting to discuss technical architecture"
  };
  
  // Insert mock meeting to database
  try {
    const { error } = await supabase
      .from('investor_meetings')
      .insert([{
        id: mockMeeting.id,
        project_id: mockMeeting.projectId,
        scheduled_date: mockMeeting.scheduledDate,
        attendees: mockMeeting.attendees,
        status: mockMeeting.status,
        notes: mockMeeting.notes
      }]);
    
    if (error) {
      console.error("Error inserting mock meeting:", error);
    }
  } catch (error) {
    console.error("Error creating mock meeting:", error);
  }
  
  return mockMeeting;
};

// Schedule a new meeting in Supabase
export const scheduleMeeting = async (meeting: Omit<InvestorMeeting, "id">): Promise<InvestorMeeting> => {
  const { data, error } = await supabase
    .from('investor_meetings')
    .insert([{
      project_id: meeting.projectId,
      scheduled_date: meeting.scheduledDate,
      attendees: meeting.attendees,
      status: meeting.status,
      notes: meeting.notes,
      follow_up_date: meeting.followUpDate
    }])
    .select()
    .single();
  
  if (error) {
    console.error("Error scheduling meeting:", error);
    throw error;
  }
  
  return {
    id: data.id,
    projectId: data.project_id,
    scheduledDate: new Date(data.scheduled_date),
    attendees: data.attendees,
    status: data.status,
    notes: data.notes,
    followUpDate: data.follow_up_date ? new Date(data.follow_up_date) : undefined
  };
};

// Update existing meeting in Supabase
export const updateMeeting = async (meeting: InvestorMeeting): Promise<InvestorMeeting> => {
  const { data, error } = await supabase
    .from('investor_meetings')
    .update({
      project_id: meeting.projectId,
      scheduled_date: meeting.scheduledDate,
      attendees: meeting.attendees,
      status: meeting.status,
      notes: meeting.notes,
      follow_up_date: meeting.followUpDate
    })
    .eq('id', meeting.id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating meeting:", error);
    throw error;
  }
  
  return {
    id: data.id,
    projectId: data.project_id,
    scheduledDate: new Date(data.scheduled_date),
    attendees: data.attendees,
    status: data.status,
    notes: data.notes,
    followUpDate: data.follow_up_date ? new Date(data.follow_up_date) : undefined
  };
};

// Fetch alerts from Supabase
export const fetchAlerts = async (): Promise<InvestorAlert[]> => {
  const { data, error } = await supabase
    .from('investor_alerts')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
  
  if (!data || data.length === 0) {
    // Insert mock alerts
    const mockAlerts = await generateMockAlerts();
    return mockAlerts;
  }
  
  return data.map(alert => ({
    id: alert.id,
    type: alert.type,
    projectId: alert.project_id,
    message: alert.message,
    date: new Date(alert.date),
    read: alert.read
  }));
};

// Generate and insert mock alerts for initial setup
const generateMockAlerts = async (): Promise<InvestorAlert[]> => {
  const projects = await fetchSubnetProjects();
  
  const mockAlerts = [
    {
      id: "alert1",
      type: "new_opportunity",
      projectId: projects[1]?.id || "proj2",
      message: "New opportunity matching your investment criteria: DataStore Subnet",
      date: new Date(2023, 5, 22),
      read: false
    },
    {
      id: "alert2",
      type: "milestone",
      projectId: projects[0]?.id || "proj1",
      message: "NeuroNet AI Subnet has reached 50% of funding target",
      date: new Date(2023, 6, 5),
      read: true
    }
  ];
  
  // Insert mock alerts to database
  try {
    for (const alert of mockAlerts) {
      const { error } = await supabase
        .from('investor_alerts')
        .insert([{
          id: alert.id,
          type: alert.type,
          project_id: alert.projectId,
          message: alert.message,
          date: alert.date,
          read: alert.read
        }]);
      
      if (error) {
        console.error("Error inserting mock alert:", error);
      }
    }
  } catch (error) {
    console.error("Error creating mock alerts:", error);
  }
  
  return mockAlerts;
};

// Mark alert as read in Supabase
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from('investor_alerts')
    .update({ read: true })
    .eq('id', alertId);
  
  if (error) {
    console.error("Error marking alert as read:", error);
    throw error;
  }
};

// Generate opportunity matches based on preference
export const generateOpportunityMatches = async (
  preference: InvestmentPreference
): Promise<OpportunityMatch[]> => {
  const projects = await fetchSubnetProjects();
  
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

// Generate portfolio analytics
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
