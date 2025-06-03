/**
 * Hook for managing answered questions state across the discovery page
 * Tracks which clubs have had their questions answered by the user
 */

import { useState, useCallback } from 'react';
import type { SubmitAnswersRequest } from '@/types/join-request-questions';

interface AnsweredQuestionsState {
  [clubId: string]: SubmitAnswersRequest;
}

export function useAnsweredQuestions() {
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestionsState>({});

  /**
   * Save answers for a specific club
   */
  const saveAnswers = useCallback((clubId: string, answers: SubmitAnswersRequest) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [clubId]: answers
    }));
  }, []);

  /**
   * Get saved answers for a specific club
   */
  const getAnswers = useCallback((clubId: string): SubmitAnswersRequest | null => {
    return answeredQuestions[clubId] || null;
  }, [answeredQuestions]);

  /**
   * Check if a club has answered questions
   */
  const hasAnsweredQuestions = useCallback((clubId: string): boolean => {
    return clubId in answeredQuestions;
  }, [answeredQuestions]);

  /**
   * Clear answers for a specific club
   */
  const clearAnswers = useCallback((clubId: string) => {
    setAnsweredQuestions(prev => {
      const newState = { ...prev };
      delete newState[clubId];
      return newState;
    });
  }, []);

  /**
   * Clear all answered questions
   */
  const clearAllAnswers = useCallback(() => {
    setAnsweredQuestions({});
  }, []);

  /**
   * Get count of clubs with answered questions
   */
  const getAnsweredCount = useCallback((): number => {
    return Object.keys(answeredQuestions).length;
  }, [answeredQuestions]);

  return {
    saveAnswers,
    getAnswers,
    hasAnsweredQuestions,
    clearAnswers,
    clearAllAnswers,
    getAnsweredCount,
    answeredQuestions
  };
}
