import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Eye, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { PromotionalBanner } from '@/lib/api/store/banners';
import { BannerTrackingAPI, SessionManager, DeviceDetector } from '@/lib/api/store/analytics/bannerTracking';

/**
 * Banner Detail Page
 * Displays full details of a promotional banner
 */
export const BannerDetail: React.FC = () => {
  const { bannerId } = useParams<{ bannerId: string }>();
  const navigate = useNavigate();

  // Fetch banner details
  const {
    data: banner,
    isLoading,
    error
  } = useQuery({
    queryKey: ['banner-detail', bannerId],
    queryFn: async () => {
      if (!bannerId) throw new Error('Banner ID is required');

      const { data, error } = await supabase
        .from('store_promotional_banners')
        .select('*')
        .eq('id', bannerId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching banner:', error);
        throw new Error('Failed to load banner details');
      }

      return data as PromotionalBanner;
    },
    enabled: !!bannerId,
  });

  // Track banner detail page view
  useEffect(() => {
    if (banner && bannerId) {
      const sessionId = SessionManager.getSessionId();

      BannerTrackingAPI.trackBannerDetailView(
        banner.store_id,
        bannerId,
        sessionId,
        {
          bannerTitle: banner.title,
          bannerType: banner.content_type,
          deviceType: DeviceDetector.getDeviceType(),
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          timestamp: new Date().toISOString()
        }
      );
    }
  }, [banner, bannerId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center pt-20">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-serif text-bookconnect-brown mt-4">Loading Banner Details</h2>
            <p className="text-bookconnect-brown/70">Please wait while we fetch the banner information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !banner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <Megaphone className="h-4 w-4" />
              <AlertDescription>
                {error?.message || 'Banner not found or no longer available.'}
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button 
                onClick={() => navigate('/')}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to get banner style
  const getBannerStyle = () => ({
    backgroundColor: banner.background_color || '#ffffff',
    color: banner.text_color || '#000000'
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
      <Helmet>
        <title>{banner.title} - BookConnect Banner</title>
        <meta name="description" content={banner.subtitle || banner.text_content || 'Promotional banner details'} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 text-bookconnect-brown hover:text-bookconnect-terracotta"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-5 w-5 text-bookconnect-terracotta" />
            <span className="text-sm font-medium text-bookconnect-brown">Promotional Banner</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown">
            {banner.title}
          </h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Banner Display */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-0">
              {banner.content_type === 'image' && banner.banner_image_url ? (
                // Image-only banner
                <div 
                  className="min-h-[300px] md:min-h-[400px] bg-cover bg-center flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${banner.banner_image_url})`,
                    ...getBannerStyle()
                  }}
                >
                  <div className="text-center p-8">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-lg md:text-xl text-white/90 drop-shadow mb-6">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ) : banner.content_type === 'mixed' && banner.banner_image_url ? (
                // Mixed content banner
                <div className="grid md:grid-cols-2 gap-0 min-h-[300px]">
                  <div 
                    className="bg-cover bg-center min-h-[300px]"
                    style={{ backgroundImage: `url(${banner.banner_image_url})` }}
                  />
                  <div 
                    className="p-8 flex flex-col justify-center"
                    style={getBannerStyle()}
                  >
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-lg opacity-90 mb-4">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.text_content && (
                      <p className="text-base opacity-80 leading-relaxed">
                        {banner.text_content}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Text-only banner
                <div 
                  className="p-8 md:p-12 min-h-[300px] flex items-center justify-center"
                  style={getBannerStyle()}
                >
                  <div className="text-center max-w-2xl">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-lg md:text-xl opacity-90 mb-6">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.text_content && (
                      <p className="text-base md:text-lg opacity-80 leading-relaxed">
                        {banner.text_content}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banner Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-4">Banner Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Content Type</label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="capitalize">
                        {banner.content_type}
                      </Badge>
                    </div>
                  </div>
                  
                  {banner.animation_type && banner.animation_type !== 'none' && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Animation</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="capitalize">
                          {banner.animation_type}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4" />
                      {formatDate(banner.created_at)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Eye className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button 
              onClick={() => navigate('/')}
              size="lg"
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerDetail;
