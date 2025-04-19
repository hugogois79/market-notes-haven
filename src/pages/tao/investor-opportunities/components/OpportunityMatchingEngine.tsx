
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { OpportunityMatch, SubnetProject } from "../types";
import { 
  Calendar, 
  ChevronRight,
  Search, 
  SlidersHorizontal,
  Zap,
  AlertCircle
} from "lucide-react";

interface OpportunityMatchingEngineProps {
  matchedOpportunities: OpportunityMatch[];
  isLoading: boolean;
  onSelectProject: (project: SubnetProject) => void;
}

const OpportunityMatchingEngine: React.FC<OpportunityMatchingEngineProps> = ({
  matchedOpportunities,
  isLoading,
  onSelectProject
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(0);
  
  // Filter opportunities
  const filteredOpportunities = matchedOpportunities
    .filter(match => {
      // Filter by search term
      const searchMatch = 
        match.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.project.technicalAreas.some(area => 
          area.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Filter by stage
      const stageMatch = stageFilter === "all" || match.project.stage === stageFilter;
      
      // Filter by score
      const scoreMatch = match.matchScore >= minScore;
      
      return searchMatch && stageMatch && scoreMatch;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
  
  const handleScoreFilterChange = (value: string) => {
    setMinScore(Number(value));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-lime-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };
  
  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return "Low";
    if (risk <= 6) return "Medium";
    return "High";
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return "bg-green-100 text-green-800";
    if (risk <= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Opportunity Matching Engine</CardTitle>
        </div>
        <CardDescription>
          Find subnet projects that match your investment criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-40">
                <Select
                  value={stageFilter}
                  onValueChange={setStageFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="early">Early</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Select
                  defaultValue="0"
                  onValueChange={handleScoreFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Minimum match score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Match Score</SelectItem>
                    <SelectItem value="50">50% or higher</SelectItem>
                    <SelectItem value="70">70% or higher</SelectItem>
                    <SelectItem value="90">90% or higher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <p>Loading opportunities...</p>
            </div>
          ) : filteredOpportunities.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Project</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Technical Areas</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((match) => (
                    <TableRow key={match.project.id}>
                      <TableCell className="font-medium">
                        <div>
                          {match.project.name}
                          <div className="text-sm text-muted-foreground mt-1">
                            {match.project.description.substring(0, 60)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-semibold ${getScoreColor(match.matchScore)}`}>
                            {Math.round(match.matchScore)}%
                          </div>
                          <Progress value={match.matchScore} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {match.project.stage.charAt(0).toUpperCase() + match.project.stage.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>${match.project.fundingTarget.toLocaleString()}</span>
                          <Progress 
                            value={(match.project.currentFunding / match.project.fundingTarget) * 100} 
                            className="h-2 mt-1" 
                          />
                          <span className="text-xs text-muted-foreground mt-1">
                            {Math.round((match.project.currentFunding / match.project.fundingTarget) * 100)}% funded
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(match.project.riskAssessment.overall)}>
                          {getRiskLabel(match.project.riskAssessment.overall)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {match.project.technicalAreas.slice(0, 2).map((area, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {match.project.technicalAreas.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{match.project.technicalAreas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <span className="font-semibold">{match.project.roi.projected}x</span>
                          <span className="text-xs text-muted-foreground">
                            {match.project.roi.timeframeMonths} months
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectProject(match.project)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No matching opportunities found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Try adjusting your search criteria or investment preferences to see more opportunities.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityMatchingEngine;
