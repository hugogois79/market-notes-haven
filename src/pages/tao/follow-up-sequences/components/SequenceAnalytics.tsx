
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  TooltipProps
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronDown, Download, Mail, MessageSquare, Calendar } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SequenceAnalytics = () => {
  const [period, setPeriod] = useState<string>("30days");
  
  // Mock data for analytics
  const openRateData = [
    { name: 'Welcome', rate: 0.87 },
    { name: 'Follow-up', rate: 0.74 },
    { name: 'Technical', rate: 0.91 },
    { name: 'Proposal', rate: 0.68 },
    { name: 'Review', rate: 0.72 }
  ];
  
  const completionRateData = [
    { name: 'Validator Onboarding', rate: 0.85 },
    { name: 'Subnet Owner', rate: 0.72 },
    { name: 'Investor Opportunity', rate: 0.62 },
    { name: 'Technical Updates', rate: 0.93 }
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
  
  // Helper function to format percentages
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
  
  // Active sequences and performance stats
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sequences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {activeSequences.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {activeSequences.reduce((acc, seq) => acc + seq.started, 0)} stakeholders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPercent(activeSequences.reduce((acc, seq) => acc + (seq.completed / seq.started), 0) / activeSequences.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSequences.reduce((acc, seq) => acc + seq.completed, 0)} sequences completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPercent(activeSequences.reduce((acc, seq) => acc + seq.clickRate, 0) / activeSequences.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {activeSequences.reduce((acc, seq) => acc + seq.started, 0)} sequence starts
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Channel Effectiveness</CardTitle>
            <CardDescription>
              Engagement by communication channel
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelEffectivenessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {channelEffectivenessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Messages']} />
                <Legend 
                  formatter={(value, entry, index) => {
                    return (
                      <span className="flex items-center gap-2">
                        {value === 'Email' && <Mail className="h-3 w-3" />}
                        {value === 'Direct Message' && <MessageSquare className="h-3 w-3" />}
                        {value === 'Calendar' && <Calendar className="h-3 w-3" />}
                        {value}
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Time-Based Performance</CardTitle>
            <CardDescription>
              Effectiveness over sequence duration
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeBasedPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={formatPercent} />
                <Tooltip formatter={(value) => formatPercent(value as number)} />
                <Legend 
                  formatter={(value, entry, index) => {
                    return (
                      <span className="flex items-center gap-2">
                        {value === 'email' && <Mail className="h-3 w-3" />}
                        {value === 'message' && <MessageSquare className="h-3 w-3" />}
                        {value === 'calendar' && <Calendar className="h-3 w-3" />}
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    );
                  }}
                />
                <Line type="monotone" dataKey="email" stroke="#0088FE" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="message" stroke="#00C49F" />
                <Line type="monotone" dataKey="calendar" stroke="#FFBB28" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Sequences Performance</CardTitle>
          <CardDescription>
            Detailed metrics for currently running sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Sequence</th>
                  <th className="text-center py-3 px-4 font-medium">Started</th>
                  <th className="text-center py-3 px-4 font-medium">Completed</th>
                  <th className="text-center py-3 px-4 font-medium">Open Rate</th>
                  <th className="text-center py-3 px-4 font-medium">Response Rate</th>
                  <th className="text-center py-3 px-4 font-medium">Duration</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeSequences.map((sequence) => (
                  <tr key={sequence.id} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-medium">{sequence.name}</div>
                    </td>
                    <td className="text-center py-3 px-4">{sequence.started}</td>
                    <td className="text-center py-3 px-4">{sequence.completed}</td>
                    <td className="text-center py-3 px-4">
                      {formatPercent(sequence.openRate)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {formatPercent(sequence.clickRate)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {sequence.days} days
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-center">
          <Button variant="outline">
            View All Sequences
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Message Effectiveness</CardTitle>
          <CardDescription>
            Open and response rates by message type
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={openRateData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatPercent} />
              <Tooltip formatter={(value) => formatPercent(value as number)} />
              <Legend />
              <Bar 
                name="Open Rate" 
                dataKey="rate" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              >
                {openRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceAnalytics;
