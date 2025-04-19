
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Mail, MessageSquare, Calendar } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ChannelData {
  name: string;
  value: number;
}

interface ChannelEffectivenessChartProps {
  data: ChannelData[];
}

export const ChannelEffectivenessChart = ({ data }: ChannelEffectivenessChartProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Channel Effectiveness</CardTitle>
      <CardDescription>
        Engagement by communication channel
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[300px]">
      <div className="w-full h-full">
        <PieChart width={400} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Messages']} />
          <Legend 
            formatter={(value) => (
              <span className="flex items-center gap-2">
                {value === 'Email' && <Mail className="h-3 w-3" />}
                {value === 'Direct Message' && <MessageSquare className="h-3 w-3" />}
                {value === 'Calendar' && <Calendar className="h-3 w-3" />}
                {value}
              </span>
            )}
          />
        </PieChart>
      </div>
    </CardContent>
  </Card>
);
