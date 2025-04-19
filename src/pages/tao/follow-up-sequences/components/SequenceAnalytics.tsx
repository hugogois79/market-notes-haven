
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Filter, RefreshCcw } from "lucide-react";
import { MetricCards } from "./analytics/MetricCards";
import { ChannelEffectivenessChart } from "./analytics/ChannelEffectivenessChart";
import { TimePerformanceChart } from "./analytics/TimePerformanceChart";
import { ActiveSequencesTable } from "./analytics/ActiveSequencesTable";

// Mock data for analytics dashboard
const mockActiveSequences = [
  {
    id: "seq-1",
    name: "Validator Onboarding",
    started: 45,
    completed: 32,
    clickRate: 0.65,
    responseRate: 0.42,
    stakeholderType: "validator",
    createdAt: new Date(2023, 3, 15),
    updatedAt: new Date(2023, 4, 1),
    status: "active",
    steps: 4,
    averageCompletionTime: 9.2 // days
  },
  {
    id: "seq-2",
    name: "Subnet Owner Follow-up",
    started: 28,
    completed: 18,
    clickRate: 0.72,
    responseRate: 0.51,
    stakeholderType: "subnet_owner",
    createdAt: new Date(2023, 2, 22),
    updatedAt: new Date(2023, 3, 28),
    status: "active",
    steps: 3,
    averageCompletionTime: 5.7 // days
  },
  {
    id: "seq-3",
    name: "Investor Engagement",
    started: 17,
    completed: 11,
    clickRate: 0.81,
    responseRate: 0.63,
    stakeholderType: "investor",
    createdAt: new Date(2023, 4, 10),
    updatedAt: new Date(2023, 4, 15),
    status: "active",
    steps: 5,
    averageCompletionTime: 12.3 // days
  }
];

const mockChannelData = [
  { name: "Email", value: 42 },
  { name: "Direct Message", value: 28 },
  { name: "Calendar", value: 15 }
];

const mockTimePerformanceData = [
  { day: "Day 1", email: 0.72, message: 0.68, calendar: 0.45 },
  { day: "Day 3", email: 0.58, message: 0.52, calendar: 0.41 },
  { day: "Day 7", email: 0.43, message: 0.38, calendar: 0.32 },
  { day: "Day 14", email: 0.35, message: 0.27, calendar: 0.21 },
  { day: "Day 30", email: 0.22, message: 0.15, calendar: 0.12 }
];

const SequenceAnalytics = () => {
  const [period, setPeriod] = useState<string>("30d");
  const [stakeholderFilter, setStakeholderFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleRefreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Filter active sequences based on selected stakeholder type
  const filteredSequences = stakeholderFilter === "all" 
    ? mockActiveSequences 
    : mockActiveSequences.filter(seq => seq.stakeholderType === stakeholderFilter);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Sequence Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your communication sequences
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={stakeholderFilter} onValueChange={setStakeholderFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stakeholder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stakeholders</SelectItem>
                  <SelectItem value="validator">Validators</SelectItem>
                  <SelectItem value="subnet_owner">Subnet Owners</SelectItem>
                  <SelectItem value="investor">Investors</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={() => setStakeholderFilter("all")}>
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleRefreshData} disabled={isLoading}>
                <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <MetricCards activeSequences={filteredSequences} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ChannelEffectivenessChart data={mockChannelData} />
            <TimePerformanceChart data={mockTimePerformanceData} />
          </div>
          
          <Tabs defaultValue="active" className="mt-6">
            <TabsList>
              <TabsTrigger value="active">Active Sequences</TabsTrigger>
              <TabsTrigger value="completed">Completed Sequences</TabsTrigger>
              <TabsTrigger value="template">Template Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <ActiveSequencesTable sequences={filteredSequences} />
            </TabsContent>
            
            <TabsContent value="completed">
              <Card className="border-none">
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No completed sequences in selected time period</p>
                    <Button variant="outline" size="sm">
                      Set Custom Date Range
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="template">
              <Card className="border-none">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Template Effectiveness</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Export Data
                    </Button>
                  </div>
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Template performance data is being compiled</p>
                    <p className="text-sm text-muted-foreground">This feature will be available soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceAnalytics;
