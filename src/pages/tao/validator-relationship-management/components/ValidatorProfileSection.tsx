
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { TaoValidator } from "@/services/validators/types";
import { TaoSubnet } from "@/services/subnets/types";
import { TaoContactLog } from "@/services/contact-logs/types";
import { ValidatorMetrics } from "../hooks/useValidatorRelationshipData";
import { Badge } from "@/components/ui/badge";

interface ValidatorProfileSectionProps {
  validator: TaoValidator;
  metrics: ValidatorMetrics | null;
  subnets: TaoSubnet[];
  communicationHistory: TaoContactLog[];
  refreshData: () => void;
}

const ValidatorProfileSection: React.FC<ValidatorProfileSectionProps> = ({
  validator,
  metrics,
  subnets,
  communicationHistory,
  refreshData
}) => {
  const [profileTab, setProfileTab] = useState("technical");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Validator Profile</h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-medium">{validator.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Organization Type</dt>
                <dd>{validator.organization_type}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">CRM Stage</dt>
                <dd>
                  <Badge variant="outline">{validator.crm_stage}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Priority</dt>
                <dd>{validator.priority}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Contact Email</dt>
                <dd>{validator.email || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Wallet Address</dt>
                <dd className="text-xs break-all">{validator.wallet_address || "Not provided"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Performance Metrics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Score</span>
                  <div className="text-3xl font-bold">{metrics.performanceScore}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span>{metrics.uptime}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hardware</span>
                    <span className="text-xs">{metrics.hardwareSpecs}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Specializations</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metrics.specialty.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Loading metrics...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Preferences Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Contact Methods:</h4>
                <ul className="mt-2 space-y-1">
                  {validator.email && (
                    <li className="flex justify-between">
                      <span className="text-sm">Email</span>
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    </li>
                  )}
                  {validator.telegram && (
                    <li className="flex justify-between">
                      <span className="text-sm">Telegram</span>
                      <Badge variant="outline" className="text-xs">Secondary</Badge>
                    </li>
                  )}
                  {validator.linkedin && (
                    <li className="flex justify-between">
                      <span className="text-sm">LinkedIn</span>
                      <Badge variant="outline" className="text-xs">Professional</Badge>
                    </li>
                  )}
                  {!validator.email && !validator.telegram && !validator.linkedin && (
                    <li className="text-sm text-muted-foreground">No contact methods provided</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium">Recent Communication:</h4>
                <div className="mt-2">
                  {communicationHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {communicationHistory.slice(0, 3).map((log) => (
                        <li key={log.id} className="text-xs border-l-2 border-primary pl-2">
                          <div className="font-medium">{new Date(log.contact_date).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">{log.method}</div>
                          <div className="truncate">{log.summary}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No communication history</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Profile Tabs */}
      <Tabs value={profileTab} onValueChange={setProfileTab}>
        <TabsList>
          <TabsTrigger value="technical">Technical Profile</TabsTrigger>
          <TabsTrigger value="subnets">Subnet Participation</TabsTrigger>
          <TabsTrigger value="performance">Historical Performance</TabsTrigger>
          <TabsTrigger value="communication">Communication History</TabsTrigger>
        </TabsList>

        {/* Technical Profile Tab */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Capabilities</CardTitle>
              <CardDescription>
                Detailed view of technical specifications and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Hardware Specifications</h3>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-muted-foreground">CPU</dt>
                          <dd>{metrics.hardwareSpecs.split(',')[0].replace('CPU: ', '')}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Memory</dt>
                          <dd>{metrics.hardwareSpecs.split(',')[1].replace('RAM: ', '')}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Storage</dt>
                          <dd>{metrics.hardwareSpecs.split(',')[2].replace('Storage: ', '')}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Network</dt>
                          <dd>10 Gbps Dedicated Line</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">Location</dt>
                          <dd>Frankfurt, Germany</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Specializations</h3>
                      <div className="space-y-3">
                        {metrics.specialty.map((specialty, index) => (
                          <div key={index}>
                            <h4 className="text-sm font-medium">{specialty}</h4>
                            <div className="h-2 w-full bg-secondary mt-1 rounded-full">
                              <div 
                                className="h-2 bg-primary rounded-full" 
                                style={{ width: `${70 + Math.random() * 25}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Reliability Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="text-2xl font-bold">{metrics.uptime}%</div>
                        <div className="text-xs text-muted-foreground">Last 30 days</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Response Time</div>
                        <div className="text-2xl font-bold">42ms</div>
                        <div className="text-xs text-muted-foreground">Average</div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Issue Resolution</div>
                        <div className="text-2xl font-bold">3.2h</div>
                        <div className="text-xs text-muted-foreground">Average time</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-12">
                  <p className="text-muted-foreground">Loading technical data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subnet Participation Tab */}
        <TabsContent value="subnets">
          <Card>
            <CardHeader>
              <CardTitle>Subnet Participation History</CardTitle>
              <CardDescription>
                Overview of all subnets this validator participates in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subnets.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Subnet Name</th>
                          <th className="text-center p-2">Subnet ID</th>
                          <th className="text-center p-2">Neurons</th>
                          <th className="text-right p-2">Emission Rate</th>
                          <th className="text-right p-2">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subnets.map((subnet) => (
                          <tr key={subnet.id} className="border-b">
                            <td className="p-2 font-medium">{subnet.name}</td>
                            <td className="p-2 text-center">{subnet.id}</td>
                            <td className="p-2 text-center">{subnet.neurons}</td>
                            <td className="p-2 text-right">{subnet.emission}</td>
                            <td className="p-2 text-right">{new Date(subnet.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Subnet Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={subnets.map(subnet => ({
                            name: subnet.name,
                            neurons: subnet.neurons,
                            emission: parseFloat(subnet.emission)
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="neurons" 
                            stackId="1" 
                            stroke="#8884d8" 
                            fill="#8884d8" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="emission" 
                            stackId="2" 
                            stroke="#82ca9d" 
                            fill="#82ca9d" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    This validator is not participating in any subnets yet.
                  </p>
                  <Button className="mt-4" variant="outline">
                    Add to Subnet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historical Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
              <CardDescription>
                Performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && metrics.historicalPerformance.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metrics.historicalPerformance}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis domain={[60, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}`, 'Performance Score']}
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Average Score</div>
                      <div className="text-2xl font-bold">
                        {(metrics.historicalPerformance.reduce((sum, item) => sum + item.score, 0) / 
                          metrics.historicalPerformance.length).toFixed(1)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Highest Score</div>
                      <div className="text-2xl font-bold">
                        {Math.max(...metrics.historicalPerformance.map(item => item.score)).toFixed(1)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Last 7 Days Trend</div>
                      <div className="text-2xl font-bold">
                        {(metrics.historicalPerformance[metrics.historicalPerformance.length - 1].score - 
                          metrics.historicalPerformance[metrics.historicalPerformance.length - 8].score).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Performance Analysis</h3>
                    <p className="text-muted-foreground">
                      This validator has shown {
                        metrics.historicalPerformance[metrics.historicalPerformance.length - 1].score >
                        metrics.historicalPerformance[0].score ? 'improvement' : 'decline'
                      } over the last 30 days. The performance is {
                        metrics.performanceScore > 85 ? 'excellent' : 
                        metrics.performanceScore > 75 ? 'good' :
                        metrics.performanceScore > 65 ? 'average' : 'below average'
                      }.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-12">
                  <p className="text-muted-foreground">No performance history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication History Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                Complete history of interactions with this validator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {communicationHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Method</th>
                          <th className="text-left p-2">Summary</th>
                          <th className="text-left p-2">Next Steps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communicationHistory.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="p-2 whitespace-nowrap">
                              {new Date(log.contact_date).toLocaleDateString()}
                            </td>
                            <td className="p-2">{log.method}</td>
                            <td className="p-2">{log.summary}</td>
                            <td className="p-2">{log.next_steps || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Contact Frequency</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={
                            (() => {
                              // Group by month and count
                              const now = new Date();
                              const sixMonthsAgo = new Date();
                              sixMonthsAgo.setMonth(now.getMonth() - 6);
                              
                              // Create an array of the last 6 months
                              const months = [];
                              for (let i = 0; i <= 6; i++) {
                                const d = new Date(sixMonthsAgo);
                                d.setMonth(d.getMonth() + i);
                                months.push({
                                  month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                                  count: 0,
                                  date: new Date(d)
                                });
                              }
                              
                              // Count contacts per month
                              communicationHistory.forEach(log => {
                                const logDate = new Date(log.contact_date);
                                months.forEach(m => {
                                  if (logDate.getMonth() === m.date.getMonth() && 
                                      logDate.getFullYear() === m.date.getFullYear()) {
                                    m.count++;
                                  }
                                });
                              });
                              
                              return months;
                            })()
                          }
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#8884d8" 
                            fill="#8884d8" 
                            name="Contact Count" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No communication history found</p>
                  <Button className="mt-4" variant="outline">
                    Add Contact Log
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValidatorProfileSection;
