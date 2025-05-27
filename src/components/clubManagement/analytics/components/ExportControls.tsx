/**
 * Export Controls Component
 *
 * Handles analytics export functionality with format selection.
 */

import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportAnalytics, AnalyticsExportOptions } from '@/lib/api/clubManagement';

interface ExportControlsProps {
  clubId: string;
  isClubLead: boolean;
  lastUpdated: Date | null;
  onExportError: (error: string) => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  clubId,
  isClubLead,
  lastUpdated,
  onExportError
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    onExportError(''); // Clear previous errors

    try {
      const exportOptions: AnalyticsExportOptions = {
        format: exportFormat,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        includeCharts: true,
        sections: ['members', 'discussions', 'books', 'insights']
      };

      const blob = await exportAnalytics(clubId, exportOptions);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `club-analytics-${clubId}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      onExportError('Failed to export analytics. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Updated {lastUpdated.toLocaleTimeString()}
        </div>
      )}
      
      {isClubLead && (
        <div className="flex items-center gap-2">
          <Select value={exportFormat} onValueChange={(value: 'pdf' | 'csv') => setExportFormat(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExport} 
            disabled={exporting}
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
