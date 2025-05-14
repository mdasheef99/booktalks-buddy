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
  // Ensure tierDistribution is defined
  const tiers = tierDistribution || { free: 0, privileged: 0, privileged_plus: 0 };
  const total = totalUsers || 0;

  // Calculate percentages safely
  const freePercentage = total > 0 && tiers.free !== undefined
    ? ((tiers.free / total) * 100).toFixed(1)
    : '0.0';

  const privilegedPercentage = total > 0 && tiers.privileged !== undefined
    ? ((tiers.privileged / total) * 100).toFixed(1)
    : '0.0';

  const privilegedPlusPercentage = total > 0 && tiers.privileged_plus !== undefined
    ? ((tiers.privileged_plus / total) * 100).toFixed(1)
    : '0.0';

  // Calculate bar widths safely
  const freeWidth = total > 0 && tiers.free !== undefined
    ? `${(tiers.free / total) * 100}%`
    : '0%';

  const privilegedWidth = total > 0 && tiers.privileged !== undefined
    ? `${(tiers.privileged / total) * 100}%`
    : '0%';

  const privilegedPlusWidth = total > 0 && tiers.privileged_plus !== undefined
    ? `${(tiers.privileged_plus / total) * 100}%`
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
              <span className="mr-2">{tiers.free}</span>
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
              <span className="mr-2">{tiers.privileged}</span>
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
              <span className="mr-2">{tiers.privileged_plus}</span>
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
