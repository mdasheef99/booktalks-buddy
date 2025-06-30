import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Tag, Filter, ArrowLeft } from 'lucide-react';

interface OffersHeaderProps {
  sortBy: 'priority' | 'date' | 'title';
  setSortBy: (sort: 'priority' | 'date' | 'title') => void;
  filterBy: 'all' | 'active' | 'upcoming';
  setFilterBy: (filter: 'all' | 'active' | 'upcoming') => void;
  totalOffers: number;
  onRefresh: () => void;
}

/**
 * Header component for the Offers page
 * Contains title, offer count, and filter/sort controls
 */
export const OffersHeader: React.FC<OffersHeaderProps> = ({
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy,
  totalOffers,
  onRefresh
}) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };
  return (
    <header className="bg-white border-b border-bookconnect-brown/20 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        {/* Back to Home Button */}
        <div className="mb-4">
          <Button
            onClick={handleBackToHome}
            variant="ghost"
            className="text-bookconnect-brown hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5 p-2"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bookconnect-terracotta/10 rounded-lg">
              <Tag className="w-6 h-6 text-bookconnect-terracotta" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-bookconnect-brown">
                Special Offers
              </h1>
              <p className="text-bookconnect-brown/70 mt-1">
                {totalOffers} {totalOffers === 1 ? 'offer' : 'offers'} available
              </p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offers</SelectItem>
                <SelectItem value="active">Active Now</SelectItem>
                <SelectItem value="upcoming">Coming Soon</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="date">Newest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              className="text-bookconnect-brown border-bookconnect-brown/20 hover:bg-bookconnect-brown/5"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
