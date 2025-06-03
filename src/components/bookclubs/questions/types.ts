/**
 * Shared types for join request questions components
 */

import type { 
  ClubJoinQuestion, 
  CreateQuestionRequest,
  UpdateQuestionRequest 
} from '@/types/join-request-questions';

// Re-export main types for convenience
export type { ClubJoinQuestion, CreateQuestionRequest, UpdateQuestionRequest };

/**
 * Props for the main JoinQuestionsManager component
 */
export interface JoinQuestionsManagerProps {
  clubId: string;
  questionsEnabled: boolean;
  onToggleQuestions: (enabled: boolean) => void;
  onQuestionsChange: () => void;
}

/**
 * Props for individual question list item component
 */
export interface QuestionListItemProps {
  question: ClubJoinQuestion;
  index: number;
  isEditing: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: (updates: UpdateQuestionRequest) => void;
  onCancel: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * Data structure for new question being created
 */
export interface NewQuestionData {
  question_text: string;
  is_required: boolean;
  display_order: number;
}

/**
 * Props for add question form component
 */
export interface AddQuestionFormProps {
  question: NewQuestionData;
  loading: boolean;
  onChange: (question: NewQuestionData) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Common question management actions
 */
export interface QuestionActions {
  onEdit: (question: ClubJoinQuestion) => void;
  onSave: (questionId: string, updates: UpdateQuestionRequest) => void;
  onCancel: () => void;
  onDelete: (questionId: string) => void;
  onMove: (questionId: string, direction: 'up' | 'down') => void;
}

/**
 * Question management state
 */
export interface QuestionManagementState {
  questions: ClubJoinQuestion[];
  loading: boolean;
  editingQuestion: ClubJoinQuestion | null;
  isAddingQuestion: boolean;
  newQuestion: NewQuestionData;
}

/**
 * Props for embedded question manager (used in club creation)
 */
export interface EmbeddedQuestionManagerProps {
  questionsEnabled: boolean;
  onToggleQuestions: (enabled: boolean) => void;
  onQuestionsChange: (questions: NewQuestionData[]) => void;
  initialQuestions?: NewQuestionData[];
  loading?: boolean;
}

/**
 * Local question data for club creation (before club exists)
 */
export interface LocalQuestionData extends NewQuestionData {
  id: string; // Temporary local ID for management
}
