import React, { useState } from 'react';
import { X, Archive, BookOpen, AlertTriangle, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Nomination } from '@/lib/api/bookclubs/types';
import { archiveNomination } from '@/lib/api/bookclubs/nominations/manage';
import { setCurrentBookFromNomination } from '@/lib/api/bookclubs/books';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NominationManagementModalProps {
  open: boolean;
  onClose: () => void;
  nomination: Nomination | null;
  clubId: string;
  onSuccess: () => void;
}

const NominationManagementModal: React.FC<NominationManagementModalProps> = ({
  open,
  onClose,
  nomination,
  clubId,
  onSuccess
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'archive'>('current');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!nomination) return null;

  const handleSetAsCurrent = async () => {
    if (!user?.id || !nomination) return;

    setIsProcessing(true);
    try {
      await setCurrentBookFromNomination(user.id, clubId, nomination.id);
      toast.success('Current book updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error setting current book:', error);
      toast.error('Failed to set as current book');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveNomination = async () => {
    if (!user?.id || !nomination) return;

    setIsProcessing(true);
    try {
      await archiveNomination(user.id, nomination.id);
      toast.success('Nomination archived successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error archiving nomination:', error);
      toast.error(error.message || 'Failed to archive nomination');
    } finally {
      setIsProcessing(false);
      setConfirmArchive(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-bookconnect-terracotta" />
            Manage Nomination
          </DialogTitle>
          <DialogDescription>
            Manage this book nomination for your club.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex mb-4">
            {nomination.book.cover_url ? (
              <img
                src={nomination.book.cover_url}
                alt={`Cover of ${nomination.book.title}`}
                className="w-20 h-30 object-cover rounded shadow mr-4"
              />
            ) : (
              <div className="w-20 h-30 bg-gray-200 rounded flex items-center justify-center mr-4">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-lg">{nomination.book.title}</h3>
              <p className="text-gray-600 text-sm">by {nomination.book.author}</p>
              <p className="text-xs text-gray-500 mt-1">
                {nomination.like_count} {nomination.like_count === 1 ? 'like' : 'likes'}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'current' | 'archive')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Set as Current</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4">
              <div className="space-y-4">
                <p>
                  Setting this book as the current book will make it visible to all club members as the book the club is currently reading.
                </p>

                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important</p>
                      <p className="text-sm text-amber-700">
                        This will replace the current book if one is already set. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSetAsCurrent}
                  disabled={isProcessing}
                  className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Set as Current Book
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="archive" className="mt-4">
              <div className="space-y-4">
                <p>
                  Archiving this nomination will remove it from the active nominations list. Archived nominations can still be viewed but cannot be liked or selected as the current book.
                </p>

                {!confirmArchive ? (
                  <Button
                    onClick={() => setConfirmArchive(true)}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Nomination
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-50 p-3 rounded-md border border-red-200">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Confirm Archive</p>
                          <p className="text-sm text-red-700">
                            Are you sure you want to archive this nomination? This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setConfirmArchive(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleArchiveNomination}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Confirm Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NominationManagementModal;
