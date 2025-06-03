/**
 * TypeScript interfaces for Join Request Questions feature
 */

// =========================
// Core Question Types
// =========================

export interface ClubJoinQuestion {
  id: string;
  club_id: string;
  question_text: string;
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionRequest {
  question_text: string;
  is_required: boolean;
  display_order: number;
}

export interface UpdateQuestionRequest {
  question_text?: string;
  is_required?: boolean;
  display_order?: number;
}

export interface ReorderQuestionsRequest {
  question_orders: Array<{
    question_id: string;
    display_order: number;
  }>;
}

// =========================
// Answer Types
// =========================

export interface JoinRequestAnswer {
  question_id: string;
  question_text: string;
  answer: string;
  is_required: boolean;
}

export interface SubmitAnswersRequest {
  answers: Array<{
    question_id: string;
    answer: string;
  }>;
}

export interface JoinAnswersData {
  answers: JoinRequestAnswer[];
  submitted_at: string;
}

// =========================
// API Response Types
// =========================

export interface QuestionResponse {
  success: boolean;
  question?: ClubJoinQuestion;
  error?: string;
}

export interface QuestionsListResponse {
  success: boolean;
  questions?: ClubJoinQuestion[];
  error?: string;
}

export interface JoinRequestResponse {
  success: boolean;
  message: string;
  requires_approval?: boolean;
  join_request_id?: string;
  error?: string;
}

export interface AnswersResponse {
  success: boolean;
  answers?: JoinRequestAnswer[];
  user_info?: {
    user_id: string;
    username: string;
    display_name: string;
  };
  submitted_at?: string;
  error?: string;
}

// =========================
// Component Props Types
// =========================

export interface JoinQuestionsManagerProps {
  clubId: string;
  questionsEnabled: boolean;
  onToggleQuestions: (enabled: boolean) => void;
  onQuestionsChange: () => void;
}

export interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  questions: ClubJoinQuestion[];
  onSubmit: (answers: SubmitAnswersRequest) => Promise<void>;
  isLoading?: boolean;
  mode?: 'preview' | 'submit'; // New prop for preview mode
  onAnswersCompleted?: (answers: SubmitAnswersRequest) => void; // Callback for preview mode
}

export interface JoinRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinRequest: {
    user_id: string;
    username: string;
    display_name: string;
    requested_at: string;
    answers: JoinRequestAnswer[];
  };
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  isLoading?: boolean;
}

export interface QuestionFormProps {
  question?: ClubJoinQuestion;
  onSave: (data: CreateQuestionRequest | UpdateQuestionRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  maxOrder: number;
}

// =========================
// Validation Types
// =========================

export interface QuestionValidation {
  isValid: boolean;
  errors: {
    question_text?: string;
    display_order?: string;
    general?: string;
  };
}

export interface AnswerValidation {
  isValid: boolean;
  errors: {
    [questionId: string]: string;
  };
  missingRequired: string[];
}

// =========================
// Hook Types
// =========================

export interface UseJoinQuestionsReturn {
  questions: ClubJoinQuestion[];
  loading: boolean;
  error: string | null;
  createQuestion: (data: CreateQuestionRequest) => Promise<void>;
  updateQuestion: (id: string, data: UpdateQuestionRequest) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  reorderQuestions: (orders: ReorderQuestionsRequest) => Promise<void>;
  refreshQuestions: () => Promise<void>;
}

export interface UseJoinRequestReturn {
  submitJoinRequest: (clubId: string, answers?: SubmitAnswersRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseAnswerReviewReturn {
  answers: JoinRequestAnswer[];
  userInfo: {
    user_id: string;
    username: string;
    display_name: string;
  } | null;
  loading: boolean;
  error: string | null;
  fetchAnswers: (clubId: string, userId: string) => Promise<void>;
}

// =========================
// Utility Types
// =========================

export type QuestionSortDirection = 'asc' | 'desc';

export interface QuestionFilters {
  required_only?: boolean;
  search_text?: string;
}

export interface QuestionStats {
  total_questions: number;
  required_questions: number;
  optional_questions: number;
}

// =========================
// Error Types
// =========================

export interface JoinRequestError {
  code: string;
  message: string;
  details?: any;
}

export const JOIN_REQUEST_ERROR_CODES = {
  QUESTION_LIMIT_EXCEEDED: 'QUESTION_LIMIT_EXCEEDED',
  INVALID_QUESTION_TEXT: 'INVALID_QUESTION_TEXT',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CLUB_NOT_FOUND: 'CLUB_NOT_FOUND',
  REQUIRED_ANSWER_MISSING: 'REQUIRED_ANSWER_MISSING',
  INVALID_ANSWER_LENGTH: 'INVALID_ANSWER_LENGTH',
  QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export type JoinRequestErrorCode = typeof JOIN_REQUEST_ERROR_CODES[keyof typeof JOIN_REQUEST_ERROR_CODES];

// =========================
// Constants
// =========================

export const QUESTION_CONSTRAINTS = {
  MAX_QUESTIONS_PER_CLUB: 5,
  MAX_QUESTION_LENGTH: 200,
  MAX_ANSWER_LENGTH: 500,
  MIN_QUESTION_LENGTH: 1,
  MIN_DISPLAY_ORDER: 1,
  MAX_DISPLAY_ORDER: 5
} as const;

export const QUESTION_DEFAULTS = {
  IS_REQUIRED: false,
  DISPLAY_ORDER: 1
} as const;

// =========================
// Form State Types
// =========================

export interface QuestionFormState {
  question_text: string;
  is_required: boolean;
  display_order: number;
}

export interface AnswerFormState {
  [questionId: string]: string;
}

export interface QuestionsManagerState {
  questions: ClubJoinQuestion[];
  editingQuestion: ClubJoinQuestion | null;
  isAddingQuestion: boolean;
  draggedQuestion: ClubJoinQuestion | null;
  loading: boolean;
  error: string | null;
}

// =========================
// Database Types (Raw)
// =========================

export interface ClubJoinQuestionRow {
  id: string;
  club_id: string;
  question_text: string;
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClubMemberWithAnswers {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  join_answers: JoinAnswersData | null;
}

export interface BookClubWithQuestions {
  id: string;
  name: string;
  description: string;
  privacy: string;
  join_questions_enabled: boolean;
  lead_user_id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}
