
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  PerformanceAlertSettings, 
  CustomMetricTracking 
} from '@/services/tao/types';
import { AlertCircle, Plus, Trash } from 'lucide-react';

interface AlertConfigPanelProps {
  alertSettings: PerformanceAlertSettings;
  onUpdateSettings: (updates: Partial<PerformanceAlertSettings>) => void;
  onAddCustomMetric: (metric: Omit<CustomMetricTracking, 'id'>) => void;
  onRemoveCustomMetric: (id: string) => void;
  onUpdateCustomMetric: (id: string, updates: Partial<Omit<CustomMetricTracking, 'id'>>) => void;
}

const AlertConfigPanel: React.FC<AlertConfigPanelProps> = ({
  alertSettings,
  onUpdateSettings,
  onAddCustomMetric,
  onRemoveCustomMetric,
  onUpdateCustomMetric
}) => {
  // State for new custom metric
  const [newMetric, setNewMetric] = useState<Omit<CustomMetricTracking, 'id'>>({
    name: '',
    metric: 'emissions',
    condition: 'below',
    value: 0,
    enabled: true
  });
  
  // Handle toggle for enabling/disabling alerts
  const handleToggleAlerts = (checked: boolean) => {
    onUpdateSettings({ enabled: checked });
  };
  
  // Handle threshold changes
  const handleThresholdChange = (type: keyof PerformanceAlertSettings['thresholds'], value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onUpdateSettings({
        thresholds: {
          ...alertSettings.thresholds,
          [type]: numericValue
        }
      });
    }
  };
  
  // Handle notification method changes
  const handleNotificationChange = (method: keyof PerformanceAlertSettings['notification_methods'], checked: boolean) => {
    onUpdateSettings({
      notification_methods: {
        ...alertSettings.notification_methods,
        [method]: checked
      }
    });
  };
  
  // Handle adding a new custom metric
  const handleAddCustomMetric = () => {
    if (newMetric.name.trim() === '') {
      return;
    }
    
    onAddCustomMetric(newMetric);
    
    // Reset form
    setNewMetric({
      name: '',
      metric: 'emissions',
      condition: 'below',
      value: 0,
      enabled: true
    });
  };
  
  // Update a field in the new metric form
  const updateNewMetricField = <K extends keyof typeof newMetric>(
    field: K,
    value: typeof newMetric[K]
  ) => {
    setNewMetric(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Alerts</h3>
        <Switch
          checked={alertSettings.enabled}
          onCheckedChange={handleToggleAlerts}
        />
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Threshold Settings</h4>
        
        <div className="grid gap-2">
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="emissions-threshold">Emissions Drop Alert</Label>
            <div className="flex items-center">
              <Input
                id="emissions-threshold"
                type="number"
                value={alertSettings.thresholds.emissions_drop}
                onChange={(e) => handleThresholdChange('emissions_drop', e.target.value)}
                className="w-20"
                min="0"
                max="100"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="validator-threshold">Validator Drop Alert</Label>
            <div className="flex items-center">
              <Input
                id="validator-threshold"
                type="number"
                value={alertSettings.thresholds.validator_drop}
                onChange={(e) => handleThresholdChange('validator_drop', e.target.value)}
                className="w-20"
                min="0"
                max="100"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="stake-threshold">Stake Drop Alert</Label>
            <div className="flex items-center">
              <Input
                id="stake-threshold"
                type="number"
                value={alertSettings.thresholds.stake_drop}
                onChange={(e) => handleThresholdChange('stake_drop', e.target.value)}
                className="w-20"
                min="0"
                max="100"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Notification Methods</h4>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="browser-notifications">Browser Notifications</Label>
            <Switch
              id="browser-notifications"
              checked={alertSettings.notification_methods.browser}
              onCheckedChange={(checked) => handleNotificationChange('browser', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={alertSettings.notification_methods.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="telegram-notifications">Telegram Notifications</Label>
            <Switch
              id="telegram-notifications"
              checked={alertSettings.notification_methods.telegram || false}
              onCheckedChange={(checked) => handleNotificationChange('telegram', checked)}
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom Metric Tracking</h4>
        
        {alertSettings.custom_metrics.length > 0 ? (
          <div className="grid gap-2">
            {alertSettings.custom_metrics.map((metric) => (
              <div key={metric.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={metric.enabled}
                      onCheckedChange={(checked) => onUpdateCustomMetric(metric.id, { enabled: checked })}
                      size="sm"
                    />
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.metric} {metric.condition} {metric.value}
                    {metric.metric === 'performance' ? '%' : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCustomMetric(metric.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-muted rounded-md">
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2" />
              No custom alerts configured
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Add New Alert</h5>
          
          <div className="grid gap-2">
            <Input
              placeholder="Alert Name"
              value={newMetric.name}
              onChange={(e) => updateNewMetricField('name', e.target.value)}
            />
            
            <div className="grid grid-cols-3 gap-2">
              <Select 
                value={newMetric.metric}
                onValueChange={(value) => updateNewMetricField('metric', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emissions">Emissions</SelectItem>
                  <SelectItem value="validators">Validators</SelectItem>
                  <SelectItem value="stake">Stake</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={newMetric.condition}
                onValueChange={(value) => updateNewMetricField('condition', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="change">Change</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex">
                <Input
                  type="number"
                  value={newMetric.value}
                  onChange={(e) => updateNewMetricField('value', parseFloat(e.target.value))}
                  min="0"
                />
                {newMetric.metric === 'performance' && <span className="ml-1 flex items-center">%</span>}
              </div>
            </div>
            
            <Button
              onClick={handleAddCustomMetric}
              disabled={newMetric.name.trim() === ''}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Alert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertConfigPanel;
