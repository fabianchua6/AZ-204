import { useCallback, useState, useEffect } from 'react';

interface UseAnswerSelectionProps {
  questionId: string;
  isMultipleChoice: boolean;
  initialAnswers?: number[];
  onAnswerChange?: (questionId: string, answers: number[]) => void;
  disabled?: boolean;
}

export function useAnswerSelection({
  questionId,
  isMultipleChoice,
  initialAnswers = [],
  onAnswerChange,
  disabled = false,
}: UseAnswerSelectionProps) {
  const [selectedAnswers, setSelectedAnswers] =
    useState<number[]>(initialAnswers);

  // Update local state when external answers change
  useEffect(() => {
    setSelectedAnswers(initialAnswers);
  }, [initialAnswers]);

  // Reset when question changes
  useEffect(() => {
    setSelectedAnswers(initialAnswers);
  }, [questionId, initialAnswers]);

  const toggleAnswer = useCallback(
    (optionIndex: number) => {
      if (disabled) return;

      let newAnswers: number[];

      if (isMultipleChoice) {
        if (selectedAnswers.includes(optionIndex)) {
          newAnswers = selectedAnswers.filter(i => i !== optionIndex);
        } else {
          newAnswers = [...selectedAnswers, optionIndex];
        }
      } else {
        // Single choice - replace existing selection
        newAnswers = [optionIndex];
      }

      setSelectedAnswers(newAnswers);
      onAnswerChange?.(questionId, newAnswers);
    },
    [disabled, isMultipleChoice, selectedAnswers, questionId, onAnswerChange]
  );

  const clearAnswers = useCallback(() => {
    setSelectedAnswers([]);
    onAnswerChange?.(questionId, []);
  }, [questionId, onAnswerChange]);

  const isAnswerSelected = useCallback(
    (optionIndex: number) => selectedAnswers.includes(optionIndex),
    [selectedAnswers]
  );

  return {
    selectedAnswers,
    toggleAnswer,
    clearAnswers,
    isAnswerSelected,
    hasAnswers: selectedAnswers.length > 0,
  };
}
