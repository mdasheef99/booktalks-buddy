import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { PerformanceAlert } from '@/lib/api/store/analytics/';

interface PerformanceAlertsSectionProps {
  performanceAlerts: PerformanceAlert[];
}

/**
 * Performance Alerts Section component for Landing Page Analytics
 * Displays performance alerts and warnings for the landing page
 */
export const PerformanceAlertsSection: React.FC<PerformanceAlertsSectionProps> = ({
  performanceAlerts
}) => {
  // Alert type styling
  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBadgeVariant = (priority: PerformanceAlert['priority']) => {
    switch (priority) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'default' as const;
      case 'low': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Performance Alerts
        </CardTitle>
        <CardDescription>
          Automated alerts about your landing page performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {performanceAlerts.length > 0 ? (
          <div className="space-y-4">
            {performanceAlerts.map((alert, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-4 border rounded-lg"
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <Badge variant={getAlertBadgeVariant(alert.priority)}>
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  {alert.actionable && (
                    <p className="text-xs text-blue-600 mt-1">
                      Action recommended
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p>No performance alerts</p>
            <p className="text-sm">Your landing page is performing well</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
