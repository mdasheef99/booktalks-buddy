import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';

const ModerationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bookconnect-cream to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              size="sm"
              className="text-bookconnect-brown hover:text-bookconnect-brown/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="border-b border-bookconnect-brown/20 pb-4">
            <h1 className="text-3xl font-bold text-bookconnect-brown font-serif">
              Content Moderation
            </h1>
            <p className="text-bookconnect-brown/70 mt-2">
              Review and manage reported content across the platform
            </p>
          </div>
        </div>

        {/* Moderation Dashboard */}
        <ModerationDashboard />
      </div>
    </div>
  );
};

export default ModerationPage;
