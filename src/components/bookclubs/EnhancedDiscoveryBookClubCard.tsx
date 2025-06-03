import React, { useState, useEffect, useRef, memo } from 'react';
import { Users, ChevronDown, ChevronUp, MessageSquare, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookClub } from './hooks/useClubDiscovery';
import JoinRequestModal from './questions/JoinRequestModal';
import { getClubQuestions } from '@/lib/api/bookclubs/questions';
import { useJoinRequest } from '@/hooks/useJoinRequestQuestions';
import ClubPhotoDisplay from './photos/ClubPhotoDisplay';
import ClubMemberCount from './ClubMemberCount';
import type { ClubJoinQuestion, SubmitAnswersRequest } from '@/types/join-request-questions';

interface EnhancedDiscoveryBookClubCardProps {
  club: BookClub;
  renderActionButton: (club: BookClub) => React.ReactNode;
  onViewClub: (clubId: string) => void;
  actionInProgress: string | null;
  onJoinClub: (clubId: string) => void;
  onCancelRequest: (clubId: string) => void;
}

const EnhancedDiscoveryBookClubCard: React.FC<EnhancedDiscoveryBookClubCardProps> = ({
  club,
  renderActionButton,
  onViewClub,
  actionInProgress,
  onJoinClub,
  onCancelRequest
}) => {
  const [expanded, setExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  
  // Questions state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState<ClubJoinQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<SubmitAnswersRequest | null>(null);
  const [modalMode, setModalMode] = useState<'preview' | 'submit'>('preview');
  
  const { submitJoinRequest, loading: submittingRequest } = useJoinRequest();

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('EnhancedDiscoveryBookClubCard rendered for club:', {
      id: club.id,
      name: club.name,
      privacy: club.privacy,
      join_questions_enabled: club.join_questions_enabled,
      user_status: club.user_status
    });
  }

  useEffect(() => {
    // Check if the description is overflowing
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [club.description]);

  // Load questions for private clubs with questions enabled
  useEffect(() => {
    console.log(`🔍 useEffect triggered for ${club.name}:`, {
      privacy: club.privacy,
      join_questions_enabled: club.join_questions_enabled,
      shouldLoadQuestions: club.privacy === 'private' && club.join_questions_enabled
    });

    if (club.privacy === 'private' && club.join_questions_enabled) {
      loadQuestions();
    } else {
      // Clear questions if not applicable
      setQuestions([]);
      console.log(`❌ Not loading questions for ${club.name} - Privacy: ${club.privacy}, Questions enabled: ${club.join_questions_enabled}`);
    }
  }, [club.id, club.privacy, club.join_questions_enabled]);

  const loadQuestions = async () => {
    if (!club.id) return;

    setLoadingQuestions(true);
    try {
      console.log(`🔄 Loading questions for club: ${club.name} (${club.id}) - Questions enabled: ${club.join_questions_enabled}`);

      // Try API first
      const result = await getClubQuestions(club.id);
      console.log(`📊 API Response for ${club.name}:`, result);

      if (result.success && result.questions) {
        console.log(`✅ Questions loaded for ${club.name}:`, result.questions);
        console.log(`📝 Question count: ${result.questions.length}`);
        setQuestions(result.questions);
      } else {
        console.log(`❌ API failed for ${club.name}, trying direct database access:`, result.error || 'Unknown error');

        // Fallback: Direct database access
        const { supabase } = await import('@/lib/supabase');
        const { data: directQuestions, error: directError } = await supabase
          .from('club_join_questions')
          .select('*')
          .eq('club_id', club.id)
          .order('display_order', { ascending: true });

        if (directError) {
          console.error(`💥 Direct database access also failed for ${club.name}:`, directError);
          setQuestions([]);
        } else {
          console.log(`✅ Direct database access succeeded for ${club.name}:`, directQuestions?.length || 0, 'questions');
          setQuestions(directQuestions || []);
        }
      }
    } catch (error) {
      console.error(`💥 Error loading questions for ${club.name}:`, error);
      setQuestions([]); // Explicitly set empty array on error
    } finally {
      setLoadingQuestions(false);
      console.log(`🏁 Finished loading questions for ${club.name}`);
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleViewQuestions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode('preview');
    setShowQuestionModal(true);
  };

  const handleJoinWithQuestions = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedAnswers) {
      // User has already answered questions, submit directly
      handleSubmitWithAnswers(savedAnswers);
    } else {
      // Show modal in submit mode
      setModalMode('submit');
      setShowQuestionModal(true);
    }
  };

  const handleAnswersCompleted = (answers: SubmitAnswersRequest) => {
    setSavedAnswers(answers);
  };

  // Check if all required questions are answered
  const areRequiredQuestionsAnswered = () => {
    if (!savedAnswers || questions.length === 0) return false;

    const requiredQuestions = questions.filter(q => q.is_required);
    const answeredQuestionIds = savedAnswers.answers.map(a => a.question_id);

    return requiredQuestions.every(q => answeredQuestionIds.includes(q.id));
  };

  const handleSubmitWithAnswers = async (answers: SubmitAnswersRequest) => {
    try {
      await submitJoinRequest(club.id, answers);
      setShowQuestionModal(false);
      // Update club status in parent component
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error submitting join request:', error);
    }
  };

  const isLoading = actionInProgress === club.id;
  const isPrivateWithQuestions = club.privacy === 'private' && club.join_questions_enabled && questions.length > 0;
  const hasAnsweredQuestions = savedAnswers !== null;
  const canSubmitJoinRequest = isPrivateWithQuestions ? areRequiredQuestionsAnswered() : true;

  // Custom action buttons for private clubs with questions
  const renderCustomActionButton = () => {
    // Debug logging
    console.log(`🎯 Rendering action button for ${club.name}:`, {
      privacy: club.privacy,
      join_questions_enabled: club.join_questions_enabled,
      questionsLength: questions.length,
      user_status: club.user_status,
      isPrivateWithQuestions,
      loadingQuestions,
      shouldShowEnhancedButtons: club.privacy === 'private' && club.join_questions_enabled,
      hasQuestionsLoaded: questions.length > 0
    });

    // For members/admins, show view club button
    if (club.user_status === 'member' || club.user_status === 'admin') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewClub(club.id);
          }}
          variant="outline"
        >
          View Club
        </Button>
      );
    }

    // For pending requests, show cancel button
    if (club.user_status === 'pending') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCancelRequest(club.id);
          }}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? 'Cancelling...' : 'Cancel Request'}
        </Button>
      );
    }

    // For private clubs with questions enabled, show enhanced buttons
    if (club.privacy === 'private' && club.join_questions_enabled) {
      console.log(`🔍 Private club with questions enabled: ${club.name}`);

      // If we have questions loaded, show the enhanced dual-button layout
      if (questions.length > 0) {
        console.log(`✅ Showing enhanced buttons for ${club.name} - ${questions.length} questions loaded`);
        const requiredQuestions = questions.filter(q => q.is_required);
        const buttonTitle = !canSubmitJoinRequest
          ? `Please answer all ${requiredQuestions.length} required question(s) first`
          : 'Submit your join request';

        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleViewQuestions}
              disabled={isLoading || loadingQuestions}
              variant="outline"
              className="bg-bookconnect-brown text-white hover:bg-bookconnect-brown/90 border-bookconnect-brown"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Questions
            </Button>
            <Button
              onClick={handleJoinWithQuestions}
              disabled={isLoading || loadingQuestions || !canSubmitJoinRequest}
              title={buttonTitle}
              className={`${
                canSubmitJoinRequest
                  ? 'bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Processing...' : 'Request to Join'}
            </Button>
          </div>
        );
      }

      // If no questions loaded yet, show loading state or fallback
      if (loadingQuestions) {
        console.log(`⏳ Showing loading state for ${club.name}`);
        return (
          <Button disabled variant="outline">
            Loading Questions...
          </Button>
        );
      }

      console.log(`❌ No questions loaded for ${club.name}, falling back to default button`);
    }

    // Default action button for other cases (public clubs, private clubs without questions)
    console.log(`🔄 Using default action button for ${club.name}`);
    return renderActionButton(club);
  };

  return (
    <>
      <Card
        className="p-6 hover:bg-gray-50 transition-colors"
        onClick={() => onViewClub(club.id)}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

          {/* Photo Section */}
          <div className="flex-shrink-0">
            <ClubPhotoDisplay
              photoUrl={club.cover_photo_url}
              thumbnailUrl={club.cover_photo_thumbnail_url}
              clubName={club.name}
              size="medium"
              aspectRatio="3:2"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold">{club.name}</h3>
              <ClubMemberCount
                clubId={club.id}
                initialCount={club.member_count || 0}
                size="small"
                realTimeUpdates={true}
              />
            </div>

            <div className={`relative ${expanded ? '' : 'h-20 overflow-hidden'}`}>
              <p
                ref={descriptionRef}
                className={`text-gray-600 mt-1 ${expanded ? '' : 'max-h-20'}`}
              >
                {club.description || 'No description available'}
              </p>
              {!expanded && isOverflowing && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
              )}
            </div>

            {isOverflowing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 p-0 h-auto font-medium mt-1"
                onClick={toggleExpanded}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Read More
                  </>
                )}
              </Button>
            )}

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                club.privacy === 'private'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {club.privacy || 'public'}
              </span>
              
              {/* Questions indicator */}
              {isPrivateWithQuestions && (
                <Badge variant="secondary" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </Badge>
              )}
              

            </div>
          </div>

          <div className="flex-shrink-0">
            {renderCustomActionButton()}
          </div>
        </div>
      </Card>

      {/* Question Modal */}
      <JoinRequestModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        clubId={club.id}
        clubName={club.name}
        questions={questions}
        onSubmit={handleSubmitWithAnswers}
        isLoading={submittingRequest}
        mode={modalMode}
        onAnswersCompleted={handleAnswersCompleted}
      />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(EnhancedDiscoveryBookClubCard);
