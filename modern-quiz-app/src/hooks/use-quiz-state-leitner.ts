'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from '@/types/quiz';
import { leitnerSystem, type LeitnerStats } from '@/lib/leitner';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

interface EnhancedQuizStats {
  // Traditional stats
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  
  // Leitner-specific stats
  leitner: LeitnerStats;
}

export function useQuizStateWithLeitner(
  questions: Question[], 
  selectedTopic: string | null,
  setSelectedTopic: (topic: string | null) => void
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [__forceTick, setForceTick] = useState(0); // diagnostics only

  // Load saved state (excluding topic which is managed by parent)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  useEffect(() => {
    const savedIndex = loadFromLocalStorage('leitner-quiz-index', 0);
    setCurrentQuestionIndex(savedIndex);
  }, []);

  // Save state changes (excluding topic which is managed by parent)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  useEffect(() => {
    saveToLocalStorage('leitner-quiz-index', currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Filter and sort questions based on topic and Leitner system
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // Update filtered questions when dependencies change
  useEffect(() => {
    const updateQuestions = async () => {
      let baseQuestions = questions;
      
      // If specific topic selected, filter by topic
      if (selectedTopic) {
        baseQuestions = questions.filter(q => q.topic === selectedTopic);
        setFilteredQuestions(baseQuestions);
        return;
      }
      
      try {
        // For "All Topics", use Leitner system to prioritize due questions
        const leitnerQuestions = await leitnerSystem.getDueQuestions(baseQuestions);
        
        // Convert back to Question[] by removing Leitner-specific properties
        const cleanQuestions = leitnerQuestions.map(q => ({
          id: q.id,
          question: q.question,
          hasCode: q.hasCode,
          options: q.options,
          answerIndexes: q.answerIndexes,
          answer: q.answer,
          topic: q.topic,
        }));
        
        setFilteredQuestions(cleanQuestions);
      } catch (error) {
        console.error('Failed to get due questions:', error);
        // Fallback to original order
        setFilteredQuestions(baseQuestions);
      }
    };

    updateQuestions();
  }, [questions, selectedTopic]);

  // Calculate enhanced stats including Leitner data
  const stats: EnhancedQuizStats = useMemo(() => {
    const totalQuestions = filteredQuestions.length;
    
    // Traditional quiz stats
    const answeredQuestions = Object.keys(answers).filter(id =>
      filteredQuestions.some(q => q.id === id)
    ).length;

    let correctAnswers = 0;
    filteredQuestions.forEach(question => {
      const userAnswers = answers[question.id];
      if (userAnswers && userAnswers.length > 0) {
        const isCorrect = userAnswers.length === question.answerIndexes.length &&
          userAnswers.every(answer => question.answerIndexes.includes(answer));
        if (isCorrect) correctAnswers++;
      }
    });

    const incorrectAnswers = answeredQuestions - correctAnswers;
    const accuracy = answeredQuestions > 0 ? correctAnswers / answeredQuestions : 0;

    // Leitner-specific stats
    const leitner = leitnerSystem.getStats(questions);

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      leitner
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredQuestions, answers, questions, __forceTick]); // __forceTick forces recalculation

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Separate function for just updating selected answers (no Leitner processing)
  const updateSelectedAnswers = useCallback((questionId: string, answerIndexes: number[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndexes
    }));
  }, []);

  // Actions - Memoized to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    setSelectedTopic: (topic: string | null) => {
      setSelectedTopic(topic);
    },
    
    // For option selection (no Leitner processing)
    updateAnswers: (questionId: string, answerIndexes: number[]) => {
      updateSelectedAnswers(questionId, answerIndexes);
    },
    
    // For answer submission (with Leitner processing)
    submitAnswer: async (questionId: string, answerIndexes: number[]) => {
      if (!questions || questions.length === 0) {
        console.error('[Leitner] No questions available');
        return;
      }

      // First update the local answers state for immediate UI feedback
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndexes
      }));

      // Find the question to check correctness
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        console.error('[Leitner] Question not found', { questionId });
        return;
      }

      // Check if answer is correct
      const isCorrect = answerIndexes.length === question.answerIndexes.length &&
        answerIndexes.every(answer => question.answerIndexes.includes(answer));

      try {
        // Process with Leitner system (synchronous operation)
        const result = leitnerSystem.processAnswer(questionId, isCorrect);
        
        // Force stats recalculation immediately
        setForceTick(prev => {
          console.log('[LeitnerHook] forceTick update:', prev, '->', prev + 1);
          return prev + 1;
        });
        
        return result;
      } catch (error) {
        console.error('[Leitner] Failed to process answer:', error);
        throw error;
      }
    },

    // Legacy method for compatibility (now just updates answers)
    setAnswer: (questionId: string, answerIndexes: number[]) => {
      updateSelectedAnswers(questionId, answerIndexes);
    },
    
    nextQuestion: () => {
      console.log('[Leitner] nextQuestion invoked', { currentQuestionIndex, filteredLength: filteredQuestions.length });
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(prev => {
          const next = prev + 1;
            console.log('[Leitner] advancing to', { next });
          return next;
        });
      } else {
        console.log('[Leitner] nextQuestion blocked (at end)', { currentQuestionIndex, filteredLength: filteredQuestions.length });
      }
    },
    
    previousQuestion: () => {
      console.log('[Leitner] previousQuestion invoked', { currentQuestionIndex });
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => {
          const prevIdx = prev - 1;
          console.log('[Leitner] moving back to', { prevIdx });
          return prevIdx;
        });
      } else {
        console.log('[Leitner] previousQuestion blocked (at start)');
      }
    },
    
    goToQuestion: (index: number) => {
      console.log('[Leitner] goToQuestion invoked', { index, filteredLength: filteredQuestions.length });
      if (index >= 0 && index < filteredQuestions.length) {
        setCurrentQuestionIndex(index);
      } else {
        console.warn('[Leitner] goToQuestion out of bounds', { index });
      }
    },

    clearCurrentQuestionAnswers: (questionId: string) => {
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
    },

    // Leitner-specific actions
    getQuestionProgress: (questionId: string) => {
      return leitnerSystem.getQuestionProgress(questionId);
    },

    clearAllProgress: () => {
      console.log('[Leitner] clearAllProgress');
      leitnerSystem.clearProgress();
      setAnswers({});
      setCurrentQuestionIndex(0);
      setForceTick(t => t + 1); // force rerender for debug
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    setSelectedTopic,
    updateSelectedAnswers,
    currentQuestionIndex,
    filteredQuestions,
    questions, // Needed for inline validation in submitAnswer
  ]);

  console.log('[LeitnerHook] render', { currentQuestionIndex, filteredLen: filteredQuestions.length, answersKeys: Object.keys(answers).length, forceTick: __forceTick });

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions
  };
}
