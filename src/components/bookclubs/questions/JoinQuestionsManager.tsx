/**
 * Component for managing club join request questions
 * Allows club leads to create, edit, delete, and reorder questions
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClubQuestions,
  createClubQuestion,
  updateClubQuestion,
  deleteClubQuestion,
  reorderClubQuestions,
  toggleClubQuestions
} from '@/lib/api/bookclubs/questions';
import QuestionListItem from './QuestionListItem';
import AddQuestionForm from './AddQuestionForm';
import type {
  JoinQuestionsManagerProps,
  ClubJoinQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  NewQuestionData
} from './types';

export default function JoinQuestionsManager({
  clubId,
  questionsEnabled,
  onToggleQuestions,
  onQuestionsChange
}: JoinQuestionsManagerProps) {
  const [questions, setQuestions] = useState<ClubJoinQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ClubJoinQuestion | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>({
    question_text: '',
    is_required: false,
    display_order: 1
  });

  // Load questions when component mounts or clubId changes
  useEffect(() => {
    if (questionsEnabled && clubId) {
      loadQuestions();
    }
  }, [clubId, questionsEnabled]);

  const loadQuestions = async () => {
    if (!clubId) {
      console.error('Cannot load questions: clubId is undefined');
      return;
    }

    setLoading(true);
    try {
      const result = await getClubQuestions(clubId);
      if (result.success && result.questions) {
        setQuestions(result.questions);
      } else {
        console.error('Failed to load questions:', result.error);
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestions = async (enabled: boolean) => {
    try {
      const result = await toggleClubQuestions(clubId, enabled);
      if (result.success) {
        onToggleQuestions(enabled);
        if (enabled) {
          loadQuestions();
        } else {
          setQuestions([]);
        }
        toast.success(enabled ? 'Questions enabled' : 'Questions disabled');
      } else {
        toast.error('Failed to update questions setting');
      }
    } catch (error) {
      console.error('Error toggling questions:', error);
      toast.error('Failed to update questions setting');
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (questions.length >= 5) {
      toast.error('Maximum of 5 questions allowed per club');
      return;
    }

    setLoading(true);
    try {
      const questionData: CreateQuestionRequest = {
        question_text: newQuestion.question_text.trim(),
        is_required: newQuestion.is_required,
        display_order: questions.length + 1
      };

      const result = await createClubQuestion(clubId, questionData);
      if (result.success && result.question) {
        setQuestions([...questions, result.question]);
        setNewQuestion({ question_text: '', is_required: false, display_order: 1 });
        setIsAddingQuestion(false);
        onQuestionsChange();
        toast.success('Question added successfully');
      } else {
        toast.error(result.error || 'Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: UpdateQuestionRequest) => {
    setLoading(true);
    try {
      const result = await updateClubQuestion(questionId, updates);
      if (result.success && result.question) {
        setQuestions(questions.map(q => 
          q.id === questionId ? result.question! : q
        ));
        setEditingQuestion(null);
        onQuestionsChange();
        toast.success('Question updated successfully');
      } else {
        toast.error(result.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteClubQuestion(questionId);
      if (result.success) {
        setQuestions(questions.filter(q => q.id !== questionId));
        onQuestionsChange();
        toast.success('Question deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] =
    [newQuestions[newIndex], newQuestions[currentIndex]];

    // Update display orders
    const reorderData = newQuestions.map((q, index) => ({
      question_id: q.id,
      display_order: index + 1
    }));

    setQuestions(newQuestions);

    // Update in backend
    reorderClubQuestions(clubId, { question_orders: reorderData })
      .then(result => {
        if (result.success && result.questions) {
          setQuestions(result.questions);
          onQuestionsChange();
        }
      })
      .catch(error => {
        console.error('Error reordering questions:', error);
        toast.error('Failed to reorder questions');
        loadQuestions(); // Reload to get correct order
      });
  };

  const handleCancelAddQuestion = () => {
    setIsAddingQuestion(false);
    setNewQuestion({ question_text: '', is_required: false, display_order: 1 });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-bookconnect-brown">
            Join Request Questions
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {questionsEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              checked={questionsEnabled}
              onCheckedChange={handleToggleQuestions}
              disabled={loading}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Create custom questions for users requesting to join your private club.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!questionsEnabled ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <p>Enable questions to start creating custom join request questions.</p>
          </div>
        ) : (
          <>
            {/* Questions List */}
            {questions.length > 0 && (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <QuestionListItem
                    key={question.id}
                    question={question}
                    index={index}
                    isEditing={editingQuestion?.id === question.id}
                    onEdit={() => setEditingQuestion(question)}
                    onSave={(updates) => handleUpdateQuestion(question.id, updates)}
                    onCancel={() => setEditingQuestion(null)}
                    onDelete={() => handleDeleteQuestion(question.id)}
                    onMoveUp={() => moveQuestion(question.id, 'up')}
                    onMoveDown={() => moveQuestion(question.id, 'down')}
                    canMoveUp={index > 0}
                    canMoveDown={index < questions.length - 1}
                    loading={loading}
                  />
                ))}
              </div>
            )}

            {/* Add Question Form */}
            {isAddingQuestion ? (
              <AddQuestionForm
                question={newQuestion}
                onChange={setNewQuestion}
                onSave={handleAddQuestion}
                onCancel={handleCancelAddQuestion}
                loading={loading}
              />
            ) : (
              <Button
                onClick={() => setIsAddingQuestion(true)}
                disabled={questions.length >= 5 || loading}
                className="w-full bg-bookconnect-brown hover:bg-bookconnect-brown/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question {questions.length > 0 && `(${questions.length}/5)`}
              </Button>
            )}

            {questions.length >= 5 && (
              <p className="text-sm text-amber-600 text-center">
                Maximum of 5 questions reached
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
