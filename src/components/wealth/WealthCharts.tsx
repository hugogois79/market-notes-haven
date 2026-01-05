import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { WealthAsset, WealthPortfolioSnapshot, formatEUR } from "@/services/wealthService";

interface WealthChartsProps {
  assets: WealthAsset[];
  snapshots: WealthPortfolioSnapshot[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Real Estate': '#3B82F6',
  'Crypto': '#F59E0B',
  'Fine Art': '#8B5CF6',
  'Watches': '#EC4899',
  'Vehicles': '#10B981',
  'Private Equity': '#6366F1',
  'Cash': '#64748B',
  'Other': '#94A3B8',
};

const WealthCharts = ({ assets, snapshots }: WealthChartsProps) => {
  // Calculate allocation by category
  const activeAssets = assets.filter(a => a.status !== 'Sold' && a.status !== 'Recovery');
  const allocationData = Object.entries(
    activeAssets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + (asset.current_value || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#94A3B8',
  })).filter(d => d.value > 0);

  const totalValue = allocationData.reduce((sum, d) => sum + d.value, 0);

  // Net worth history
  const netWorthData = snapshots.length > 0 
    ? snapshots.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }),
        netWorth: s.net_worth,
      }))
    : [
        { date: 'Jan 24', netWorth: 2800000 },
        { date: 'Fev 24', netWorth: 2950000 },
        { date: 'Mar 24', netWorth: 3100000 },
        { date: 'Abr 24', netWorth: 3050000 },
        { date: 'Mai 24', netWorth: 3200000 },
        { date: 'Jun 24', netWorth: 3350000 },
        { date: 'Jul 24', netWorth: 3500000 },
        { date: 'Ago 24', netWorth: 3450000 },
        { date: 'Set 24', netWorth: 3600000 },
        { date: 'Out 24', netWorth: 3700000 },
        { date: 'Nov 24', netWorth: 3850000 },
        { date: 'Dez 24', netWorth: totalValue || 4000000 },
      ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3">
          <p className="font-semibold text-slate-900">{payload[0].payload.name}</p>
          <p className="text-slate-600 font-mono">{formatEUR(payload[0].value)}</p>
          <p className="text-slate-500 text-sm">
            {((payload[0].value / totalValue) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const LineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3">
          <p className="font-medium text-slate-600">{label}</p>
          <p className="font-bold font-mono text-slate-900">{formatEUR(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Allocation */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Portfolio Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {allocationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-900">
                    {((item.value / totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Worth History */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Net Worth History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(value) => `€${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<LineTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5, fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WealthCharts;
