
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Mail, MessageSquare, Calendar } from "lucide-react";

interface TimePerformanceData {
  day: string;
  email: number;
  message: number;
  calendar: number;
}

interface TimePerformanceChartProps {
  data: TimePerformanceData[];
}

export const TimePerformanceChart = ({ data }: TimePerformanceChartProps) => {
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-Based Performance</CardTitle>
        <CardDescription>
          Effectiveness over sequence duration
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <div className="w-full h-full">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={formatPercent} />
            <Tooltip formatter={(value) => formatPercent(value as number)} />
            <Legend 
              formatter={(value) => (
                <span className="flex items-center gap-2">
                  {value === 'email' && <Mail className="h-3 w-3" />}
                  {value === 'message' && <MessageSquare className="h-3 w-3" />}
                  {value === 'calendar' && <Calendar className="h-3 w-3" />}
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
            <Line type="monotone" dataKey="email" stroke="#0088FE" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="message" stroke="#00C49F" />
            <Line type="monotone" dataKey="calendar" stroke="#FFBB28" />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  );
};
