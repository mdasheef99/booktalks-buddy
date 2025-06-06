/**
 * Quick Tips Component
 * 
 * Displays helpful tips based on current dashboard state
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { QuickTipsProps, TipItemProps } from '../types';

/**
 * Tip Item Component
 */
const TipItem: React.FC<TipItemProps> = ({ message, bgColor, textColor, show }) => {
  if (!show) return null;

  return (
    <div className={`p-3 ${bgColor} rounded-lg`}>
      <p className={`text-sm ${textColor}`}>{message}</p>
    </div>
  );
};

/**
 * Quick Tips Component
 */
export const QuickTips: React.FC<QuickTipsProps> = ({ stats }) => {
  const tips = [
    {
      message: 'Customize your hero section with a personal quote',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-800',
      show: !stats.hero.hasCustomQuote
    },
    {
      message: 'Add books to your carousel to showcase featured titles',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      show: stats.carousel.active === 0
    },
    {
      message: 'Create promotional banners to highlight special offers',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      show: stats.banners.active === 0
    },
    {
      message: 'Add inspirational quotes to engage your visitors',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      show: stats.quotes.active === 0
    },
    {
      message: 'Feature community members to build social proof',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
      show: stats.community.spotlights === 0
    }
  ];

  // Check if all sections are configured
  const allConfigured = stats.hero.hasCustomQuote && 
                       stats.carousel.active > 0 && 
                       stats.banners.active > 0 && 
                       stats.quotes.active > 0 && 
                       stats.community.spotlights > 0;

  const successTip = {
    message: '🎉 Excellent! All sections are fully configured. Check analytics to see performance.',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    show: allConfigured
  };

  // Filter tips to show only relevant ones
  const visibleTips = tips.filter(tip => tip.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Quick Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Show success message if all configured */}
        <TipItem
          message={successTip.message}
          bgColor={successTip.bgColor}
          textColor={successTip.textColor}
          show={successTip.show}
        />

        {/* Show improvement tips if not all configured */}
        {!allConfigured && visibleTips.map((tip, index) => (
          <TipItem
            key={index}
            message={tip.message}
            bgColor={tip.bgColor}
            textColor={tip.textColor}
            show={tip.show}
          />
        ))}

        {/* Show default message if no tips are visible */}
        {!allConfigured && visibleTips.length === 0 && (
          <TipItem
            message="Your landing page setup is looking good! Continue adding content to improve engagement."
            bgColor="bg-gray-50"
            textColor="text-gray-800"
            show={true}
          />
        )}
      </CardContent>
    </Card>
  );
};
