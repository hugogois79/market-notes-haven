
export type TriggerType = 'time' | 'event' | 'engagement' | 'manual';
export type ChannelType = 'email' | 'message' | 'calendar';
export type StakeholderType = 'validator' | 'subnet_owner' | 'investor' | 'developer';
export type StageType = 'prospect' | 'contacted' | 'engaged' | 'qualified' | 'committed' | 'active' | 'inactive';
export type ToneStyle = 'professional' | 'friendly' | 'technical' | 'formal' | 'casual';

export interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface PersonalizationField {
  id: string;
  name: string;
  fallback?: string;
}

export interface SequenceStep {
  id: string;
  name: string;
  description: string;
  channelType: ChannelType;
  content: string;
  subject?: string;
  triggerType: TriggerType;
  triggerValue: string;
  triggerUnit?: 'minutes' | 'hours' | 'days' | 'weeks';
  conditions: Condition[];
  personalizationFields: PersonalizationField[];
  toneStyle?: ToneStyle;
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  stakeholderType: StakeholderType;
  stageType: StageType;
  steps: SequenceStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  stakeholderType: StakeholderType;
  stageType: StageType;
  steps: number;
  effectiveness: number;
  usage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceAnalytics {
  sequenceId: string;
  started: number;
  completed: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  averageCompletionTime: number;
  stepPerformance: {
    stepId: string;
    openRate: number;
    clickRate: number;
    responseRate: number;
  }[];
}
