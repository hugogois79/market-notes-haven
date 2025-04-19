
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart2, Eye, MessageSquare, Users } from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  started: number;
  completed: number;
  clickRate: number;
  responseRate?: number;
  stakeholderType: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  steps: number;
  averageCompletionTime: number;
}

interface ActiveSequencesTableProps {
  sequences: Sequence[];
}

export const ActiveSequencesTable = ({ sequences }: ActiveSequencesTableProps) => {
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
  
  if (sequences.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground">No active sequences found</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sequence Name</TableHead>
            <TableHead>Stakeholder</TableHead>
            <TableHead className="text-center">Started</TableHead>
            <TableHead className="text-center">Completed</TableHead>
            <TableHead className="text-center">Completion Rate</TableHead>
            <TableHead className="text-center">Avg. Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sequences.map((sequence) => (
            <TableRow key={sequence.id}>
              <TableCell className="font-medium">{sequence.name}</TableCell>
              <TableCell>
                <Badge variant={sequence.stakeholderType === "validator" ? "default" : (sequence.stakeholderType === "subnet_owner" ? "outline" : "secondary")}>
                  {sequence.stakeholderType.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{sequence.started}</TableCell>
              <TableCell className="text-center">{sequence.completed}</TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${
                  (sequence.completed / sequence.started) > 0.7 ? 'text-green-600' : 
                  (sequence.completed / sequence.started) > 0.4 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {formatPercent(sequence.completed / sequence.started)}
                </span>
              </TableCell>
              <TableCell className="text-center">{sequence.averageCompletionTime.toFixed(1)} days</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
