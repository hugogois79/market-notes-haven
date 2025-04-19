
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TaoValidator } from "@/services/validators/types";
import { StakeHistory } from "../hooks/useValidatorRelationshipData";
import { Badge } from "@/components/ui/badge";

interface StakeManagementPanelProps {
  validator: TaoValidator;
  stakeHistory: StakeHistory[];
  validators: TaoValidator[];
}

const StakeManagementPanel: React.FC<StakeManagementPanelProps> = ({
  validator,
  stakeHistory,
  validators
}) => {
  // Get the latest stake data
  const currentStake = stakeHistory.length > 0 
    ? stakeHistory[stakeHistory.length - 1] 
    : { amount: 0, delegatorCount: 0, date: new Date().toISOString() };

  // Generate mock validator ranking based on stake amount
  const validatorRankings = validators
    .map(v => ({
      id: v.id,
      name: v.name,
      stake: stakeHistory.length > 0 
        ? stakeHistory[stakeHistory.length - 1].amount * (0.5 + Math.random()) 
        : Math.random() * 50000
    }))
    .sort((a, b) => b.stake - a.stake);

  // Find current validator's rank
  const validatorRank = validatorRankings.findIndex(v => v.id === validator.id) + 1;

  // Generate mock reward metrics
  const rewardMetrics = {
    lastDay: (currentStake.amount * 0.0008).toFixed(2),
    lastWeek: (currentStake.amount * 0.005).toFixed(2),
    lastMonth: (currentStake.amount * 0.02).toFixed(2),
    projectedAnnual: (currentStake.amount * 0.08).toFixed(2),
    rewardRate: (Math.random() * 3 + 5).toFixed(2)
  };

  // Generate mock delegator data
  const delegatorTypes = [
    { name: "Individual", value: Math.floor(currentStake.delegatorCount * 0.7) },
    { name: "Institution", value: Math.floor(currentStake.delegatorCount * 0.2) },
    { name: "Exchange", value: Math.floor(currentStake.delegatorCount * 0.1) }
  ];

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Stake Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Current Stake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{currentStake.amount.toLocaleString()}</span>
                <span className="ml-2 text-muted-foreground">TAO</span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Delegators</div>
                    <div className="font-medium">{currentStake.delegatorCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Rank</div>
                    <div className="font-medium">#{validatorRank} of {validators.length}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Reward Rate</div>
                    <div className="font-medium">{rewardMetrics.rewardRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant="outline" className="bg-green-50">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delegator Distribution Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Delegator Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
            {delegatorTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={delegatorTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {delegatorTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                No delegator data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Metrics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Reward Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Last 24 Hours</div>
                  <div className="font-medium">{rewardMetrics.lastDay} TAO</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Week</div>
                  <div className="font-medium">{rewardMetrics.lastWeek} TAO</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Month</div>
                  <div className="font-medium">{rewardMetrics.lastMonth} TAO</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Projected Annual</div>
                  <div className="font-medium">{rewardMetrics.projectedAnnual} TAO</div>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">Reward Rate</div>
                <div className="h-2 w-full bg-gray-100 rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full" 
                    style={{ width: `${parseFloat(rewardMetrics.rewardRate) * 8}%` }} 
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground mt-1">
                  {rewardMetrics.rewardRate}% APR
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stake History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stake History</CardTitle>
          <CardDescription>
            Historical view of stake amount and delegator count over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stakeHistory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stakeHistory}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'amount' ? 'Stake Amount' : 'Delegator Count']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="delegatorCount" 
                    stroke="#82ca9d" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">No stake history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparative Position */}
      <Card>
        <CardHeader>
          <CardTitle>Comparative Position</CardTitle>
          <CardDescription>
            How this validator compares to others in terms of stake
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={validatorRankings.slice(0, 10)}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} TAO`, 'Stake Amount']} />
                  <Bar 
                    dataKey="stake" 
                    fill="#8884d8"
                    // Highlight the current validator
                    animationDuration={300}
                  >
                    {
                      validatorRankings.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.id === validator.id ? '#ff7300' : '#8884d8'} 
                        />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Rank Analysis</h3>
              <p className="text-muted-foreground">
                This validator is currently ranked <strong>#{validatorRank}</strong> out of {validators.length} total validators.
                {validatorRank <= 10 
                  ? " This puts them in the top tier of validators by stake amount."
                  : validatorRank <= Math.floor(validators.length / 3)
                    ? " This puts them in the upper third of validators by stake amount."
                    : validatorRank <= Math.floor(validators.length * 2 / 3)
                      ? " This puts them in the middle third of validators by stake amount."
                      : " This puts them in the lower third of validators by stake amount."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StakeManagementPanel;
