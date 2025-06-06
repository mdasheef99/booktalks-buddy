import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Book, ThumbsUp, Check, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentBook, setCurrentBookFromNomination } from '@/lib/api/bookclubs/books';
import { getNominations } from '@/lib/api/bookclubs/nominations';
import { Nomination } from '@/lib/api/bookclubs/types';
import SkeletonBookCover from '@/components/books/SkeletonBookCover';

interface CurrentBookPanelProps {
  clubId: string;
}

/**
 * Current Book Panel Component
 *
 * This component allows club leads to select the current book from nominations.
 */
const CurrentBookPanel: React.FC<CurrentBookPanelProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [currentBook, setCurrentBook] = useState<any | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [filteredNominations, setFilteredNominations] = useState<Nomination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [nominationToSelect, setNominationToSelect] = useState<Nomination | null>(null);

  // Load current book and nominations
  useEffect(() => {
    async function loadData() {
      if (!clubId || !user?.id) return;

      try {
        setLoading(true);

        // Load current book
        const bookData = await getCurrentBook(clubId);
        setCurrentBook(bookData);

        // Load nominations
        const nominationsData = await getNominations(clubId, user.id);

        // Filter out nominations that are already selected
        const activeNominations = nominationsData.filter(
          nom => nom.status !== 'selected' && nom.status !== 'archived'
        );

        setNominations(activeNominations);
        setFilteredNominations(activeNominations);
      } catch (error) {
        console.error('Error loading book data:', error);
        toast.error('Failed to load book data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clubId, user?.id]);

  // Filter nominations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNominations(nominations);
      return;
    }

    const query = searchQuery.toLowerCase();

    const matchedNominations = nominations.filter(nomination =>
      nomination.book.title.toLowerCase().includes(query) ||
      (nomination.book.author && nomination.book.author.toLowerCase().includes(query))
    );

    setFilteredNominations(matchedNominations);
  }, [searchQuery, nominations]);

  // Handle setting current book
  const handleSetCurrentBook = async (nomination: Nomination) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);

      await setCurrentBookFromNomination(user.id, clubId, nomination.id);

      // Update current book
      const bookData = await getCurrentBook(clubId);
      setCurrentBook(bookData);

      // Update nominations list (remove the selected one)
      setNominations(nominations.filter(nom => nom.id !== nomination.id));
      setFilteredNominations(filteredNominations.filter(nom => nom.id !== nomination.id));

      toast.success('Current book updated successfully');
    } catch (error) {
      console.error('Error setting current book:', error);
      toast.error('Failed to update current book');
    } finally {
      setProcessingAction(false);
      setNominationToSelect(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Current Book Management
          </CardTitle>
          <CardDescription>
            View and update the current book for your club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Book Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Current Book</h3>
            {currentBook ? (
              <div className="flex gap-4 p-4 border rounded-md">
                <SkeletonBookCover
                  src={currentBook.book?.cover_url}
                  alt={`Cover of ${currentBook.title || currentBook.book?.title}`}
                  width="w-24"
                  height="h-36"
                  className="rounded shadow"
                  viewType="list"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-medium">
                    {currentBook.book?.title || currentBook.title}
                  </h4>
                  <p className="text-gray-600 mb-2">
                    by {currentBook.book?.author || currentBook.author || 'Unknown Author'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Selected on {new Date(currentBook.set_at).toLocaleDateString()}
                  </p>
                  {currentBook.book?.description && (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {currentBook.book.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md">
                <p className="text-gray-500">No book currently selected</p>
              </div>
            )}
          </div>

          {/* Nominations Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Book Nominations</h3>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search nominations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredNominations.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Nominated By</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNominations.map((nomination) => (
                      <TableRow key={nomination.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <SkeletonBookCover
                              src={nomination.book.cover_url}
                              alt={`Cover of ${nomination.book.title}`}
                              width="w-10"
                              height="h-14"
                              className="rounded shadow"
                              viewType="list"
                            />
                            <div>
                              <div className="font-medium">{nomination.book.title}</div>
                              <div className="text-sm text-gray-500">
                                {nomination.book.author || 'Unknown Author'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4 text-gray-500" />
                            <span>{nomination.like_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setNominationToSelect(nomination)}
                            disabled={processingAction}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md">
                <p className="text-gray-500">No active nominations found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Encourage club members to nominate books for the club to read.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog for setting current book */}
      <AlertDialog open={!!nominationToSelect} onOpenChange={(open) => !open && setNominationToSelect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Current Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set "{nominationToSelect?.book.title}" as the current book for this club?
              {currentBook && (
                <p className="mt-2">
                  This will replace the current book "{currentBook.book?.title || currentBook.title}".
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => nominationToSelect && handleSetCurrentBook(nominationToSelect)}
              disabled={processingAction}
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting...
                </>
              ) : (
                <>Set as Current Book</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CurrentBookPanel;
