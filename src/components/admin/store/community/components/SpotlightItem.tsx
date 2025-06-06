/**
 * Spotlight Item Component
 * Individual spotlight display card
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, Clock } from 'lucide-react';
import type { MemberSpotlightItemProps } from '../types/memberSpotlightTypes';
import { CSS_CLASSES } from '../constants/memberSpotlightConstants';
import { 
  getMemberDisplayName, 
  getMemberInitials,
  formatSpotlightDate,
  isSpotlightActive,
  getDaysUntilExpiry,
  getSpotlightConfig
} from '../utils/memberSpotlightUtils';

export const SpotlightItem: React.FC<MemberSpotlightItemProps> = ({
  spotlight,
  onEdit,
  onDelete,
}) => {
  const typeConfig = getSpotlightConfig(spotlight.spotlight_type);
  const isActive = isSpotlightActive(spotlight);
  const daysUntilExpiry = getDaysUntilExpiry(spotlight);
  const memberDisplayName = getMemberDisplayName(spotlight.userData);
  const memberInitials = getMemberInitials(spotlight.userData);

  return (
    <Card className={CSS_CLASSES.SPOTLIGHT_CARD}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Member Avatar */}
                <div className={CSS_CLASSES.MEMBER_AVATAR}>
                  {memberInitials}
                </div>
                
                {/* Member Info */}
                <div>
                  <div className="font-semibold text-gray-900">
                    {memberDisplayName}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{spotlight.userData.username} • {spotlight.userData.account_tier}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    Expired
                  </Badge>
                )}
              </div>
            </div>

            {/* Spotlight Type */}
            <div className="flex items-center space-x-2">
              {typeConfig && (
                <Badge className={typeConfig.color}>
                  <typeConfig.icon className="h-3 w-3 mr-1" />
                  {typeConfig.label}
                </Badge>
              )}
            </div>

            {/* Description */}
            <blockquote className="text-gray-700 italic leading-relaxed">
              "{spotlight.spotlight_description}"
            </blockquote>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Started: {formatSpotlightDate(spotlight.spotlight_start_date)}</span>
              </div>
              
              {spotlight.spotlight_end_date && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {isActive 
                      ? `Expires: ${formatSpotlightDate(spotlight.spotlight_end_date)}`
                      : `Expired: ${formatSpotlightDate(spotlight.spotlight_end_date)}`
                    }
                  </span>
                </div>
              )}

              {!spotlight.spotlight_end_date && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Permanent spotlight</span>
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {isActive && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
              <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  {daysUntilExpiry === 0 
                    ? 'Expires today' 
                    : `Expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(spotlight)}
              title="Edit spotlight"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(spotlight.id)}
              className={CSS_CLASSES.DELETE_BUTTON}
              title="Delete spotlight"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Compact Spotlight Item Component
 * Simplified version for lists
 */
interface CompactSpotlightItemProps {
  spotlight: any;
  onEdit: (spotlight: any) => void;
  onDelete: (spotlightId: string) => void;
}

export const CompactSpotlightItem: React.FC<CompactSpotlightItemProps> = ({
  spotlight,
  onEdit,
  onDelete,
}) => {
  const typeConfig = getSpotlightConfig(spotlight.spotlight_type);
  const isActive = isSpotlightActive(spotlight);
  const memberDisplayName = getMemberDisplayName(spotlight.userData);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
          {typeConfig && (
            <Badge className={typeConfig.color} size="sm">
              <typeConfig.icon className="h-3 w-3 mr-1" />
              {typeConfig.label}
            </Badge>
          )}
          <Badge variant="outline" size="sm" className={isActive ? 'text-green-600' : 'text-gray-600'}>
            {isActive ? 'Active' : 'Expired'}
          </Badge>
        </div>
        <p className="font-medium text-gray-900 truncate">
          {memberDisplayName}
        </p>
        <p className="text-sm text-gray-500 truncate">
          "{spotlight.spotlight_description}"
        </p>
      </div>
      
      <div className="ml-4 flex space-x-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(spotlight)}
          className="px-2 py-1 h-auto"
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(spotlight.id)}
          className="px-2 py-1 h-auto text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
