
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Legend
} from "recharts";
import { Investment } from "../types";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";

interface PortfolioManagementDashboardProps {
  investments: Investment[];
  portfolioAnalytics: {
    totalInvested: number;
    totalReturns: number;
    overallRoi: number;
    diversification: { category: string; percentage: number }[];
    performanceByStage: { stage: string; roi: number }[];
    riskExposure: { risk: string; percentage: number }[];
  } | undefined;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8DD1E1'];

const PortfolioManagementDashboard: React.FC<PortfolioManagementDashboardProps> = ({
  investments,
  portfolioAnalytics,
  isLoading
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "committed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "deployed": return "bg-green-100 text-green-800";
      case "exited": return "bg-purple-100 text-purple-800";
      default: return "";
    }
  };

  // Mock data for performance chart
  const performanceData = [
    { month: 'Jan', value: 100 },
    { month: 'Feb', value: 105 },
    { month: 'Mar', value: 110 },
    { month: 'Apr', value: 108 },
    { month: 'May', value: 115 },
    { month: 'Jun', value: 120 },
    { month: 'Jul', value: 130 },
    { month: 'Aug', value: 135 },
    { month: 'Sep', value: 140 },
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioAnalytics?.totalInvested.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {investments.length} projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioAnalytics?.totalReturns.toLocaleString() || "0"}
            </div>
            <div className="flex items-center mt-1">
              {(portfolioAnalytics?.overallRoi || 0) > 0 ? (
                <div className="text-xs text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {((portfolioAnalytics?.overallRoi || 0) * 100).toFixed(2)}% return
                </div>
              ) : (
                <div className="text-xs text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {Math.abs((portfolioAnalytics?.overallRoi || 0) * 100).toFixed(2)}% loss
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs text-green-600">+40% growth ytd</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Portfolio Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diversification Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Diversification</CardTitle>
            <CardDescription>
              Allocation across different subnet types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioAnalytics?.diversification || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="category"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(portfolioAnalytics?.diversification || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Performance by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Stage</CardTitle>
            <CardDescription>
              ROI comparison across different project stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={portfolioAnalytics?.performanceByStage || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value) => `${(value * 100).toFixed(2)}%`} />
                  <Bar dataKey="roi" fill="#8884d8">
                    {(portfolioAnalytics?.performanceByStage || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Investments</CardTitle>
          <CardDescription>
            Your current subnet project investments and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading investments...</p>
            </div>
          ) : investments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Returns</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      {investment.project?.name || "Unknown Project"}
                      <div className="text-xs text-muted-foreground mt-1">
                        {investment.project?.stage.charAt(0).toUpperCase() + investment.project?.stage.slice(1)} stage
                      </div>
                    </TableCell>
                    <TableCell>${investment.amount.toLocaleString()}</TableCell>
                    <TableCell>{investment.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(investment.status)}>
                        {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>${investment.returns?.amount.toLocaleString() || "-"}</TableCell>
                    <TableCell>
                      {investment.returns ? (
                        <div className={`font-medium ${investment.returns.roi > 0 ? "text-green-600" : "text-red-600"}`}>
                          {investment.returns.roi > 0 ? "+" : ""}
                          {(investment.returns.roi * 100).toFixed(2)}%
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No investments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagementDashboard;
