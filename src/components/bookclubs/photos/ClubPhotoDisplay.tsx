import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface ClubPhotoDisplayProps {
  photoUrl?: string;
  thumbnailUrl?: string;
  clubName: string;
  size: 'small' | 'medium' | 'large';
  aspectRatio?: '16:9' | '3:2' | '1:1';
  showFallback?: boolean;
  loading?: boolean;
  className?: string;
}

export const ClubPhotoDisplay: React.FC<ClubPhotoDisplayProps> = ({
  photoUrl,
  thumbnailUrl,
  clubName,
  size,
  aspectRatio = '3:2',
  showFallback = true,
  loading = false,
  className = ""
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Determine which image to use based on size
  useEffect(() => {
    if (size === 'small' && thumbnailUrl) {
      setCurrentSrc(thumbnailUrl);
    } else if (photoUrl) {
      setCurrentSrc(photoUrl);
    } else {
      setCurrentSrc(null);
    }
    setImageLoaded(false);
    setImageError(false);
  }, [photoUrl, thumbnailUrl, size]);

  // Size classes
  const sizeClasses = {
    small: 'h-16 w-24',
    medium: 'h-32 w-48',
    large: 'h-48 w-72'
  };

  // Aspect ratio classes
  const aspectClasses = {
    '16:9': 'aspect-video',
    '3:2': 'aspect-[3/2]',
    '1:1': 'aspect-square'
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Geometric pattern fallback
  const GeometricPattern = () => (
    <div className="w-full h-full bg-gradient-to-br from-bookconnect-brown/10 to-bookconnect-terracotta/10 flex items-center justify-center relative overflow-hidden">
      {/* Geometric pattern background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id={`geometric-${clubName.replace(/\s+/g, '-')}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" className="text-bookconnect-brown" />
              <rect x="5" y="5" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-bookconnect-terracotta" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#geometric-${clubName.replace(/\s+/g, '-')})`} />
        </svg>
      </div>
      
      {/* Club name overlay */}
      <div className="relative z-10 text-center p-4">
        <ImageIcon className="h-8 w-8 mx-auto text-bookconnect-brown/60 mb-2" />
        <p className="text-sm font-medium text-bookconnect-brown/80 line-clamp-2">
          {clubName}
        </p>
      </div>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
      <ImageIcon className="h-8 w-8 text-gray-400" />
    </div>
  );

  return (
    <div className={`
      relative overflow-hidden rounded-lg bg-gray-100
      ${sizeClasses[size]} ${aspectClasses[aspectRatio]} ${className}
    `}>
      {loading ? (
        <LoadingSkeleton />
      ) : currentSrc && !imageError ? (
        <>
          {/* Main Image */}
          <img
            src={currentSrc}
            alt={`${clubName} club photo`}
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Loading overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSkeleton />
            </div>
          )}
        </>
      ) : showFallback ? (
        <GeometricPattern />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ClubPhotoDisplay;
