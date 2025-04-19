
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart, 
  FileCheck,
  ArrowRight,
  AlertTriangle,
  X
} from "lucide-react";
import { SubnetProject, OpportunityMatch, InvestorMeeting } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import CommunicationTemplates from "./CommunicationTemplates";
import MeetingScheduler from "./MeetingScheduler";

interface ProjectDetailViewProps {
  project: SubnetProject;
  matchData?: OpportunityMatch;
  comparisonProjects?: SubnetProject[];
  meetings: InvestorMeeting[];
  onScheduleMeeting: (meeting: Omit<InvestorMeeting, "id">) => Promise<InvestorMeeting>;
  onClose: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  matchData,
  meetings,
  onScheduleMeeting,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const getRiskLabel = (value: number) => {
    if (value <= 3) return "Low";
    if (value <= 6) return "Medium";
    return "High";
  };
  
  const getRiskColor = (value: number) => {
    if (value <= 3) return "bg-green-100 text-green-800";
    if (value <= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-lime-100 text-lime-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    if (score >= 20) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const projectMeetings = meetings.filter(meeting => meeting.projectId === project.id);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {project.description}
            </CardDescription>
            <div className="flex items-center mt-3 space-x-2">
              <Badge variant="outline" className="capitalize">
                {project.stage} stage
              </Badge>
              {matchData && (
                <Badge className={getMatchScoreColor(matchData.matchScore)}>
                  {Math.round(matchData.matchScore)}% Match
                </Badge>
              )}
              <Badge className={getRiskColor(project.riskAssessment.overall)}>
                {getRiskLabel(project.riskAssessment.overall)} Risk
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="match-analysis">Match Analysis</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Funding Target</div>
                    <div className="text-2xl font-semibold">${project.fundingTarget.toLocaleString()}</div>
                    <Progress 
                      value={(project.currentFunding / project.fundingTarget) * 100}
                      className="h-2 mt-2"
                    />
                    <div className="text-sm mt-1">
                      {Math.round((project.currentFunding / project.fundingTarget) * 100)}% funded
                      (${project.currentFunding.toLocaleString()})
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Expected ROI</div>
                    <div className="text-2xl font-semibold">{project.roi.projected}x</div>
                    <div className="text-sm flex items-center mt-2">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {project.roi.timeframeMonths} month timeframe
                    </div>
                  </div>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Project Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="h-full border-l border-dashed border-gray-300 mx-auto my-2"></div>
                        </div>
                        <div>
                          <div className="font-medium">Project Created</div>
                          <div className="text-sm text-muted-foreground">
                            {project.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-sm mt-1">
                            Initial concept and team formation
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="h-full border-l border-dashed border-gray-300 mx-auto my-2"></div>
                        </div>
                        <div>
                          <div className="font-medium">Funding Phase</div>
                          <div className="text-sm text-muted-foreground">
                            In progress
                          </div>
                          <div className="text-sm mt-1">
                            Targeting ${project.fundingTarget.toLocaleString()} total investment
                          </div>
                        </div>
                      </div>
                      
                      {project.launchDate ? (
                        <div className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <FileCheck className="h-4 w-4 text-purple-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Subnet Launch</div>
                            <div className="text-sm text-muted-foreground">
                              {project.launchDate.toLocaleDateString()}
                            </div>
                            <div className="text-sm mt-1">
                              Full production deployment planned
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Launch Date</div>
                            <div className="text-sm text-muted-foreground">
                              Not yet scheduled
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Lead Validators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.leadValidators.map((validator, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{validator.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {validator.organization_type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Technical Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.technicalAreas.map((area, i) => (
                        <Badge key={i} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Invest in Project
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Contact Team
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Technical Tab */}
          <TabsContent value="technical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Technical Risk</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={getRiskColor(project.riskAssessment.technical)}>
                              {getRiskLabel(project.riskAssessment.technical)}
                            </Badge>
                            <Progress 
                              value={project.riskAssessment.technical * 10} 
                              className="w-24 ml-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Market Risk</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={getRiskColor(project.riskAssessment.market)}>
                              {getRiskLabel(project.riskAssessment.market)}
                            </Badge>
                            <Progress 
                              value={project.riskAssessment.market * 10} 
                              className="w-24 ml-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Team Risk</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={getRiskColor(project.riskAssessment.team)}>
                              {getRiskLabel(project.riskAssessment.team)}
                            </Badge>
                            <Progress 
                              value={project.riskAssessment.team * 10} 
                              className="w-24 ml-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Regulatory Risk</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={getRiskColor(project.riskAssessment.regulatory)}>
                              {getRiskLabel(project.riskAssessment.regulatory)}
                            </Badge>
                            <Progress 
                              value={project.riskAssessment.regulatory * 10} 
                              className="w-24 ml-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Overall Risk</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge className={getRiskColor(project.riskAssessment.overall)}>
                              {getRiskLabel(project.riskAssessment.overall)}
                            </Badge>
                            <Progress 
                              value={project.riskAssessment.overall * 10} 
                              className="w-24 ml-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Risk Assessment Notes</h4>
                    <p className="text-sm">{project.riskAssessment.notes}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Subnet Configuration</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Subnet ID</TableCell>
                          <TableCell>{project.subnetId}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Subnet Name</TableCell>
                          <TableCell>{project.subnet?.name || "Unknown"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Neurons</TableCell>
                          <TableCell>{project.subnet?.neurons || "Unknown"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Emission Rate</TableCell>
                          <TableCell>{project.subnet?.emission || "Unknown"}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Technical Architecture</h4>
                    <div className="rounded-md bg-gray-50 p-4">
                      <p className="text-sm">
                        This subnet project leverages a distributed architecture with {project.subnet?.neurons} neurons for
                        processing {project.technicalAreas.join(", ")} workloads. The technical implementation includes
                        specialized validators with expertise in these domains.
                      </p>
                      <div className="mt-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 inline mr-1" />
                        <span className="text-xs text-amber-500">
                          Technical documentation is available upon request after signing NDA.
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Performance Projections</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Initial Performance</TableCell>
                          <TableCell>Baseline</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">6 Month Projection</TableCell>
                          <TableCell>+120% vs baseline</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">12 Month Projection</TableCell>
                          <TableCell>+210% vs baseline</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Match Analysis Tab */}
          <TabsContent value="match-analysis">
            {matchData ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Score Analysis</CardTitle>
                    <CardDescription>
                      How this opportunity aligns with your investment preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Match Score</span>
                        <span className={`text-lg font-bold ${
                          matchData.matchScore >= 80 ? "text-green-600" :
                          matchData.matchScore >= 60 ? "text-lime-600" :
                          matchData.matchScore >= 40 ? "text-yellow-600" :
                          matchData.matchScore >= 20 ? "text-orange-600" :
                          "text-red-600"
                        }`}>
                          {Math.round(matchData.matchScore)}%
                        </span>
                      </div>
                      <Progress value={matchData.matchScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Subnet Type Match</span>
                          <span className="text-sm font-medium">
                            {Math.round(matchData.matchDetails.subnetTypeMatch)}%
                          </span>
                        </div>
                        <Progress value={matchData.matchDetails.subnetTypeMatch} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Technical Focus Match</span>
                          <span className="text-sm font-medium">
                            {Math.round(matchData.matchDetails.technicalFocusMatch)}%
                          </span>
                        </div>
                        <Progress value={matchData.matchDetails.technicalFocusMatch} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Stage Match</span>
                          <span className="text-sm font-medium">
                            {Math.round(matchData.matchDetails.stageMatch)}%
                          </span>
                        </div>
                        <Progress value={matchData.matchDetails.stageMatch} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Ticket Size Match</span>
                          <span className="text-sm font-medium">
                            {Math.round(matchData.matchDetails.ticketSizeMatch)}%
                          </span>
                        </div>
                        <Progress value={matchData.matchDetails.ticketSizeMatch} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Risk Alignment Match</span>
                          <span className="text-sm font-medium">
                            {Math.round(matchData.matchDetails.riskAlignmentMatch)}%
                          </span>
                        </div>
                        <Progress value={matchData.matchDetails.riskAlignmentMatch} className="h-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {matchData.comparisonProjects && matchData.comparisonProjects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparative Analysis</CardTitle>
                      <CardDescription>
                        How this project compares to similar opportunities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Funding</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>ROI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-bold">{project.name}</TableCell>
                            <TableCell>{project.stage}</TableCell>
                            <TableCell>${project.fundingTarget.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getRiskColor(project.riskAssessment.overall)}>
                                {getRiskLabel(project.riskAssessment.overall)}
                              </Badge>
                            </TableCell>
                            <TableCell>{project.roi.projected}x</TableCell>
                          </TableRow>
                          {matchData.comparisonProjects.map((compProject, i) => (
                            <TableRow key={i}>
                              <TableCell>{compProject.name}</TableCell>
                              <TableCell>{compProject.stage}</TableCell>
                              <TableCell>${compProject.fundingTarget.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge className={getRiskColor(compProject.riskAssessment.overall)}>
                                  {getRiskLabel(compProject.riskAssessment.overall)}
                                </Badge>
                              </TableCell>
                              <TableCell>{compProject.roi.projected}x</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4 text-sm">
                        <h4 className="font-medium mb-2">Analysis Summary</h4>
                        <p>
                          Compared to similar projects in the {project.stage} stage with focus on 
                          {project.technicalAreas.join(", ")}, this project offers 
                          {project.roi.projected > 
                            (matchData.comparisonProjects.reduce((sum, p) => sum + p.roi.projected, 0) / 
                            matchData.comparisonProjects.length) ? 
                            " higher" : " comparable"} potential ROI 
                          with {project.riskAssessment.overall < 
                            (matchData.comparisonProjects.reduce((sum, p) => sum + p.riskAssessment.overall, 0) / 
                            matchData.comparisonProjects.length) ? 
                            " lower" : " similar"} risk profile.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Match analysis not available</p>
              </div>
            )}
          </TabsContent>
          
          {/* Communications Tab */}
          <TabsContent value="communications">
            <CommunicationTemplates project={project} />
          </TabsContent>
          
          {/* Meetings Tab */}
          <TabsContent value="meetings">
            <MeetingScheduler
              project={project}
              meetings={projectMeetings}
              onScheduleMeeting={onScheduleMeeting}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-6 flex justify-between">
        <Button variant="outline">
          Download Investment Memorandum
        </Button>
        <Button>
          Proceed to Investment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectDetailView;
