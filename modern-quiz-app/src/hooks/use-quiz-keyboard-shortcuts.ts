import { useEffect, useCallback } from 'react';

interface UseQuizKeyboardShortcutsProps {
  /** Total number of options for the current question */
  optionCount: number;
  /** Whether the answer has been submitted (locks option selection) */
  answerSubmitted: boolean;
  /** Whether the answer/explanation is currently visible */
  showAnswer: boolean;
  /** Whether there is a next question available */
  canGoNext: boolean;
  /** Whether there is a previous question available */
  canGoPrevious: boolean;
  /** Whether the submit button is disabled (no selection or submitting) */
  submitDisabled: boolean;
  /** Whether this is the last question in an active session */
  isSessionEnd: boolean;
  /** Callback to select/toggle an option by index */
  onSelectOption: (index: number) => void;
  /** Callback to go to the next question */
  onNext: () => void;
  /** Callback to go to the previous question */
  onPrevious: () => void;
  /** Callback to submit the answer */
  onSubmit: () => void;
  /** Callback to end the session (last question) */
  onEndSession?: () => void;
}

/**
 * Adds keyboard shortcuts for the quiz on desktop:
 * - 1–9: Select/toggle answer option
 * - ArrowLeft: Previous question
 * - ArrowRight / Enter: Submit answer → Next question (mirrors primary action button)
 */
export const useQuizKeyboardShortcuts = ({
  optionCount,
  answerSubmitted,
  showAnswer,
  canGoNext,
  canGoPrevious,
  submitDisabled,
  isSessionEnd,
  onSelectOption,
  onNext,
  onPrevious,
  onSubmit,
  onEndSession,
}: UseQuizKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea/contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Number keys 1-9: select/toggle option
      const numKey = parseInt(e.key, 10);
      if (numKey >= 1 && numKey <= 9) {
        const optionIndex = numKey - 1;
        if (optionIndex < optionCount && !answerSubmitted) {
          e.preventDefault();
          onSelectOption(optionIndex);
        }
        return;
      }

      // ArrowLeft: previous question
      if (e.key === 'ArrowLeft') {
        if (canGoPrevious) {
          e.preventDefault();
          onPrevious();
        }
        return;
      }

      // ArrowRight or Enter: mirrors the primary action button
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();

        if (showAnswer) {
          // Answer is visible → advance
          if (isSessionEnd && onEndSession) {
            onEndSession();
          } else if (canGoNext) {
            onNext();
          }
        } else if (!submitDisabled) {
          // Answer not yet submitted → submit
          onSubmit();
        }
        return;
      }
    },
    [
      optionCount,
      answerSubmitted,
      showAnswer,
      canGoNext,
      canGoPrevious,
      submitDisabled,
      isSessionEnd,
      onSelectOption,
      onNext,
      onPrevious,
      onSubmit,
      onEndSession,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
