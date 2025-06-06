import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentQuote } from '@/hooks/useCustomQuotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QuotePreviewProps {
  storeId: string;
  onRefresh?: () => void;
}

export const QuotePreview: React.FC<QuotePreviewProps> = ({ 
  storeId, 
  onRefresh 
}) => {
  const { currentQuote, loading, error, refetch } = useCurrentQuote(storeId);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" text="Loading preview..." />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Failed to load preview</div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : !currentQuote ? (
          <div className="text-center py-8 space-y-4">
            <div className="flex items-center justify-center">
              <EyeOff className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Quote Section Hidden
              </h3>
              <p className="text-gray-500 text-sm">
                No active quotes found. The quote section will be hidden on your landing page.
              </p>
              <Badge variant="secondary" className="mt-2">
                Section Hidden
              </Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Currently Displayed
              </Badge>
            </div>

            {/* Quote Preview - Mimics the actual landing page styling */}
            <div className="relative">
              <div className="py-12 px-6 bg-bookconnect-sage/30 relative overflow-hidden rounded-lg">
                <div className="absolute inset-0 opacity-5">
                  <div 
                    className="absolute inset-0 rounded-lg" 
                    style={{
                      backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                </div>
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                  <svg 
                    className="h-10 w-10 text-bookconnect-terracotta opacity-50 mx-auto mb-4" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 11C10 8.22 7.77 6 5 6V15C5 17.77 7.22 20 10 20V11Z" fill="currentColor" />
                    <path d="M19 11C19 8.22 16.77 6 14 6V15C14 17.77 16.22 20 19 20V11Z" fill="currentColor" />
                  </svg>
                  
                  <p className="text-lg md:text-xl lg:text-2xl font-serif italic font-medium text-bookconnect-brown leading-relaxed">
                    "{currentQuote.quote_text}"
                  </p>
                  
                  {(currentQuote.quote_author || currentQuote.quote_source) && (
                    <div className="mt-3 text-bookconnect-brown/70">
                      — {currentQuote.quote_author}
                      {currentQuote.quote_source && `, ${currentQuote.quote_source}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quote Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Category:</span>
                <Badge variant="secondary" className="capitalize">
                  {currentQuote.quote_category.replace('_', ' ')}
                </Badge>
              </div>
              
              {currentQuote.quote_tags && currentQuote.quote_tags.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tags:</span>
                  <div className="flex gap-1">
                    {currentQuote.quote_tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {currentQuote.quote_tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentQuote.quote_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {(currentQuote.start_date || currentQuote.end_date) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="text-gray-800">
                    {currentQuote.start_date && (
                      <>From {new Date(currentQuote.start_date).toLocaleDateString()}</>
                    )}
                    {currentQuote.start_date && currentQuote.end_date && ' • '}
                    {currentQuote.end_date && (
                      <>Until {new Date(currentQuote.end_date).toLocaleDateString()}</>
                    )}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Display Order:</span>
                <span className="text-gray-800">#{currentQuote.display_order}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
