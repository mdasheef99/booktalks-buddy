import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Crown, Star, Users, BookOpen } from 'lucide-react';
import { MemberSpotlight as MemberSpotlightType } from '@/lib/api/store/communityShowcase';

interface MemberSpotlightProps {
  spotlight: MemberSpotlightType;
}

const SPOTLIGHT_TYPE_CONFIG = {
  top_reviewer: {
    label: 'Top Reviewer',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Recognized for insightful book reviews'
  },
  active_member: {
    label: 'Active Member',
    icon: Users,
    color: 'bg-blue-100 text-blue-800',
    description: 'Highly engaged community participant'
  },
  helpful_contributor: {
    label: 'Helpful Contributor',
    icon: BookOpen,
    color: 'bg-green-100 text-green-800',
    description: 'Always ready to help fellow readers'
  },
  new_member: {
    label: 'New Member',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800',
    description: 'Welcome to our community!'
  }
};

const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  privileged: 'bg-blue-100 text-blue-700',
  'privileged+': 'bg-purple-100 text-purple-700'
};

export const MemberSpotlight: React.FC<MemberSpotlightProps> = ({ spotlight }) => {
  const config = SPOTLIGHT_TYPE_CONFIG[spotlight.spotlight_type];
  const IconComponent = config.icon;
  
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getDisplayName = () => {
    if (spotlight.userData.displayname) {
      return spotlight.userData.displayname;
    }
    return spotlight.userData.username;
  };

  const getSecondaryName = () => {
    if (spotlight.userData.displayname && spotlight.userData.username) {
      return `@${spotlight.userData.username}`;
    }
    return null;
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-bookconnect-cream/30 to-transparent rounded-lg border border-bookconnect-sage/20 hover:shadow-md transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-bookconnect-sage to-bookconnect-terracotta rounded-full flex items-center justify-center text-white font-semibold text-lg">
          {getDisplayName().charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-bookconnect-brown truncate">
              {getDisplayName()}
            </h4>
            {getSecondaryName() && (
              <p className="text-sm text-bookconnect-brown/60 truncate">
                {getSecondaryName()}
              </p>
            )}
          </div>
          
          {/* Spotlight Type Badge */}
          <Badge className={`${config.color} flex items-center gap-1 ml-2 flex-shrink-0`}>
            <IconComponent className="h-3 w-3" />
            <span className="text-xs">{config.label}</span>
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-bookconnect-brown/80 mb-3 leading-relaxed">
          {spotlight.spotlight_description}
        </p>

        {/* Member Info */}
        <div className="flex items-center justify-between text-xs text-bookconnect-brown/60">
          <div className="flex items-center space-x-3">
            {/* Member Since */}
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Since {formatMemberSince(spotlight.userData.created_at)}</span>
            </div>
            
            {/* Account Tier */}
            <Badge 
              variant="outline" 
              className={`${TIER_COLORS[spotlight.userData.account_tier as keyof typeof TIER_COLORS] || TIER_COLORS.free} text-xs`}
            >
              {spotlight.userData.account_tier === 'privileged+' ? 'Privileged+' : 
               spotlight.userData.account_tier?.charAt(0).toUpperCase() + spotlight.userData.account_tier?.slice(1) || 'Free'}
            </Badge>
          </div>

          {/* Spotlight Duration */}
          {spotlight.spotlight_end_date && (
            <div className="text-xs text-bookconnect-brown/50">
              Featured until {new Date(spotlight.spotlight_end_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
