import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Eye, EyeOff, ExternalLink, Info } from 'lucide-react';
import { CommunityShowcaseData } from '@/lib/api/store/communityShowcase';
import { CommunityShowcaseSection } from '@/components/landing/CommunityShowcaseSection';

interface CommunityShowcasePreviewProps {
  storeId: string;
  showcaseData?: CommunityShowcaseData | null;
  onRefresh: () => void;
}

export const CommunityShowcasePreview: React.FC<CommunityShowcasePreviewProps> = ({
  storeId,
  showcaseData,
  onRefresh
}) => {
  // Check if section will be visible
  const isVisible = showcaseData && (
    (showcaseData.showcaseSettings.show_member_spotlights && showcaseData.memberSpotlights.length > 0) ||
    (showcaseData.showcaseSettings.show_testimonials && showcaseData.testimonials.length > 0) ||
    (showcaseData.showcaseSettings.show_activity_feed && showcaseData.activityFeed.length > 0) ||
    showcaseData.showcaseSettings.show_community_metrics
  );

  const getVisibilityStatus = () => {
    if (!showcaseData) {
      return { status: 'loading', message: 'Loading showcase data...' };
    }

    const settings = showcaseData.showcaseSettings;
    
    // Check if any features are enabled
    if (!settings.show_member_spotlights && !settings.show_testimonials && 
        !settings.show_activity_feed && !settings.show_community_metrics) {
      return { 
        status: 'hidden', 
        message: 'Section hidden - No features enabled',
        details: 'Enable at least one feature in the settings to display the Community Showcase section.'
      };
    }

    // Check if enabled features have content
    const enabledFeatures = [];
    const featuresWithContent = [];

    if (settings.show_member_spotlights) {
      enabledFeatures.push('Member Spotlights');
      if (showcaseData.memberSpotlights.length > 0) {
        featuresWithContent.push('Member Spotlights');
      }
    }

    if (settings.show_testimonials) {
      enabledFeatures.push('Testimonials');
      if (showcaseData.testimonials.length > 0) {
        featuresWithContent.push('Testimonials');
      }
    }

    if (settings.show_activity_feed) {
      enabledFeatures.push('Activity Feed');
      if (showcaseData.activityFeed.length > 0) {
        featuresWithContent.push('Activity Feed');
      }
    }

    if (settings.show_community_metrics) {
      enabledFeatures.push('Community Metrics');
      featuresWithContent.push('Community Metrics'); // Always has content
    }

    if (featuresWithContent.length === 0) {
      return {
        status: 'hidden',
        message: 'Section hidden - No content available',
        details: `Enabled features (${enabledFeatures.join(', ')}) don't have content yet. Add member spotlights, testimonials, or community activity to display the section.`
      };
    }

    return {
      status: 'visible',
      message: `Section visible with ${featuresWithContent.length} feature${featuresWithContent.length !== 1 ? 's' : ''}`,
      details: `Displaying: ${featuresWithContent.join(', ')}`
    };
  };

  const visibilityStatus = getVisibilityStatus();

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isVisible ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400" />
              )}
              Landing Page Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Alert */}
          <Alert className={`mb-4 ${
            visibilityStatus.status === 'visible' ? 'border-green-200 bg-green-50' :
            visibilityStatus.status === 'hidden' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">{visibilityStatus.message}</div>
              {visibilityStatus.details && (
                <div className="text-sm opacity-80">{visibilityStatus.details}</div>
              )}
            </AlertDescription>
          </Alert>

          {/* Feature Status Grid */}
          {showcaseData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {showcaseData.showcaseSettings.show_member_spotlights ? (
                    showcaseData.memberSpotlights.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">No Content</Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <div className="text-sm font-medium">Member Spotlights</div>
                <div className="text-xs text-gray-600">
                  {showcaseData.memberSpotlights.length} spotlight{showcaseData.memberSpotlights.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {showcaseData.showcaseSettings.show_testimonials ? (
                    showcaseData.testimonials.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">No Content</Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <div className="text-sm font-medium">Testimonials</div>
                <div className="text-xs text-gray-600">
                  {showcaseData.testimonials.length} testimonial{showcaseData.testimonials.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {showcaseData.showcaseSettings.show_activity_feed ? (
                    showcaseData.activityFeed.length > 0 ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">No Content</Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <div className="text-sm font-medium">Activity Feed</div>
                <div className="text-xs text-gray-600">
                  {showcaseData.activityFeed.length} activit{showcaseData.activityFeed.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {showcaseData.showcaseSettings.show_community_metrics ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                <div className="text-sm font-medium">Community Metrics</div>
                <div className="text-xs text-gray-600">
                  {showcaseData.communityMetrics.active_members} members
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isVisible ? (
            <div className="border rounded-lg overflow-hidden">
              <CommunityShowcaseSection storeId={storeId} />
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-lg">
              <EyeOff className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Community Showcase Hidden</h3>
              <p className="text-sm mb-4 max-w-md mx-auto">
                The Community Showcase section is currently hidden on your landing page. 
                {visibilityStatus.status === 'hidden' && visibilityStatus.details && (
                  <span className="block mt-2 text-xs">{visibilityStatus.details}</span>
                )}
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <p>To display the section:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enable at least one feature in the settings</li>
                  <li>Add content (member spotlights, testimonials, etc.)</li>
                  <li>Ensure your community has activity to display</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Section Visibility Logic:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Section appears only when at least one feature is enabled AND has content</li>
                <li>Member Spotlights require active spotlights to be created</li>
                <li>Testimonials require approved testimonials</li>
                <li>Activity Feed requires recent community activity</li>
                <li>Community Metrics always display when enabled (shows current stats)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Content Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Member Spotlights: At least 1 active spotlight</li>
                <li>Testimonials: At least 1 approved testimonial</li>
                <li>Activity Feed: Recent discussions, member joins, or book updates</li>
                <li>Community Metrics: Automatically calculated from existing data</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Performance:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Data is cached for 5 minutes to improve loading speed</li>
                <li>Section loads independently and won't block other page content</li>
                <li>Graceful fallbacks for missing or loading data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
