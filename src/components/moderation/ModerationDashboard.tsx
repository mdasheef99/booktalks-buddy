import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  Filter,
  RefreshCw,
  Users
} from 'lucide-react';
import { getReports, getReportStats } from '@/services/reportingService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserName from '@/components/common/UserName';
import { UserManagementTab } from './UserManagementTab';
import { ReportActionDialog } from './ReportActionDialog';
import type {
  Report,
  ReportStats,
  ReportFilters,
  ReportSeverity,
  ReportStatus
} from '@/types/reporting';

interface ModerationDashboardProps {
  clubId?: string;
  storeId?: string;
}

const SEVERITY_COLORS: Record<ReportSeverity, string> = {
  'critical': 'bg-red-100 text-red-800 border-red-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'low': 'bg-blue-100 text-blue-800 border-blue-200'
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  'pending': 'bg-gray-100 text-gray-800',
  'under_review': 'bg-blue-100 text-blue-800',
  'resolved': 'bg-green-100 text-green-800',
  'dismissed': 'bg-gray-100 text-gray-600',
  'escalated': 'bg-purple-100 text-purple-800'
};

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  clubId,
  storeId
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Build filters based on context
      const filters: ReportFilters = {};
      if (clubId) filters.club_id = clubId;
      if (storeId) filters.store_id = storeId;

      // Load reports and stats
      const [reportsResult, statsResult] = await Promise.all([
        getReports(filters, { page: 1, limit: 50, sort_by: 'priority' }),
        getReportStats(filters)
      ]);

      setReports(reportsResult.reports);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load moderation dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, clubId, storeId]);

  const filteredReports = reports.filter(report => {
    switch (activeTab) {
      case 'pending':
        return report.status === 'pending';
      case 'under_review':
        return report.status === 'under_review';
      case 'resolved':
        return report.status === 'resolved' || report.status === 'dismissed';
      case 'high_priority':
        return report.severity === 'critical' || report.severity === 'high';
      default:
        return true;
    }
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading moderation dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h2>
          <p className="text-gray-600">
            {clubId ? 'Club-specific reports' : storeId ? 'Store-wide reports' : 'All reports'}
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending_reports}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.reports_by_severity.critical + stats.reports_by_severity.high}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved_reports}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.average_resolution_time_hours.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Reports List */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending ({stats?.pending_reports || 0})
            </TabsTrigger>
            <TabsTrigger value="under_review">
              Under Review
            </TabsTrigger>
            <TabsTrigger value="high_priority">
              High Priority
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved
            </TabsTrigger>
            <TabsTrigger value="user_management">
              <Users className="h-4 w-4 mr-1" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user_management" className="mt-6">
            <UserManagementTab storeId={storeId} />
          </TabsContent>

          <TabsContent value={activeTab} className="mt-6">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reports found in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={SEVERITY_COLORS[report.severity]}>
                            {report.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={STATUS_COLORS[report.status]}>
                            {report.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {report.priority <= 2 && (
                            <Badge variant="destructive">
                              <ArrowUp className="h-3 w-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>
                            Reported by: <UserName userId={report.reporter_id} linkToProfile />
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(report.created_at)}</span>
                          <span>•</span>
                          <span className="capitalize">{report.target_type.replace('_', ' ')}</span>
                        </div>

                        <div className="mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {report.reason.replace('_', ' ')}
                          </span>
                          {report.target_user_id && (
                            <span className="text-gray-600 ml-2">
                              against <UserName userId={report.target_user_id} linkToProfile />
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 text-sm line-clamp-2">
                          {report.description}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {report.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Report Action Dialog */}
      <ReportActionDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
        onActionComplete={() => {
          setSelectedReport(null);
          loadData(); // Refresh the reports list
        }}
      />
    </div>
  );
};
