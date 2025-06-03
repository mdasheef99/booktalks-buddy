/**
 * Custom hook for managing join request questions
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getClubQuestionsForManagement,
  createClubQuestion,
  updateClubQuestion,
  deleteClubQuestion,
  reorderClubQuestions,
  toggleClubQuestions,
  getClubQuestionsStatus
} from '@/lib/api/bookclubs/questions';
import {
  submitJoinRequestWithAnswers,
  getClubJoinRequests,
  getJoinRequestAnswers
} from '@/lib/api/bookclubs/join-requests';
import type {
  ClubJoinQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReorderQuestionsRequest,
  SubmitAnswersRequest,
  UseJoinQuestionsReturn,
  UseJoinRequestReturn,
  UseAnswerReviewReturn
} from '@/types/join-request-questions';

/**
 * Hook for managing club join request questions (for club leads)
 */
export function useJoinRequestQuestions(clubId: string): UseJoinQuestionsReturn {
  const [questions, setQuestions] = useState<ClubJoinQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshQuestions = useCallback(async () => {
    if (!clubId || clubId === 'undefined' || clubId === 'null') {
      console.error('Cannot refresh questions: invalid clubId:', clubId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getClubQuestionsForManagement(clubId);
      if (result.success && result.questions) {
        setQuestions(result.questions);
      } else {
        setError(result.error || 'Failed to load questions');
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  const createQuestion = useCallback(async (data: CreateQuestionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createClubQuestion(clubId, data);
      if (result.success && result.question) {
        setQuestions(prev => [...prev, result.question!]);
        toast.success('Question created successfully');
      } else {
        const errorMsg = result.error || 'Failed to create question';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error creating question:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  const updateQuestion = useCallback(async (id: string, data: UpdateQuestionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateClubQuestion(id, data);
      if (result.success && result.question) {
        setQuestions(prev => prev.map(q => 
          q.id === id ? result.question! : q
        ));
        toast.success('Question updated successfully');
      } else {
        const errorMsg = result.error || 'Failed to update question';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error updating question:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuestion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteClubQuestion(id);
      if (result.success) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        toast.success('Question deleted successfully');
      } else {
        const errorMsg = result.error || 'Failed to delete question';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderQuestions = useCallback(async (orders: ReorderQuestionsRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reorderClubQuestions(clubId, orders);
      if (result.success && result.questions) {
        setQuestions(result.questions);
        toast.success('Questions reordered successfully');
      } else {
        const errorMsg = result.error || 'Failed to reorder questions';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error reordering questions:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Load questions on mount
  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  return {
    questions,
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    refreshQuestions
  };
}

/**
 * Hook for submitting join requests with answers (for users)
 */
export function useJoinRequest(): UseJoinRequestReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitJoinRequest = useCallback(async (clubId: string, answers?: SubmitAnswersRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await submitJoinRequestWithAnswers(clubId, answers);
      if (result.success) {
        toast.success(result.message);
      } else {
        const errorMsg = result.error || 'Failed to submit join request';
        setError(errorMsg);
        toast.error(result.message || errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error submitting join request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitJoinRequest,
    loading,
    error
  };
}

/**
 * Hook for reviewing join request answers (for club leads)
 */
export function useAnswerReview(): UseAnswerReviewReturn {
  const [answers, setAnswers] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = useCallback(async (clubId: string, userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getJoinRequestAnswers(clubId, userId);
      if (result.success) {
        setAnswers(result.answers || []);
        setUserInfo(result.user_info || null);
      } else {
        const errorMsg = result.error || 'Failed to fetch answers';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching answers:', err);
      setError('Failed to fetch answers');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    answers,
    userInfo,
    loading,
    error,
    fetchAnswers
  };
}

/**
 * Hook for managing club questions settings
 */
export function useClubQuestionsSettings(clubId: string) {
  const [questionsEnabled, setQuestionsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestionsStatus = useCallback(async () => {
    if (!clubId || clubId === 'undefined' || clubId === 'null') {
      console.error('Cannot load questions status: invalid clubId:', clubId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getClubQuestionsStatus(clubId);
      if (result.success) {
        setQuestionsEnabled(result.enabled || false);
      } else {
        setError(result.error || 'Failed to load questions status');
      }
    } catch (err) {
      console.error('Error loading questions status:', err);
      setError('Failed to load questions status');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  const toggleQuestions = useCallback(async (enabled: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await toggleClubQuestions(clubId, enabled);
      if (result.success) {
        setQuestionsEnabled(enabled);
        toast.success(enabled ? 'Questions enabled' : 'Questions disabled');
      } else {
        const errorMsg = result.error || 'Failed to update questions setting';
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error toggling questions:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Load status on mount
  useEffect(() => {
    loadQuestionsStatus();
  }, [loadQuestionsStatus]);

  return {
    questionsEnabled,
    loading,
    error,
    toggleQuestions,
    refreshStatus: loadQuestionsStatus
  };
}

/**
 * Hook for managing club join requests (for club leads)
 */
export function useClubJoinRequests(clubId: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!clubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getClubJoinRequests(clubId);
      if (result.success && result.requests) {
        setRequests(result.requests);
      } else {
        setError(result.error || 'Failed to load join requests');
      }
    } catch (err) {
      console.error('Error loading join requests:', err);
      setError('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    refreshRequests: loadRequests
  };
}
