import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerItem {
  id: string;
  store_id: string;
  title: string;
  subtitle?: string;
  content_type: 'text' | 'image' | 'mixed';
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  banner_image_alt?: string;
  background_color?: string;
  text_color?: string;
  animation_type?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  priority_order: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

interface PromotionalBannerProps {
  banner: BannerItem;
  index: number;
  onBannerClick?: (bannerId: string) => void;
  className?: string;
}

const animationClasses = {
  none: '',
  fade: 'animate-fade-in',
  slide: 'animate-slide-in-left',
  bounce: 'animate-bounce-in',
  pulse: 'animate-pulse-slow'
};

/**
 * Individual promotional banner component
 * Supports text, image, and mixed content types with animations
 */
export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  banner,
  index,
  onBannerClick,
  className
}) => {
  const animationClass = banner.animation_type ? animationClasses[banner.animation_type] : '';
  const hasClickAction = banner.cta_url || onBannerClick;

  // Determine banner style based on content type
  const getBannerStyle = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (banner.background_color) {
      baseStyle.backgroundColor = banner.background_color;
    }
    
    if (banner.text_color) {
      baseStyle.color = banner.text_color;
    }

    if (banner.content_type === 'image' && banner.banner_image_url) {
      baseStyle.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${banner.banner_image_url})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.color = banner.text_color || '#ffffff';
    }

    return baseStyle;
  };

  const handleBannerClick = () => {
    if (onBannerClick) {
      onBannerClick(banner.id);
    }
  };

  // Text-only banner
  if (banner.content_type === 'text') {
    return (
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg border-0",
          hasClickAction && "cursor-pointer hover:scale-[1.02]",
          animationClass,
          className
        )}
        style={getBannerStyle()}
        onClick={hasClickAction ? handleBannerClick : undefined}
      >
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {banner.title}
              </h3>
              
              {banner.subtitle && (
                <p className="text-lg opacity-90 mb-3">
                  {banner.subtitle}
                </p>
              )}
              
              {banner.text_content && (
                <p className="text-sm md:text-base opacity-80 leading-relaxed">
                  {banner.text_content}
                </p>
              )}
            </div>

            {banner.cta_text && banner.cta_url && (
              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-inherit border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick();
                  }}
                >
                  {banner.cta_text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Image-only banner
  if (banner.content_type === 'image') {
    return (
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg border-0 min-h-[200px] md:min-h-[250px]",
          hasClickAction && "cursor-pointer hover:scale-[1.02]",
          animationClass,
          className
        )}
        style={getBannerStyle()}
        onClick={hasClickAction ? handleBannerClick : undefined}
      >
        <CardContent className="p-6 md:p-8 h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white drop-shadow-lg">
              {banner.title}
            </h3>
            
            {banner.subtitle && (
              <p className="text-lg md:text-xl text-white/90 drop-shadow mb-6">
                {banner.subtitle}
              </p>
            )}

            {banner.cta_text && banner.cta_url && (
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
              >
                {banner.cta_text}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mixed content banner (image + text)
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg border-0",
        hasClickAction && "cursor-pointer hover:scale-[1.02]",
        animationClass,
        className
      )}
      onClick={hasClickAction ? handleBannerClick : undefined}
    >
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0 min-h-[200px]">
          {/* Image Section */}
          {banner.banner_image_url && (
            <div 
              className="bg-cover bg-center min-h-[200px] md:min-h-[250px]"
              style={{
                backgroundImage: `url(${banner.banner_image_url})`,
              }}
            />
          )}

          {/* Content Section */}
          <div 
            className="p-6 md:p-8 flex flex-col justify-center"
            style={{
              backgroundColor: banner.background_color || '#ffffff',
              color: banner.text_color || '#000000'
            }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              {banner.title}
            </h3>
            
            {banner.subtitle && (
              <p className="text-lg opacity-90 mb-4">
                {banner.subtitle}
              </p>
            )}
            
            {banner.text_content && (
              <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
                {banner.text_content}
              </p>
            )}

            {banner.cta_text && banner.cta_url && (
              <Button
                variant="default"
                size="lg"
                className="w-fit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
              >
                {banner.cta_text}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
