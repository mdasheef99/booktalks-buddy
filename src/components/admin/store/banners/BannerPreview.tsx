import React from 'react';
import { PromotionalBanner as BannerType } from '@/lib/api/store/banners';
import { PromotionalBanner } from '@/components/landing/banners/PromotionalBanner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, Eye, Calendar } from 'lucide-react';

interface BannerPreviewProps {
  banners: BannerType[];
}

/**
 * Live preview of how banners will appear on the landing page
 */
export const BannerPreview: React.FC<BannerPreviewProps> = ({ banners }) => {
  // Filter to only active banners that are currently scheduled
  const now = new Date();
  const activeBanners = banners.filter(banner => {
    if (!banner.is_active) return false;
    
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;
    
    const isScheduleActive = (!startDate || startDate <= now) && (!endDate || endDate > now);
    return isScheduleActive;
  });

  if (banners.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Banners Created</h3>
        <p className="text-gray-600 mb-4">
          Create some promotional banners to see how they will look
        </p>
      </div>
    );
  }

  if (activeBanners.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            You have {banners.length} banner(s) configured, but none are currently active and scheduled. 
            The banner section will be hidden on your landing page until you activate and schedule at least one banner.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Banners</h3>
          <p className="text-gray-600">
            Activate and schedule some banners to see the preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
          <p className="text-sm text-gray-600">
            Showing {activeBanners.length} active banner(s) out of {banners.length} total
          </p>
        </div>
        
        {banners.length !== activeBanners.length && (
          <Alert className="max-w-md">
            <Eye className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {banners.length - activeBanners.length} banner(s) are hidden (inactive or not scheduled)
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Preview Container */}
      <div className="bg-gradient-to-r from-bookconnect-terracotta/5 to-bookconnect-sage/5 rounded-lg p-6 border">
        <div className="space-y-4">
          {/* Section Header (as it appears on landing page) */}
          {activeBanners.length > 1 && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-sm font-medium">
                <Megaphone className="h-3 w-3" />
                Special Offers
              </div>
            </div>
          )}

          {/* Banners Preview */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {activeBanners.map((banner, index) => (
              <PromotionalBanner
                key={banner.id}
                banner={banner}
                index={index}
                onBannerClick={(bannerId) => {
                  // Show click action in preview
                  if (banner.cta_url) {
                    alert(`Would navigate to: ${banner.cta_url}`);
                  } else {
                    alert('No click action configured for this banner');
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Preview Notes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click actions will show an alert instead of navigating</li>
          <li>• Only active and scheduled banners are shown</li>
          <li>• Banners appear between the hero section and events section</li>
          <li>• Banner animations will work on the live site</li>
          <li>• The section header only appears when multiple banners are active</li>
        </ul>
      </div>

      {/* Scheduled Banners Info */}
      {banners.some(b => b.start_date || b.end_date) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Scheduled Banners:</h4>
          <div className="space-y-2">
            {banners
              .filter(b => b.start_date || b.end_date)
              .map(banner => {
                const startDate = banner.start_date ? new Date(banner.start_date) : null;
                const endDate = banner.end_date ? new Date(banner.end_date) : null;
                const isScheduled = startDate && startDate > now;
                const isExpired = endDate && endDate <= now;
                
                return (
                  <div key={banner.id} className="text-sm text-yellow-800">
                    <span className="font-medium">{banner.title}</span>
                    {isScheduled && startDate && (
                      <span className="ml-2 text-blue-600">
                        (Starts: {startDate.toLocaleDateString()})
                      </span>
                    )}
                    {isExpired && endDate && (
                      <span className="ml-2 text-red-600">
                        (Expired: {endDate.toLocaleDateString()})
                      </span>
                    )}
                    {!isScheduled && !isExpired && startDate && endDate && (
                      <span className="ml-2 text-green-600">
                        (Active: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()})
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
