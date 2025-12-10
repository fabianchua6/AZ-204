import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

interface UseQuizCardStateProps {
  questionId: string;
  // Add persistence of submission state
  initialSubmissionState?: {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
  };
}

// Use useLayoutEffect on client, useEffect on server (SSR safety)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useQuizCardState({
  questionId,
  initialSubmissionState,
}: UseQuizCardStateProps) {
  // Track the previous question ID to detect changes synchronously
  const prevQuestionIdRef = useRef(questionId);
  const isFirstRender = useRef(true);
  
  // Determine if this is a previously submitted question
  const wasSubmitted = initialSubmissionState?.isSubmitted ?? false;
  
  // Initialize state - for first render, use the initial submission state if available
  const [showAnswer, setShowAnswer] = useState(
    wasSubmitted ? (initialSubmissionState?.showAnswer ?? false) : false
  );
  const [answerSubmitted, setAnswerSubmitted] = useState(wasSubmitted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<
    boolean | null
  >(wasSubmitted ? (initialSubmissionState?.isCorrect ?? null) : null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CRITICAL: Synchronously reset state BEFORE paint when question changes
  // This prevents the momentary flash of the answer
  useIsomorphicLayoutEffect(() => {
    // Skip the first render - initial state is already correct
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only reset when question actually changes
    if (prevQuestionIdRef.current !== questionId) {
      prevQuestionIdRef.current = questionId;
      
      if (initialSubmissionState?.isSubmitted) {
        // Restore state for previously answered questions
        setShowAnswer(initialSubmissionState.showAnswer);
        setAnswerSubmitted(true);
        setLastSubmissionResult(initialSubmissionState.isCorrect);
      } else {
        // IMPORTANT: Reset to hidden state for new questions
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
    }
  }, [questionId, initialSubmissionState?.isSubmitted, initialSubmissionState?.showAnswer, initialSubmissionState?.isCorrect]);

  // Handle when submission state is cleared for the SAME question (e.g., new session)
  // This is separate from question changes to handle session resets
  useIsomorphicLayoutEffect(() => {
    // If the external state says "not submitted" but our internal state says "submitted",
    // we need to reset (this happens when starting a new session)
    if (!initialSubmissionState?.isSubmitted && answerSubmitted) {
      setShowAnswer(false);
      setAnswerSubmitted(false);
      setLastSubmissionResult(null);
      setIsSubmitting(false);
    }
  }, [initialSubmissionState?.isSubmitted, answerSubmitted]);

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
