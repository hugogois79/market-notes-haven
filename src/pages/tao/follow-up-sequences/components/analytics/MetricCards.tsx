
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  subValue: string;
}

const MetricCard = ({ title, value, subValue }: MetricCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-primary">
        {value}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {subValue}
      </p>
    </CardContent>
  </Card>
);

interface MetricCardsProps {
  activeSequences: Array<{
    started: number;
    completed: number;
    clickRate: number;
  }>;
}

export const MetricCards = ({ activeSequences }: MetricCardsProps) => {
  const totalStarted = activeSequences.reduce((acc, seq) => acc + seq.started, 0);
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Active Sequences"
        value={activeSequences.length.toString()}
        subValue={`Across ${totalStarted} stakeholders`}
      />
      <MetricCard
        title="Average Completion Rate"
        value={formatPercent(activeSequences.reduce((acc, seq) => acc + (seq.completed / seq.started), 0) / activeSequences.length)}
        subValue={`${activeSequences.reduce((acc, seq) => acc + seq.completed, 0)} sequences completed`}
      />
      <MetricCard
        title="Average Response Rate"
        value={formatPercent(activeSequences.reduce((acc, seq) => acc + seq.clickRate, 0) / activeSequences.length)}
        subValue={`From ${totalStarted} sequence starts`}
      />
    </div>
  );
};
