/**
 * Embedded Question Manager for Club Creation
 * Allows managing questions during club creation before the club exists
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertCircle, Edit2, Trash2, Star, Save, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { 
  EmbeddedQuestionManagerProps, 
  LocalQuestionData, 
  NewQuestionData 
} from './types';

export default function EmbeddedQuestionManager({
  questionsEnabled,
  onToggleQuestions,
  onQuestionsChange,
  initialQuestions = [],
  loading = false
}: EmbeddedQuestionManagerProps) {
  const [questions, setQuestions] = useState<LocalQuestionData[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<LocalQuestionData | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>({
    question_text: '',
    is_required: false,
    display_order: 1
  });

  // Initialize questions from props
  useEffect(() => {
    const localQuestions = initialQuestions.map((q, index) => ({
      ...q,
      id: `temp-${index}`,
      display_order: index + 1
    }));
    setQuestions(localQuestions);
  }, [initialQuestions]);

  // Notify parent of changes
  useEffect(() => {
    const questionData = questions.map(q => ({
      question_text: q.question_text,
      is_required: q.is_required,
      display_order: q.display_order
    }));
    onQuestionsChange(questionData);
  }, [questions, onQuestionsChange]);

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleToggleQuestions = (enabled: boolean) => {
    onToggleQuestions(enabled);
    if (!enabled) {
      setQuestions([]);
      setEditingQuestion(null);
      setIsAddingQuestion(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (questions.length >= 5) {
      toast.error('Maximum of 5 questions allowed per club');
      return;
    }

    const localQuestion: LocalQuestionData = {
      ...newQuestion,
      id: generateTempId(),
      question_text: newQuestion.question_text.trim(),
      display_order: questions.length + 1
    };

    setQuestions([...questions, localQuestion]);
    setNewQuestion({ question_text: '', is_required: false, display_order: 1 });
    setIsAddingQuestion(false);
    toast.success('Question added');
  };

  const handleUpdateQuestion = (questionId: string, updates: Partial<NewQuestionData>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    setEditingQuestion(null);
    toast.success('Question updated');
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    const updatedQuestions = questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, display_order: index + 1 }));
    
    setQuestions(updatedQuestions);
    toast.success('Question deleted');
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
    const reorderedQuestions = newQuestions.map((q, index) => ({
      ...q,
      display_order: index + 1
    }));

    setQuestions(reorderedQuestions);
  };

  const handleCancelAddQuestion = () => {
    setIsAddingQuestion(false);
    setNewQuestion({ question_text: '', is_required: false, display_order: 1 });
  };

  return (
    <Card className="border-bookconnect-terracotta/20">
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
          {questionsEnabled
            ? 'Create custom questions for users requesting to join your private club.'
            : 'Enable this option to create custom questions for join requests. This helps you learn more about potential members.'
          }
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
                  <LocalQuestionListItem
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
              <LocalAddQuestionForm
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

// Local Question List Item Component
interface LocalQuestionListItemProps {
  question: LocalQuestionData;
  index: number;
  isEditing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<NewQuestionData>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function LocalQuestionListItem({
  question,
  index,
  isEditing,
  canMoveUp,
  canMoveDown,
  loading,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMoveUp,
  onMoveDown
}: LocalQuestionListItemProps) {
  const [editText, setEditText] = useState(question.question_text);
  const [editRequired, setEditRequired] = useState(question.is_required);

  const handleSave = () => {
    if (!editText.trim()) {
      toast.error('Question text is required');
      return;
    }

    onSave({
      question_text: editText.trim(),
      is_required: editRequired
    });
  };

  const handleCancel = () => {
    setEditText(question.question_text);
    setEditRequired(question.is_required);
    onCancel();
  };

  // Editing mode rendering
  if (isEditing) {
    return (
      <Card className="border-bookconnect-terracotta">
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter question text..."
            maxLength={200}
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={editRequired}
                onCheckedChange={setEditRequired}
              />
              <span className="text-sm">Required question</span>
            </div>
            <div className="text-xs text-gray-500">
              {editText.length}/200 characters
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              size="sm"
              className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode rendering
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Reorder buttons */}
          <div className="flex flex-col space-y-1">
            <Button
              onClick={onMoveUp}
              disabled={!canMoveUp || loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Move up"
            >
              ↑
            </Button>
            <Button
              onClick={onMoveDown}
              disabled={!canMoveDown || loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Move down"
            >
              ↓
            </Button>
          </div>
          
          {/* Question content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
                {question.is_required && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex space-x-1">
                <Button
                  onClick={onEdit}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Edit question"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onDelete}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Question text */}
            <p className="text-sm text-gray-700">{question.question_text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Local Add Question Form Component
interface LocalAddQuestionFormProps {
  question: NewQuestionData;
  loading: boolean;
  onChange: (question: NewQuestionData) => void;
  onSave: () => void;
  onCancel: () => void;
}

function LocalAddQuestionForm({
  question,
  loading,
  onChange,
  onSave,
  onCancel
}: LocalAddQuestionFormProps) {

  const handleTextChange = (text: string) => {
    onChange({
      ...question,
      question_text: text
    });
  };

  const handleRequiredChange = (required: boolean) => {
    onChange({
      ...question,
      is_required: required
    });
  };

  const isValid = question.question_text.trim().length > 0;
  const characterCount = question.question_text.length;
  const isNearLimit = characterCount > 160;
  const isOverLimit = characterCount > 200;

  return (
    <Card className="border-bookconnect-terracotta">
      <CardContent className="p-4 space-y-3">
        <Textarea
          value={question.question_text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter question text..."
          maxLength={200}
          className="min-h-[80px]"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={question.is_required}
              onCheckedChange={handleRequiredChange}
            />
            <span className="text-sm">Required question</span>
          </div>
          <div className={`text-xs ${
            isOverLimit ? 'text-red-500' :
            isNearLimit ? 'text-amber-500' :
            'text-gray-500'
          }`}>
            {characterCount}/200 characters
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-600">
          <p>
            {question.is_required
              ? 'Users must answer this question to join the club.'
              : 'This question is optional for users.'
            }
          </p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={onSave}
            disabled={loading || !isValid || isOverLimit}
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
            variant="outline"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
