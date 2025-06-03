/**
 * Modal component for users to answer club join request questions
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { 
  JoinRequestModalProps,
  ClubJoinQuestion,
  SubmitAnswersRequest 
} from '@/types/join-request-questions';

export default function JoinRequestModal({
  isOpen,
  onClose,
  clubId,
  clubName,
  questions,
  onSubmit,
  isLoading = false,
  mode = 'submit',
  onAnswersCompleted
}: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{ [questionId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAnswers({});
      setValidationErrors({});
    }
  }, [isOpen]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Clear validation error when user starts typing
    if (validationErrors[questionId]) {
      setValidationErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateAnswers = (): boolean => {
    const errors: { [questionId: string]: string } = {};
    let isValid = true;

    questions.forEach(question => {
      const answer = answers[question.id] || '';
      
      // Check required questions
      if (question.is_required && !answer.trim()) {
        errors[question.id] = 'This question is required';
        isValid = false;
      }
      
      // Check answer length
      if (answer.length > 500) {
        errors[question.id] = 'Answer must be 500 characters or less';
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    try {
      const answersData: SubmitAnswersRequest = {
        answers: questions
          .filter(q => answers[q.id]?.trim()) // Only include answered questions
          .map(q => ({
            question_id: q.id,
            answer: answers[q.id].trim()
          }))
      };

      if (mode === 'preview' && onAnswersCompleted) {
        // In preview mode, just notify parent that answers are completed
        onAnswersCompleted(answersData);

        // Check if all required questions are answered for better UX feedback
        const requiredQuestions = questions.filter(q => q.is_required);
        const answeredRequiredCount = requiredQuestions.filter(q => answers[q.id]?.trim()).length;

        if (answeredRequiredCount === requiredQuestions.length) {
          toast.success('All required questions answered! You can now submit your join request.');
        } else {
          toast.success(`Answers saved! Please answer ${requiredQuestions.length - answeredRequiredCount} more required question(s) to enable join request.`);
        }
        onClose();
      } else {
        // In submit mode, actually submit the join request
        await onSubmit(answersData);
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast.error(mode === 'preview' ? 'Failed to save answers' : 'Failed to submit join request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiredQuestions = questions.filter(q => q.is_required);
  const optionalQuestions = questions.filter(q => !q.is_required);
  const answeredRequired = requiredQuestions.filter(q => answers[q.id]?.trim()).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-bookconnect-brown">
            {mode === 'preview' ? `Preview Questions - ${clubName}` : `Join ${clubName}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'preview'
              ? 'Preview the questions you\'ll need to answer to join this club. You can answer them now or later.'
              : 'Please answer the following questions to request to join this club.'
            }
            {' '}Questions marked with a star (*) are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator for required questions */}
          {requiredQuestions.length > 0 && (
            <div className="bg-bookconnect-cream/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-bookconnect-brown">
                  Required Questions Progress
                </span>
                <Badge variant={answeredRequired === requiredQuestions.length ? "default" : "secondary"}>
                  {answeredRequired}/{requiredQuestions.length}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-bookconnect-brown h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${requiredQuestions.length > 0 ? (answeredRequired / requiredQuestions.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Required Questions */}
          {requiredQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-bookconnect-brown flex items-center">
                <Star className="h-5 w-5 mr-2 text-amber-500" />
                Required Questions
              </h3>
              {requiredQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index + 1}
                  answer={answers[question.id] || ''}
                  error={validationErrors[question.id]}
                  onChange={(answer) => handleAnswerChange(question.id, answer)}
                />
              ))}
            </div>
          )}

          {/* Optional Questions */}
          {optionalQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-bookconnect-brown">
                Optional Questions
              </h3>
              <p className="text-sm text-gray-600">
                These questions are optional but help the club lead get to know you better.
              </p>
              {optionalQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={requiredQuestions.length + index + 1}
                  answer={answers[question.id] || ''}
                  error={validationErrors[question.id]}
                  onChange={(answer) => handleAnswerChange(question.id, answer)}
                />
              ))}
            </div>
          )}

          {/* No questions case */}
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p>No questions have been set up for this club.</p>
              <p className="text-sm">You can submit your join request directly.</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'preview' ? 'Saving...' : 'Submitting...'}
              </>
            ) : (
              mode === 'preview' ? 'Save Answers' : 'Submit Join Request'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Question Card Component
interface QuestionCardProps {
  question: ClubJoinQuestion;
  index: number;
  answer: string;
  error?: string;
  onChange: (answer: string) => void;
}

function QuestionCard({ question, index, answer, error, onChange }: QuestionCardProps) {
  const characterCount = answer.length;
  const isNearLimit = characterCount > 400;
  const isOverLimit = characterCount > 500;

  return (
    <Card className={`${error ? 'border-red-300' : 'border-gray-200'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">
              Question {index}
            </span>
            {question.is_required && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1 text-amber-500" />
                Required
              </Badge>
            )}
          </div>
          <div className={`text-xs ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-500'}`}>
            {characterCount}/500
          </div>
        </div>

        <p className="text-sm font-medium text-gray-900">
          {question.question_text}
          {question.is_required && <span className="text-red-500 ml-1">*</span>}
        </p>

        <Textarea
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.is_required ? "Your answer is required..." : "Your answer (optional)..."}
          className={`min-h-[100px] ${error ? 'border-red-300 focus:border-red-500' : ''}`}
          maxLength={500}
        />

        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!error && question.is_required && !answer.trim() && (
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">This question requires an answer</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
