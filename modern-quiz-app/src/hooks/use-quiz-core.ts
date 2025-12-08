'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

export interface QuizCoreState {
  currentQuestionIndex: number;
  answers: Record<string, number[]>;
  filteredQuestions: Question[];
}

export interface QuizCoreActions {
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  updateAnswer: (questionId: string, answerIndexes: number[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
}

export interface UseQuizCoreOptions {
  questions: Question[];
  selectedTopic: string | null;
  storagePrefix: 'leitner' | 'practice';
  /** If true, skip loading from localStorage on mount */
  skipInitialLoad?: boolean;
  /** Custom filter function for questions */
  customFilter?: (questions: Question[]) => Question[];
}

/**
 * Core quiz state hook that provides shared functionality for both
 * Practice and Leitner modes. This includes:
 * - Question filtering (excluding code/empty questions)
 * - PDF question prioritization
 * - Navigation (next, previous, goTo)
 * - Answer state management
 * - localStorage persistence with mode-specific keys
 */
export function useQuizCore({
  questions,
  selectedTopic,
  storagePrefix,
  skipInitialLoad = false,
  customFilter,
}: UseQuizCoreOptions): QuizCoreState & { actions: QuizCoreActions } {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});

  // Storage keys for this mode
  const storageKeys = useMemo(() => ({
    index: `${storagePrefix}-quiz-index`,
    answers: `${storagePrefix}-quiz-answers`,
  }), [storagePrefix]);

  // Load saved state on mount
  useEffect(() => {
    if (skipInitialLoad) return;
    
    const savedAnswers = loadFromLocalStorage(storageKeys.answers, {});
    const savedIndex = loadFromLocalStorage(storageKeys.index, 0);
    
    setAnswers(savedAnswers);
    setCurrentQuestionIndex(savedIndex);
  }, [storageKeys, skipInitialLoad]);

  // Persist answers to localStorage
  useEffect(() => {
    saveToLocalStorage(storageKeys.answers, answers);
  }, [answers, storageKeys.answers]);

  // Persist index to localStorage
  useEffect(() => {
    saveToLocalStorage(storageKeys.index, currentQuestionIndex);
  }, [currentQuestionIndex, storageKeys.index]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    // Base filtering: exclude code questions and empty options
    let baseQuestions = questions.filter(question => {
      if (question.hasCode) return false;
      if (question.options.length === 0) return false;
      return true;
    });

    // Apply topic filter if selected
    if (selectedTopic) {
      baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
    }

    // Apply custom filter if provided
    if (customFilter) {
      baseQuestions = customFilter(baseQuestions);
    }

    // Sort to prioritize PDF questions first
    baseQuestions.sort((a, b) => {
      const aIsPdf = isPdfQuestion(a);
      const bIsPdf = isPdfQuestion(b);
      
      if (aIsPdf && !bIsPdf) return -1;
      if (!aIsPdf && bIsPdf) return 1;
      return 0;
    });

    return baseQuestions;
  }, [questions, selectedTopic, customFilter]);

  // Clamp index when questions change
  useEffect(() => {
    if (filteredQuestions.length === 0) return;
    
    setCurrentQuestionIndex(prev => {
      const maxIndex = filteredQuestions.length - 1;
      if (prev > maxIndex) return maxIndex;
      return prev;
    });
  }, [filteredQuestions.length]);

  // Reset index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Core actions
  const updateAnswer = useCallback((questionId: string, answerIndexes: number[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndexes,
    }));
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (prev < filteredQuestions.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [filteredQuestions.length]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < filteredQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [filteredQuestions.length]);

  const actions: QuizCoreActions = useMemo(() => ({
    setCurrentQuestionIndex,
    setAnswers,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
  }), [updateAnswer, nextQuestion, previousQuestion, goToQuestion]);

  return {
    currentQuestionIndex,
    answers,
    filteredQuestions,
    actions,
  };
}
