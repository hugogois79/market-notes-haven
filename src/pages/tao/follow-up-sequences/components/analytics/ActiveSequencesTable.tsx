
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  started: number;
  completed: number;
  openRate: number;
  clickRate: number;
  days: number;
}

interface ActiveSequencesTableProps {
  sequences: Sequence[];
}

export const ActiveSequencesTable = ({ sequences }: ActiveSequencesTableProps) => {
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
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
              {sequences.map((sequence) => (
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
  );
};
