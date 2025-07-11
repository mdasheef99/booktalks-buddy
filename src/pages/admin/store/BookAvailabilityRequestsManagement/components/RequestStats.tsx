import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BookAvailabilityRequestData } from '@/types/bookAvailabilityRequests';

interface RequestStatsProps {
  requests: BookAvailabilityRequestData[];
}

export const RequestStats: React.FC<RequestStatsProps> = ({ requests }) => {
  // Calculate statistics
  const stats = React.useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const responded = requests.filter(r => r.status === 'responded').length;
    const resolved = requests.filter(r => r.status === 'resolved').length;
    const total = requests.length;

    return {
      total,
      pending,
      responded,
      resolved,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
      respondedPercentage: total > 0 ? Math.round((responded / total) * 100) : 0,
      resolvedPercentage: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  }, [requests]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Pending Requests */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Pending</span>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              {stats.pending}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-yellow-800">{stats.pendingPercentage}%</div>
            <div className="text-sm text-yellow-600">of total requests</div>
          </div>
        </CardContent>
      </Card>

      {/* Responded Requests */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Responded</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {stats.responded}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-blue-800">{stats.respondedPercentage}%</div>
            <div className="text-sm text-blue-600">of total requests</div>
          </div>
        </CardContent>
      </Card>

      {/* Resolved Requests */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Resolved</span>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              {stats.resolved}
            </Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-800">{stats.resolvedPercentage}%</div>
            <div className="text-sm text-green-600">of total requests</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
