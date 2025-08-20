import { useState, useEffect, useRef, useCallback } from 'react';

interface UseQuizCardStateProps {
  questionId: string;
  autoAdvanceOnCorrect?: boolean;
  autoAdvanceDelay?: number;
}

export function useQuizCardState({
  questionId,
  autoAdvanceOnCorrect = false,
  autoAdvanceDelay = 2500,
}: UseQuizCardStateProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setShowAnswer(false);
    setAnswerSubmitted(false);
    setIsSubmitting(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [questionId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleShowAnswer = useCallback(() => {
    setShowAnswer(prev => !prev);
  }, []);

  const markAnswerSubmitted = useCallback((shouldShowAnswer: boolean = true) => {
    setAnswerSubmitted(true);
    setShowAnswer(shouldShowAnswer);
  }, []);

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const finishSubmitting = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  const scheduleAutoAdvance = useCallback(
    (onAdvance: () => void) => {
      if (autoAdvanceOnCorrect) {
        timeoutRef.current = setTimeout(() => {
          onAdvance();
        }, autoAdvanceDelay);
      }
    },
    [autoAdvanceOnCorrect, autoAdvanceDelay]
  );

  const cancelAutoAdvance = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    showAnswer,
    answerSubmitted,
    isSubmitting,
    toggleShowAnswer,
    markAnswerSubmitted,
    startSubmitting,
    finishSubmitting,
    scheduleAutoAdvance,
    cancelAutoAdvance,
  };
}
