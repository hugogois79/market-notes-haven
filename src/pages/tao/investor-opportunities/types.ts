
import { TaoValidator } from "@/services/validators/types";
import { TaoSubnet } from "@/services/subnets/types";

// Investment profile types
export interface InvestmentPreference {
  id: string;
  name: string;
  subnetTypes: string[];
  technicalFocus: string[];
  stagePreferences: ("early" | "growth" | "established")[];
  minTicketSize: number;
  maxTicketSize: number;
  requiresCoInvestment: boolean;
  decisionTimelineDays: number;
  riskTolerance: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}

// Subnet project types
export interface SubnetProject {
  id: string;
  name: string;
  subnetId: number;
  subnet?: TaoSubnet;
  description: string;
  stage: "early" | "growth" | "established";
  fundingTarget: number;
  currentFunding: number;
  technicalAreas: string[];
  leadValidators: TaoValidator[];
  riskAssessment: RiskAssessment;
  roi: {
    projected: number;
    timeframeMonths: number;
  };
  createdAt: Date;
  launchDate?: Date;
}

export interface RiskAssessment {
  technical: number; // 1-10
  market: number; // 1-10
  team: number; // 1-10
  regulatory: number; // 1-10
  overall: number; // 1-10
  notes: string;
}

// Investment types
export interface Investment {
  id: string;
  projectId: string;
  project?: SubnetProject;
  amount: number;
  date: Date;
  status: "committed" | "pending" | "deployed" | "exited";
  returns?: {
    amount: number;
    roi: number;
  };
  notes?: string;
}

// Match score types
export interface OpportunityMatch {
  project: SubnetProject;
  matchScore: number;
  matchDetails: {
    subnetTypeMatch: number;
    technicalFocusMatch: number;
    stageMatch: number;
    ticketSizeMatch: number;
    riskAlignmentMatch: number;
  };
  comparisonProjects?: SubnetProject[];
}

// Meeting types
export interface InvestorMeeting {
  id: string;
  projectId: string;
  project?: SubnetProject;
  scheduledDate: Date;
  attendees: string[];
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  followUpDate?: Date;
}

// Alert types
export interface InvestorAlert {
  id: string;
  type: "new_opportunity" | "milestone" | "funding_update" | "performance";
  projectId: string;
  message: string;
  date: Date;
  read: boolean;
}
