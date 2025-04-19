
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  subValue: string;
  trend?: {
    value: number;
    label: string;
  };
}

const MetricCard = ({ title, value, subValue, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-primary">
        {value}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground mt-1">
          {subValue}
        </p>
        {trend && (
          <div className={`text-xs ${trend.value > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

interface MetricCardsProps {
  activeSequences: Array<{
    started: number;
    completed: number;
    clickRate: number;
    responseRate?: number;
  }>;
}

export const MetricCards = ({ activeSequences }: MetricCardsProps) => {
  const totalStarted = activeSequences.reduce((acc, seq) => acc + seq.started, 0);
  const totalCompleted = activeSequences.reduce((acc, seq) => acc + seq.completed, 0);
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
  
  const avgCompletionRate = activeSequences.length 
    ? activeSequences.reduce((acc, seq) => acc + (seq.completed / seq.started), 0) / activeSequences.length
    : 0;
    
  const avgClickRate = activeSequences.length
    ? activeSequences.reduce((acc, seq) => acc + seq.clickRate, 0) / activeSequences.length
    : 0;
    
  const avgResponseRate = activeSequences.length && activeSequences[0].responseRate !== undefined
    ? activeSequences.reduce((acc, seq) => acc + (seq.responseRate || 0), 0) / activeSequences.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Active Sequences"
        value={activeSequences.length.toString()}
        subValue={`Across ${totalStarted} stakeholders`}
        trend={{ value: 12, label: "from last period" }}
      />
      <MetricCard
        title="Completion Rate"
        value={formatPercent(avgCompletionRate)}
        subValue={`${totalCompleted} sequences completed`}
        trend={{ value: 3.2, label: "from last period" }}
      />
      <MetricCard
        title="Click-Through Rate"
        value={formatPercent(avgClickRate)}
        subValue={`From ${totalStarted} sequence starts`}
        trend={{ value: -1.5, label: "from last period" }}
      />
      {activeSequences[0]?.responseRate !== undefined && (
        <MetricCard
          title="Response Rate"
          value={formatPercent(avgResponseRate)}
          subValue="Average stakeholder responses"
          trend={{ value: 5.7, label: "from last period" }}
        />
      )}
    </div>
  );
};
