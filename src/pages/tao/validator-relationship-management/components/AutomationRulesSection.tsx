
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TaoValidator } from "@/services/validators/types";
import { AlertTriangle, Plus, Trash2, Calendar, Bell } from "lucide-react";
import { toast } from "sonner";

interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'stake' | 'performance' | 'communication' | 'subnet';
  condition: string;
  action: 'email' | 'notification' | 'schedule' | 'tag';
  actionDetail: string;
  enabled: boolean;
}

interface AutomationRulesSectionProps {
  validator: TaoValidator;
}

const AutomationRulesSection: React.FC<AutomationRulesSectionProps> = ({
  validator
}) => {
  // Mock automation rules
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Stake Increase Follow-up',
      triggerType: 'stake',
      condition: 'Increase > 5% in 24 hours',
      action: 'schedule',
      actionDetail: 'Follow-up call in 2 days',
      enabled: true
    },
    {
      id: '2',
      name: 'Performance Drop Alert',
      triggerType: 'performance',
      condition: 'Performance score decreases by >10%',
      action: 'email',
      actionDetail: 'Send performance concern email',
      enabled: true
    },
    {
      id: '3',
      name: 'Communication Reminder',
      triggerType: 'communication',
      condition: 'No contact in 30 days',
      action: 'notification',
      actionDetail: 'Remind team to check in',
      enabled: true
    },
    {
      id: '4',
      name: 'Subnet Opportunity',
      triggerType: 'subnet',
      condition: 'New compatible subnet detected',
      action: 'email',
      actionDetail: 'Send subnet opportunity email',
      enabled: false
    }
  ]);
  
  const [newRuleMode, setNewRuleMode] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    triggerType: 'stake',
    action: 'notification',
    enabled: true
  });
  
  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.actionDetail) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const completeRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name || "",
      triggerType: newRule.triggerType || 'stake',
      condition: newRule.condition || "",
      action: newRule.action || 'notification',
      actionDetail: newRule.actionDetail || "",
      enabled: newRule.enabled !== undefined ? newRule.enabled : true
    };
    
    setAutomationRules([...automationRules, completeRule]);
    setNewRuleMode(false);
    setNewRule({
      triggerType: 'stake',
      action: 'notification',
      enabled: true
    });
    
    toast.success("New automation rule added");
  };
  
  const handleDeleteRule = (id: string) => {
    setAutomationRules(automationRules.filter(rule => rule.id !== id));
    toast.success("Automation rule deleted");
  };
  
  const handleToggleRule = (id: string) => {
    setAutomationRules(automationRules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    const rule = automationRules.find(r => r.id === id);
    if (rule) {
      toast.success(`Rule "${rule.name}" ${rule.enabled ? 'disabled' : 'enabled'}`);
    }
  };

  const getTriggerIcon = (type: AutomationRule['triggerType']) => {
    switch (type) {
      case 'stake':
        return "📈";
      case 'performance':
        return "🎯";
      case 'communication':
        return "💬";
      case 'subnet':
        return "🌐";
      default:
        return "📋";
    }
  };
  
  const getActionIcon = (type: AutomationRule['action']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'tag':
        return <Tag className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Set up rules to automate follow-ups and communications
              </CardDescription>
            </div>
            <Button onClick={() => setNewRuleMode(true)} disabled={newRuleMode}>
              <Plus className="h-4 w-4 mr-2" /> Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newRuleMode && (
            <Card className="mb-6 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">New Automation Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input 
                        id="rule-name" 
                        placeholder="E.g., Stake Increase Alert" 
                        value={newRule.name || ''}
                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trigger-type">Trigger Type</Label>
                      <Select
                        value={newRule.triggerType}
                        onValueChange={(value) => setNewRule({...newRule, triggerType: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stake">Stake Change</SelectItem>
                          <SelectItem value="performance">Performance Metrics</SelectItem>
                          <SelectItem value="communication">Communication History</SelectItem>
                          <SelectItem value="subnet">Subnet Activity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Input 
                      id="condition" 
                      placeholder="E.g., Stake increases by more than 10%" 
                      value={newRule.condition || ''}
                      onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="action-type">Action Type</Label>
                      <Select
                        value={newRule.action}
                        onValueChange={(value) => setNewRule({...newRule, action: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Send Email</SelectItem>
                          <SelectItem value="notification">Send Notification</SelectItem>
                          <SelectItem value="schedule">Schedule Task</SelectItem>
                          <SelectItem value="tag">Apply Tag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action-detail">Action Detail</Label>
                      <Input 
                        id="action-detail" 
                        placeholder="E.g., Send congratulatory email" 
                        value={newRule.actionDetail || ''}
                        onChange={(e) => setNewRule({...newRule, actionDetail: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="rule-enabled"
                      checked={newRule.enabled}
                      onCheckedChange={(checked) => setNewRule({...newRule, enabled: checked})}
                    />
                    <Label htmlFor="rule-enabled">Enable this rule immediately</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button variant="outline" onClick={() => setNewRuleMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRule}>
                      Save Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {automationRules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automationRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getTriggerIcon(rule.triggerType)}</span>
                        <span className="text-sm">{rule.condition}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {rule.action === 'email' ? 'Email' :
                            rule.action === 'notification' ? 'Notify' :
                            rule.action === 'schedule' ? 'Schedule' : 'Tag'}
                        </Badge>
                        <span className="text-sm">{rule.actionDetail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                        aria-label={`Toggle ${rule.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-muted-foreground">No automation rules configured</p>
              <Button onClick={() => setNewRuleMode(true)}>Create Your First Rule</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Rule Templates</CardTitle>
          <CardDescription>
            Quickly set up common automation rules with these templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Stake Change Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get notified when a validator's stake changes significantly.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Monthly Check-in</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule regular monthly communication with validators.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Performance Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically schedule quarterly performance reviews.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Apply Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Importing missing icons
const Mail = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const Tag = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export default AutomationRulesSection;
