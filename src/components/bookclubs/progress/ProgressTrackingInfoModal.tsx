/**
 * Progress Tracking Information Modal
 * 
 * Provides detailed information about the reading progress tracking feature
 * for club leaders to understand what the feature does and how it works.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Clock,
  BarChart3,
  CheckCircle,
  Shield,
  Zap,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackingInfoModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Current status of progress tracking */
  isEnabled: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

const ProgressTrackingInfoModal: React.FC<ProgressTrackingInfoModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  className
}) => {
  const features = [
    {
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      title: "Multiple Progress Types",
      description: "Members can track progress by percentage, chapter numbers, or page numbers",
      badge: "Flexible"
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      title: "Privacy Controls",
      description: "Each member can choose to make their progress public or keep it private",
      badge: "Private"
    },
    {
      icon: <Zap className="h-5 w-5 text-purple-600" />,
      title: "Real-time Updates",
      description: "Progress changes appear instantly for all club members",
      badge: "Live"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-orange-600" />,
      title: "Club Statistics",
      description: "View completion rates and engagement metrics for your club",
      badge: "Analytics"
    },
    {
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      title: "Member Engagement",
      description: "Encourage reading through social accountability and progress sharing",
      badge: "Social"
    },
    {
      icon: <Clock className="h-5 w-5 text-teal-600" />,
      title: "Reading Notes",
      description: "Members can add personal notes about their reading experience",
      badge: "Notes"
    }
  ];

  const benefits = [
    "Increase member engagement and reading completion rates",
    "Foster a sense of community through shared progress",
    "Help members stay motivated with social accountability",
    "Track club-wide reading activity and participation",
    "Respect individual privacy preferences",
    "Encourage discussion about reading experiences"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
          "sm:max-w-3xl w-[95vw] sm:w-full",
          className
        )}
        aria-describedby="progress-info-description"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bookconnect-terracotta/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-bookconnect-terracotta" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Reading Progress Tracking
                </DialogTitle>
                <DialogDescription id="progress-info-description" className="text-gray-600">
                  Learn about this powerful feature for engaging your book club members
                </DialogDescription>
              </div>
            </div>
            <Badge 
              variant={isEnabled ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isEnabled 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              {isEnabled ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {/* Overview */}
          <div className="bg-bookconnect-terracotta/5 p-4 rounded-lg border border-bookconnect-terracotta/20">
            <h3 className="font-semibold text-gray-900 mb-2">What is Reading Progress Tracking?</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Reading Progress Tracking allows your club members to share their reading progress for the current book. 
              Members can track how much they've read, add personal notes, and see how others in the club are progressing. 
              This creates a more engaging and social reading experience while respecting individual privacy preferences.
            </p>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {feature.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Benefits for Your Club</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Privacy & Control</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span><strong>Public Progress:</strong> Visible to all club members (default)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    <span><strong>Private Progress:</strong> Only visible to the member themselves</span>
                  </div>
                  <p className="mt-2">
                    Members have complete control over their privacy settings and can change them at any time. 
                    As a club leader, you cannot override individual privacy preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Enable the feature</strong> - Toggle on progress tracking for your club
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Members track progress</strong> - Club members can update their reading progress anytime
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  3
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>View club statistics</strong> - See completion rates and member engagement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  4
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Foster engagement</strong> - Members stay motivated through social reading
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="bg-bookconnect-brown hover:bg-bookconnect-brown/90">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressTrackingInfoModal;
