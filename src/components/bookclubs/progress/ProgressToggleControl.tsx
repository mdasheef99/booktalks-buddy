import React, { useState } from 'react';
import { TrendingUp, Loader2, Info, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import ProgressTrackingInfoModal from './ProgressTrackingInfoModal';
import { cn } from '@/lib/utils';

interface ProgressToggleControlProps {
  clubId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  canManage: boolean;
  loading?: boolean;
}

const ProgressToggleControl: React.FC<ProgressToggleControlProps> = ({
  clubId,
  enabled,
  onToggle,
  canManage,
  loading = false,
}) => {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleToggle = async (newEnabled: boolean) => {
    if (!canManage) return;

    setIsToggling(true);
    try {
      // Import the API function dynamically
      const { toggleClubProgressTracking } = await import('@/lib/api/bookclubs/progress');
      
      // Get current user ID
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await toggleClubProgressTracking(user.id, clubId, newEnabled);
      onToggle(newEnabled);
      
      toast({
        title: newEnabled ? 'Progress Tracking Enabled' : 'Progress Tracking Disabled',
        description: newEnabled 
          ? 'Members can now track their reading progress for this club.'
          : 'Progress tracking has been disabled for this club.',
      });
    } catch (error) {
      console.error('Error toggling progress tracking:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update progress tracking setting',
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <>
      {/* Compact Toggle Control */}
      <div className="flex items-center gap-2">
        {/* Main Toggle Button */}
        {enabled ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || isToggling}
                className={cn(
                  "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300",
                  "transition-colors duration-200"
                )}
              >
                {isToggling && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                <TrendingUp className="h-3 w-3 mr-2" />
                Disable Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable Progress Tracking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will hide all progress tracking features from club members.
                  Existing progress data will be preserved but not visible until you re-enable this feature.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleToggle(false)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Disable Progress Tracking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            onClick={() => handleToggle(true)}
            size="sm"
            disabled={loading || isToggling}
            className={cn(
              "bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90",
              "border-bookconnect-terracotta text-white",
              "transition-colors duration-200"
            )}
          >
            {isToggling && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
            <TrendingUp className="h-3 w-3 mr-2" />
            Enable Progress
          </Button>
        )}

        {/* Information Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfoModal(true)}
          className={cn(
            "text-bookconnect-brown hover:text-bookconnect-brown/80",
            "hover:bg-bookconnect-brown/10 transition-colors duration-200",
            "p-2"
          )}
          aria-label="Learn about progress tracking"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Information Modal */}
      <ProgressTrackingInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        isEnabled={enabled}
      />
    </>
  );
};

export default ProgressToggleControl;
