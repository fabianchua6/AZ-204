import { useState, useEffect, useRef, useCallback } from 'react';

interface UseQuizCardStateProps {
  questionId: string;
  // Add persistence of submission state
  initialSubmissionState?: {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
  };
}

export function useQuizCardState({
  questionId,
  initialSubmissionState,
}: UseQuizCardStateProps) {
  const [showAnswer, setShowAnswer] = useState(
    initialSubmissionState?.showAnswer ?? false
  );
  const [answerSubmitted, setAnswerSubmitted] = useState(
    initialSubmissionState?.isSubmitted ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<
    boolean | null
  >(initialSubmissionState?.isCorrect ?? null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when question changes - but preserve initial state if provided
  useEffect(() => {
    if (initialSubmissionState) {
      // Restore from provided state
      setShowAnswer(initialSubmissionState.showAnswer);
      setAnswerSubmitted(initialSubmissionState.isSubmitted);
      setLastSubmissionResult(initialSubmissionState.isCorrect);
    } else {
      // Reset to default state
      setShowAnswer(false);
      setAnswerSubmitted(false);
      setLastSubmissionResult(null);
    }
    setIsSubmitting(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [questionId, initialSubmissionState]);

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

  const markAnswerSubmitted = useCallback(
    (shouldShowAnswer: boolean = true, isCorrect?: boolean) => {
      setAnswerSubmitted(true);
      setShowAnswer(shouldShowAnswer);
      if (isCorrect !== undefined) {
        setLastSubmissionResult(isCorrect);
      }
    },
    []
  );

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const finishSubmitting = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    showAnswer,
    answerSubmitted,
    isSubmitting,
    lastSubmissionResult,
    toggleShowAnswer,
    markAnswerSubmitted,
    startSubmitting,
    finishSubmitting,
  };
}
