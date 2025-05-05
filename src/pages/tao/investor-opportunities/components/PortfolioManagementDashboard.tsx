
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Investment, SubnetProject } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import InvestmentEditDialog from "./InvestmentEditDialog";

interface PortfolioManagementDashboardProps {
  investments: Investment[];
  portfolioAnalytics?: {
    totalInvested: number;
    totalReturns: number;
    overallRoi: number;
    diversification: { category: string; percentage: number }[];
    performanceByStage: { stage: string; roi: number }[];
    riskExposure: { risk: string; percentage: number }[];
  };
  isLoading: boolean;
  saveInvestment: (investment: Partial<Investment>) => Promise<Investment>;
  projects: SubnetProject[];
}

const PortfolioManagementDashboard: React.FC<PortfolioManagementDashboardProps> = ({
  investments,
  portfolioAnalytics,
  isLoading,
  saveInvestment,
  projects,
}) => {
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditInvestment = (investment: Investment) => {
    setEditInvestment(investment);
    setIsEditDialogOpen(true);
  };

  const projectsMap = projects.reduce((acc, project) => {
    acc[project.id] = project;
    return acc;
  }, {} as Record<string, SubnetProject>);

  // Set up colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading portfolio data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Invested</CardTitle>
            <CardDescription>Across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioAnalytics?.totalInvested || 0)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Across {investments.length} projects
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Returns</CardTitle>
            <CardDescription>From all investments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(portfolioAnalytics?.totalReturns || 0)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className={`${(portfolioAnalytics?.overallRoi || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {((portfolioAnalytics?.overallRoi || 0) * 100).toFixed(2)}% return
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance Trend</CardTitle>
            <CardDescription>Month over month growth</CardDescription>
          </CardHeader>
          <CardContent className="h-[80px]">
            <div className="text-3xl font-bold">
              <span className="text-green-500">+4.2%</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diversification Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Diversification</CardTitle>
            <CardDescription>Allocation across different subnet types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioAnalytics?.diversification || []}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  nameKey="category"
                >
                  {portfolioAnalytics?.diversification.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by Stage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Stage</CardTitle>
            <CardDescription>ROI comparison across different project stages</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={portfolioAnalytics?.performanceByStage || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
                <Bar dataKey="roi" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Current Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Investments</CardTitle>
          <CardDescription>Your current subnet project investments and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Returns</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => {
                const project = investment.project || projectsMap[investment.projectId];
                return (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      <div>{project?.name || investment.projectId}</div>
                      <div className="text-xs text-muted-foreground">
                        {project?.stage} stage
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(investment.amount)}</TableCell>
                    <TableCell>{new Date(investment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        investment.status === 'deployed' ? 'bg-green-100 text-green-800' :
                        investment.status === 'committed' ? 'bg-blue-100 text-blue-800' : 
                        investment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {investment.returns ? formatCurrency(investment.returns.amount) : '-'}
                    </TableCell>
                    <TableCell>
                      {investment.returns ? (
                        <span className={investment.returns.roi > 0 ? 'text-green-600' : 'text-red-600'}>
                          {(investment.returns.roi * 100).toFixed(2)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInvestment(investment)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {investments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No investments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Investment Dialog */}
      {editInvestment && projectsMap[editInvestment.projectId] && (
        <InvestmentEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          investment={editInvestment}
          project={projectsMap[editInvestment.projectId]}
          onSave={saveInvestment}
        />
      )}
    </div>
  );
};

export default PortfolioManagementDashboard;
