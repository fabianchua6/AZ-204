'use client';

import { useState, useEffect, useCallback } from 'react';
import { leitnerSystem } from '@/lib/leitner';
import type { Question } from '@/types/quiz';

/**
 * Simplified hook for Leitner system state management
 * Separates concerns and makes the code more maintainable
 */
export function useLeitnerState(questions: Question[]) {
  const [initialized, setInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize the Leitner system
  useEffect(() => {
    const init = async () => {
      await leitnerSystem.ensureInitialized();
      setInitialized(true);
    };
    init();
  }, []);

  // Get current stats
  const getStats = useCallback(() => {
    if (!initialized) return null;
    return leitnerSystem.getStats(questions);
  }, [initialized, questions, refreshTrigger]);

  // Get completion progress
  const getProgress = useCallback(() => {
    if (!initialized) return null;
    return leitnerSystem.getCompletionProgress(questions);
  }, [initialized, questions, refreshTrigger]);

  // Process an answer and refresh state
  const processAnswer = useCallback(async (questionId: string, isCorrect: boolean) => {
    if (!initialized) return null;
    
    const result = leitnerSystem.processAnswer(questionId, isCorrect);
    
    // Trigger refresh for dependent components
    setRefreshTrigger(prev => prev + 1);
    
    return result;
  }, [initialized]);

  // Get question progress
  const getQuestionProgress = useCallback((questionId: string) => {
    if (!initialized) return null;
    return leitnerSystem.getQuestionProgress(questionId);
  }, [initialized, refreshTrigger]);

  return {
    initialized,
    stats: getStats(),
    progress: getProgress(),
    processAnswer,
    getQuestionProgress,
    refreshTrigger, // For debugging
  };
}
