
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { MetricCards } from "./analytics/MetricCards";
import { ChannelEffectivenessChart } from "./analytics/ChannelEffectivenessChart";
import { TimePerformanceChart } from "./analytics/TimePerformanceChart";
import { ActiveSequencesTable } from "./analytics/ActiveSequencesTable";

const SequenceAnalytics = () => {
  const [period, setPeriod] = useState<string>("30days");

  // Mock data - In a real app, this would come from an API
  const activeSequences = [
    { 
      id: 'seq1', 
      name: 'Validator Onboarding', 
      started: 42, 
      completed: 36,
      openRate: 0.87,
      clickRate: 0.64,
      days: 14
    },
    { 
      id: 'seq2', 
      name: 'Subnet Owner Engagement', 
      started: 28, 
      completed: 20,
      openRate: 0.75,
      clickRate: 0.52,
      days: 21
    },
    { 
      id: 'seq3', 
      name: 'Investor Relations', 
      started: 15, 
      completed: 12,
      openRate: 0.91,
      clickRate: 0.79,
      days: 30
    }
  ];

  const channelEffectivenessData = [
    { name: 'Email', value: 42 },
    { name: 'Direct Message', value: 28 },
    { name: 'Calendar', value: 15 }
  ];

  const timeBasedPerformanceData = [
    { day: '1', email: 0.83, message: 0.76, calendar: 0.68 },
    { day: '2', email: 0.78, message: 0.74, calendar: 0.67 },
    { day: '3', email: 0.76, message: 0.72, calendar: 0.65 },
    { day: '4', email: 0.79, message: 0.71, calendar: 0.65 },
    { day: '5', email: 0.82, message: 0.75, calendar: 0.69 },
    { day: '6', email: 0.86, message: 0.78, calendar: 0.72 },
    { day: '7', email: 0.84, message: 0.77, calendar: 0.70 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Sequence Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <MetricCards activeSequences={activeSequences} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChannelEffectivenessChart data={channelEffectivenessData} />
        <TimePerformanceChart data={timeBasedPerformanceData} />
      </div>

      <ActiveSequencesTable sequences={activeSequences} />
    </div>
  );
};

export default SequenceAnalytics;
