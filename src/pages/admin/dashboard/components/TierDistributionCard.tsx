import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Star, Crown } from 'lucide-react';
import { TierDistributionCardProps } from '../types';

/**
 * Component for displaying user tier distribution
 */
const TierDistributionCard: React.FC<TierDistributionCardProps> = ({
  tierDistribution,
  totalUsers
}) => {
  // Calculate percentages
  const freePercentage = totalUsers > 0 
    ? ((tierDistribution.free / totalUsers) * 100).toFixed(1) 
    : '0.0';
  
  const privilegedPercentage = totalUsers > 0 
    ? ((tierDistribution.privileged / totalUsers) * 100).toFixed(1) 
    : '0.0';
  
  const privilegedPlusPercentage = totalUsers > 0 
    ? ((tierDistribution.privileged_plus / totalUsers) * 100).toFixed(1) 
    : '0.0';

  // Calculate bar widths
  const freeWidth = totalUsers > 0 
    ? `${(tierDistribution.free / totalUsers) * 100}%` 
    : '0%';
  
  const privilegedWidth = totalUsers > 0 
    ? `${(tierDistribution.privileged / totalUsers) * 100}%` 
    : '0%';
  
  const privilegedPlusWidth = totalUsers > 0 
    ? `${(tierDistribution.privileged_plus / totalUsers) * 100}%` 
    : '0%';

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Tier Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Free Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
              <span>Free</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{tierDistribution.free}</span>
              <span className="text-xs text-muted-foreground">
                ({freePercentage}%)
              </span>
            </div>
          </div>

          {/* Privileged Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-bookconnect-sage mr-2"></div>
              <span className="flex items-center">
                Privileged <Star className="h-3 w-3 ml-1 text-bookconnect-sage" />
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{tierDistribution.privileged}</span>
              <span className="text-xs text-muted-foreground">
                ({privilegedPercentage}%)
              </span>
            </div>
          </div>

          {/* Privileged+ Tier */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-bookconnect-terracotta mr-2"></div>
              <span className="flex items-center">
                Privileged+ <Crown className="h-3 w-3 ml-1 text-bookconnect-terracotta" />
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{tierDistribution.privileged_plus}</span>
              <span className="text-xs text-muted-foreground">
                ({privilegedPlusPercentage}%)
              </span>
            </div>
          </div>

          {/* Distribution Bar */}
          <div className="w-full bg-gray-100 rounded-full h-4 mt-4">
            <div className="flex h-full rounded-full overflow-hidden">
              <div
                className="bg-gray-300"
                style={{ width: freeWidth }}
              ></div>
              <div
                className="bg-bookconnect-sage"
                style={{ width: privilegedWidth }}
              ></div>
              <div
                className="bg-bookconnect-terracotta"
                style={{ width: privilegedPlusWidth }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TierDistributionCard;
