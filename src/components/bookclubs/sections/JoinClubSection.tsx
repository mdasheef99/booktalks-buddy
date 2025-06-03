import React, { useState, useEffect } from 'react';
import { UserPlus, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import JoinRequestModal from '@/components/bookclubs/questions/JoinRequestModal';
import { getClubQuestions } from '@/lib/api/bookclubs/questions';
import { useJoinRequest } from '@/hooks/useJoinRequestQuestions';
import type { ClubJoinQuestion, SubmitAnswersRequest } from '@/types/join-request-questions';

interface JoinClubSectionProps {
  clubId: string;
  clubName: string;
  clubPrivacy: string;
  joinQuestionsEnabled?: boolean; // Add this prop
  actionInProgress: boolean;
  handleJoinClub: () => Promise<void>;
}

const JoinClubSection: React.FC<JoinClubSectionProps> = ({
  clubId,
  clubName,
  clubPrivacy,
  joinQuestionsEnabled = false,
  actionInProgress,
  handleJoinClub
}) => {
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<ClubJoinQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null);
  const { submitJoinRequest, loading: submittingRequest } = useJoinRequest();

  // Load questions for private clubs with questions enabled
  useEffect(() => {
    console.log('JoinClubSection useEffect triggered:', {
      clubId,
      clubName,
      clubPrivacy,
      joinQuestionsEnabled,
      shouldLoadQuestions: clubPrivacy === 'private' && joinQuestionsEnabled
    });

    if (clubPrivacy === 'private' && joinQuestionsEnabled) {
      loadQuestions();
    } else {
      // Clear questions if not applicable
      setQuestions([]);
      setQuestionLoadError(null);
    }
  }, [clubId, clubPrivacy, joinQuestionsEnabled]);

  const loadQuestions = async () => {
    if (!clubId || clubId === 'undefined' || clubId === 'null') {
      console.error('Cannot load questions: invalid clubId:', clubId);
      setQuestionLoadError('Invalid club ID');
      return;
    }

    setLoadingQuestions(true);
    setQuestionLoadError(null);
    try {
      const result = await getClubQuestions(clubId);
      if (result.success && result.questions) {
        setQuestions(result.questions);
        console.log('Questions loaded for club:', clubId, result.questions);
      } else {
        console.error('Failed to load questions:', result.error);
        setQuestionLoadError(result.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestionLoadError('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleJoinClick = () => {
    console.log('Join button clicked:', {
      clubPrivacy,
      joinQuestionsEnabled,
      questionsLength: questions.length,
      questions,
      questionLoadError,
      willShowModal: clubPrivacy === 'private' && joinQuestionsEnabled && questions.length > 0
    });

    // Show modal if private club with questions enabled and questions loaded
    if (clubPrivacy === 'private' && joinQuestionsEnabled && questions.length > 0) {
      setShowQuestionModal(true);
    } else if (clubPrivacy === 'private' && joinQuestionsEnabled && questionLoadError) {
      // If there was an error loading questions, show error and don't proceed
      toast.error('Unable to load join questions. Please try again.');
      return;
    } else {
      // Direct join for public clubs or private clubs without questions
      handleJoinClub();
    }
  };

  const handleSubmitWithAnswers = async (answers: SubmitAnswersRequest) => {
    try {
      await submitJoinRequest(clubId, answers);
      setShowQuestionModal(false);
      // Refresh the page or update the UI to reflect the join request
      window.location.reload();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isPrivateWithQuestions = clubPrivacy === 'private' && joinQuestionsEnabled && questions.length > 0;
  const requiredQuestions = questions.filter(q => q.is_required).length;

  return (
    <>
      <Card className="p-6 text-center">
        <UserPlus className="h-12 w-12 mx-auto text-bookconnect-terracotta mb-4" />
        <h2 className="text-xl font-semibold mb-2">Join this Book Club</h2>
        <p className="text-gray-600 mb-4">
          {isPrivateWithQuestions
            ? 'Answer a few questions to request to join this private club.'
            : 'Join this book club to participate in discussions and connect with other readers.'
          }
        </p>

        {isPrivateWithQuestions && (
          <div className="flex justify-center space-x-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </Badge>
            {requiredQuestions > 0 && (
              <Badge variant="outline" className="text-xs">
                {requiredQuestions} required
              </Badge>
            )}
          </div>
        )}

        <Button
          onClick={handleJoinClick}
          disabled={actionInProgress || loadingQuestions}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
        >
          {actionInProgress || loadingQuestions ? 'Processing...' :
           clubPrivacy === 'public' ? 'Join Club' :
           isPrivateWithQuestions ? 'Answer Questions & Request to Join' : 'Request to Join'}
        </Button>
      </Card>

      {/* Question Modal */}
      <JoinRequestModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        clubId={clubId}
        clubName={clubName}
        questions={questions}
        onSubmit={handleSubmitWithAnswers}
        isLoading={submittingRequest}
      />
    </>
  );
};

export default JoinClubSection;
