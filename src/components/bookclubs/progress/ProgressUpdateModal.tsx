import React, { useState, useEffect } from 'react';
import { BookOpen, Percent, Hash, FileText, Lock, Unlock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { ReadingProgress, CreateProgressRequest } from '@/lib/api/bookclubs/progress';

interface ProgressUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  bookId?: string;
  currentProgress?: ReadingProgress | null;
  onProgressUpdated: (progress: ReadingProgress) => void;
}

type ProgressStatus = 'not_started' | 'reading' | 'finished';
type ProgressType = 'percentage' | 'chapter' | 'page';

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  isOpen,
  onClose,
  clubId,
  bookId,
  currentProgress,
  onProgressUpdated,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [status, setStatus] = useState<ProgressStatus>('not_started');
  const [progressType, setProgressType] = useState<ProgressType>('percentage');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [currentChapterPage, setCurrentChapterPage] = useState<number>(1);
  const [totalChapterPage, setTotalChapterPage] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  // Initialize form with current progress data
  useEffect(() => {
    if (currentProgress) {
      setStatus(currentProgress.status);
      setProgressType(currentProgress.progress_type || 'percentage');
      setProgressPercentage(currentProgress.progress_percentage || 0);
      setCurrentChapterPage(currentProgress.current_progress || 1);
      setTotalChapterPage(currentProgress.total_progress || 1);
      setNotes(currentProgress.notes || '');
      setIsPrivate(currentProgress.is_private);
    } else {
      // Reset to defaults for new progress
      setStatus('not_started');
      setProgressType('percentage');
      setProgressPercentage(0);
      setCurrentChapterPage(1);
      setTotalChapterPage(1);
      setNotes('');
      setIsPrivate(false);
    }
  }, [currentProgress, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user ID from auth context
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare the progress data
      const progressData: CreateProgressRequest = {
        club_id: clubId,
        book_id: bookId,
        status,
        is_private: isPrivate,
        notes: notes.trim() || undefined,
      };

      // Add progress-specific data for reading status
      if (status === 'reading') {
        progressData.progress_type = progressType;

        if (progressType === 'percentage') {
          progressData.progress_percentage = progressPercentage;
        } else {
          progressData.current_progress = currentChapterPage;
          progressData.total_progress = totalChapterPage;
        }
      }

      // Create optimistic progress object for immediate UI update
      const optimisticProgress: ReadingProgress = {
        id: currentProgress?.id || 'temp-' + Date.now(),
        club_id: clubId,
        user_id: user.id,
        book_id: bookId || null,
        status,
        progress_type: status === 'reading' ? progressType : null,
        current_progress: status === 'reading' && progressType !== 'percentage' ? currentChapterPage : null,
        total_progress: status === 'reading' && progressType !== 'percentage' ? totalChapterPage : null,
        progress_percentage: status === 'reading' && progressType === 'percentage' ? progressPercentage : null,
        notes: notes.trim() || null,
        is_private: isPrivate,
        started_at: currentProgress?.started_at || (status !== 'not_started' ? new Date().toISOString() : null),
        finished_at: status === 'finished' ? new Date().toISOString() : null,
        created_at: currentProgress?.created_at || new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      // Optimistic update - immediately update UI
      onProgressUpdated(optimisticProgress);
      onClose();

      // Show optimistic success message
      toast({
        title: 'Progress Updated',
        description: 'Your reading progress has been saved successfully.',
      });

      // Import the API function dynamically to avoid circular dependencies
      const { upsertReadingProgress } = await import('@/lib/api/bookclubs/progress');

      // Perform actual API call in background
      const updatedProgress = await upsertReadingProgress(user.id, progressData);

      // Update with real data from server (real-time subscription will handle this)
      // onProgressUpdated(updatedProgress); // Commented out to avoid double update

    } catch (error) {
      console.error('Error updating progress:', error);

      // Revert optimistic update by refetching current state
      if (currentProgress) {
        onProgressUpdated(currentProgress);
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update progress',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const getProgressDisplay = () => {
    if (status === 'not_started') return 'Not Started';
    if (status === 'finished') return 'Finished';
    
    if (progressType === 'percentage') {
      return `${progressPercentage}%`;
    } else if (progressType === 'chapter') {
      return `Chapter ${currentChapterPage}/${totalChapterPage}`;
    } else {
      return `Page ${currentChapterPage}/${totalChapterPage}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
        aria-describedby="progress-update-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-bookconnect-terracotta" aria-hidden="true" />
            Update Reading Progress
          </DialogTitle>
          <div id="progress-update-description" className="sr-only">
            Update your reading progress for the current book club selection. Choose your status, progress type, and privacy settings.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Update reading progress form">
          {/* Status Selection */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Reading Status</legend>
            <RadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as ProgressStatus)}
              className="grid grid-cols-1 gap-2"
              aria-label="Select your reading status"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="not_started" id="not_started" />
                <Label htmlFor="not_started" className="flex-1 cursor-pointer">
                  Not Started
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="reading" id="reading" />
                <Label htmlFor="reading" className="flex-1 cursor-pointer">
                  Currently Reading
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="finished" id="finished" />
                <Label htmlFor="finished" className="flex-1 cursor-pointer">
                  Finished
                </Label>
              </div>
            </RadioGroup>
          </fieldset>

          {/* Progress Input (only for reading status) */}
          {status === 'reading' && (
            <div className="space-y-4">
              {/* Progress Type Selection */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Track Progress By</legend>
                <RadioGroup
                  value={progressType}
                  onValueChange={(value) => setProgressType(value as ProgressType)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                  aria-label="Select how to track your progress"
                >
                  <div className="flex items-center space-x-2 p-3 sm:p-2 border rounded hover:bg-gray-50 touch-manipulation">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="flex items-center gap-1 cursor-pointer text-sm">
                      <Percent className="h-4 w-4 sm:h-3 sm:w-3" />
                      Percent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 sm:p-2 border rounded hover:bg-gray-50 touch-manipulation">
                    <RadioGroupItem value="chapter" id="chapter" />
                    <Label htmlFor="chapter" className="flex items-center gap-1 cursor-pointer text-sm">
                      <Hash className="h-4 w-4 sm:h-3 sm:w-3" />
                      Chapter
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 sm:p-2 border rounded hover:bg-gray-50 touch-manipulation">
                    <RadioGroupItem value="page" id="page" />
                    <Label htmlFor="page" className="flex items-center gap-1 cursor-pointer text-sm">
                      <FileText className="h-4 w-4 sm:h-3 sm:w-3" />
                      Page
                    </Label>
                  </div>
                </RadioGroup>
              </fieldset>

              {/* Progress Input */}
              {progressType === 'percentage' ? (
                <div className="space-y-3">
                  <Label htmlFor="progress-slider" className="text-sm font-medium">
                    Progress: {progressPercentage}%
                  </Label>
                  <Slider
                    id="progress-slider"
                    value={[progressPercentage]}
                    onValueChange={(value) => setProgressPercentage(value[0])}
                    max={100}
                    step={1}
                    className="w-full"
                    aria-label={`Reading progress: ${progressPercentage} percent`}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-progress" className="text-sm font-medium">
                      Current {progressType === 'chapter' ? 'Chapter' : 'Page'}
                    </Label>
                    <Input
                      id="current-progress"
                      type="number"
                      min="1"
                      max={totalChapterPage}
                      value={currentChapterPage}
                      onChange={(e) => setCurrentChapterPage(parseInt(e.target.value) || 1)}
                      className="w-full h-12 sm:h-10 text-base sm:text-sm"
                      inputMode="numeric"
                      aria-label={`Current ${progressType === 'chapter' ? 'chapter' : 'page'} number`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total-progress" className="text-sm font-medium">
                      Total {progressType === 'chapter' ? 'Chapters' : 'Pages'}
                    </Label>
                    <Input
                      id="total-progress"
                      type="number"
                      min={currentChapterPage}
                      value={totalChapterPage}
                      onChange={(e) => setTotalChapterPage(parseInt(e.target.value) || 1)}
                      className="w-full h-12 sm:h-10 text-base sm:text-sm"
                      inputMode="numeric"
                      aria-label={`Total ${progressType === 'chapter' ? 'chapters' : 'pages'} in book`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="progress-notes" className="text-sm font-medium">
              Notes (Optional)
              <span className="text-xs text-gray-500 ml-1" aria-label={`${notes.length} of 500 characters used`}>
                {notes.length}/500
              </span>
            </Label>
            <Textarea
              id="progress-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Add any thoughts or notes about your reading..."
              className="min-h-[100px] sm:min-h-[80px] resize-none text-base sm:text-sm"
              aria-describedby="notes-description"
            />
            <p id="notes-description" className="sr-only">
              Optional notes about your reading progress. Maximum 500 characters.
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {isPrivate ? (
                <Lock className="h-4 w-4 text-gray-600" aria-hidden="true" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-600" aria-hidden="true" />
              )}
              <div>
                <Label htmlFor="privacy-toggle" className="text-sm font-medium">
                  {isPrivate ? 'Private Progress' : 'Public Progress'}
                </Label>
                <p className="text-xs text-gray-500" id="privacy-description">
                  {isPrivate
                    ? 'Only you can see your progress'
                    : 'Visible to all club members'
                  }
                </p>
              </div>
            </div>
            <Switch
              id="privacy-toggle"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              aria-describedby="privacy-description"
              aria-label={isPrivate ? 'Make progress private' : 'Make progress public'}
            />
          </div>

          {/* Progress Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Preview</Label>
            <p className="text-sm text-gray-600 mt-1">
              Your progress will show as: <span className="font-medium">{getProgressDisplay()}</span>
              {isPrivate && <span className="text-xs text-gray-500 ml-2">(Private)</span>}
            </p>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 order-1 sm:order-2"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Progress
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressUpdateModal;
