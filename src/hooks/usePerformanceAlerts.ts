
import { useState, useEffect } from 'react';
import { PerformanceAlertSettings, CustomMetricTracking, TaoSubnetInfo } from '@/services/tao/types';
import { toast } from 'sonner';

// Default alert settings
const defaultAlertSettings: PerformanceAlertSettings = {
  enabled: false,
  thresholds: {
    emissions_drop: 5,
    validator_drop: 10,
    stake_drop: 15
  },
  notification_methods: {
    email: true,
    browser: true,
    telegram: false
  },
  custom_metrics: []
};

/**
 * Hook for managing performance alert settings and processing alerts
 */
export const usePerformanceAlerts = (subnets: TaoSubnetInfo[]) => {
  // Load settings from localStorage or use defaults
  const [alertSettings, setAlertSettings] = useState<PerformanceAlertSettings>(() => {
    const savedSettings = localStorage.getItem('tao-performance-alerts');
    return savedSettings ? JSON.parse(savedSettings) : defaultAlertSettings;
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tao-performance-alerts', JSON.stringify(alertSettings));
  }, [alertSettings]);

  // Check for alerts based on current subnet data
  useEffect(() => {
    if (!alertSettings.enabled || !subnets.length) return;

    // Process standard threshold alerts
    subnets.forEach(subnet => {
      if (!subnet.performance) return;
      
      const { performance_trend_7d } = subnet.performance;
      
      // Check emissions drop
      if (performance_trend_7d < -alertSettings.thresholds.emissions_drop) {
        triggerAlert(`${subnet.name} emissions dropped by ${Math.abs(performance_trend_7d).toFixed(2)}%`);
      }
      
      // Add checks for other standard metrics here...
    });
    
    // Process custom metric alerts
    alertSettings.custom_metrics.forEach(metric => {
      if (!metric.enabled) return;
      
      subnets.forEach(subnet => {
        if (!subnet.performance) return;
        
        let metricValue: number = 0;
        let metricName = '';
        
        // Get the appropriate metric value
        switch(metric.metric) {
          case 'emissions':
            metricValue = subnet.performance.daily_emissions;
            metricName = 'emissions';
            break;
          case 'validators':
            metricValue = subnet.performance.active_validators;
            metricName = 'validator count';
            break;
          case 'stake':
            metricValue = subnet.performance.total_stake;
            metricName = 'stake amount';
            break;
          case 'performance':
            metricValue = subnet.performance.performance_trend_7d;
            metricName = 'performance trend';
            break;
        }
        
        // Check the condition
        let conditionMet = false;
        
        switch(metric.condition) {
          case 'above':
            conditionMet = metricValue > metric.value;
            break;
          case 'below':
            conditionMet = metricValue < metric.value;
            break;
          case 'change':
            // For now this only works with performance trend
            if (metric.metric === 'performance') {
              conditionMet = Math.abs(metricValue) > Math.abs(metric.value);
            }
            break;
        }
        
        if (conditionMet) {
          triggerAlert(`${subnet.name} ${metricName} ${metric.condition} ${metric.value}`);
        }
      });
    });
  }, [subnets, alertSettings]);

  // Trigger an alert through the configured channels
  const triggerAlert = (message: string) => {
    if (alertSettings.notification_methods.browser) {
      toast.warning(`Alert: ${message}`, {
        duration: 5000,
      });
    }
    
    // In a real app, we would add API calls for email/telegram here
    console.log('Alert triggered:', message);
  };

  // Add a new custom metric
  const addCustomMetric = (metric: Omit<CustomMetricTracking, 'id'>) => {
    setAlertSettings(prev => ({
      ...prev,
      custom_metrics: [
        ...prev.custom_metrics,
        {
          ...metric,
          id: `metric-${Date.now()}`
        }
      ]
    }));
  };

  // Remove a custom metric
  const removeCustomMetric = (id: string) => {
    setAlertSettings(prev => ({
      ...prev,
      custom_metrics: prev.custom_metrics.filter(m => m.id !== id)
    }));
  };

  // Update a custom metric
  const updateCustomMetric = (id: string, updates: Partial<Omit<CustomMetricTracking, 'id'>>) => {
    setAlertSettings(prev => ({
      ...prev,
      custom_metrics: prev.custom_metrics.map(m => 
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  };

  // Update general alert settings
  const updateAlertSettings = (updates: Partial<PerformanceAlertSettings>) => {
    setAlertSettings(prev => ({
      ...prev,
      ...updates,
      thresholds: {
        ...prev.thresholds,
        ...(updates.thresholds || {})
      },
      notification_methods: {
        ...prev.notification_methods,
        ...(updates.notification_methods || {})
      }
    }));
  };

  return {
    alertSettings,
    updateAlertSettings,
    addCustomMetric,
    removeCustomMetric,
    updateCustomMetric
  };
};
