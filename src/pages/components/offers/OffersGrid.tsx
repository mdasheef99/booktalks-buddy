import React from 'react';
import { PromotionalBanner } from '@/components/landing/banners/PromotionalBanner';
import { PromotionalBanner as BannerType } from '@/lib/api/store/banners/types/bannerTypes';

interface OffersGridProps {
  offers: BannerType[];
}

/**
 * Grid component for displaying promotional offers
 * Reuses the existing PromotionalBanner component for consistency
 */
export const OffersGrid: React.FC<OffersGridProps> = ({ offers }) => {
  const trackOfferClick = (offer: BannerType) => {
    // Enhanced analytics for offers page
    console.log('Offer clicked from offers page:', {
      offerId: offer.id,
      title: offer.title,
      source: 'offers-page',
      timestamp: new Date().toISOString()
    });
    
    if (offer.cta_url) {
      window.open(offer.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="grid gap-6 md:gap-8">
      {offers.map((offer, index) => (
        <PromotionalBanner
          key={offer.id}
          banner={offer}
          index={index}
          onBannerClick={() => trackOfferClick(offer)}
          className="max-w-4xl mx-auto" // Center and limit width
        />
      ))}
    </div>
  );
};
