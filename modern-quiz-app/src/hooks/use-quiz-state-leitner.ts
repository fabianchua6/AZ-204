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
  const [submissionStates, setSubmissionStates] = useState<Record<string, {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
    submittedAt: number;
    submittedAnswers: number[]; // Add submitted answers to the type
  }>>({});
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
    // In Leitner mode, use Leitner system for progress tracking
    const leitnerCompletion = leitnerSystem.getCompletionProgress(questions);
    const leitnerStats = leitnerSystem.getStats(questions);

    return {
      // Use Leitner completion stats instead of traditional answer tracking
      totalQuestions: leitnerCompletion.totalQuestions,
      answeredQuestions: leitnerCompletion.answeredQuestions,
      correctAnswers: leitnerCompletion.correctAnswers,
      incorrectAnswers: leitnerCompletion.incorrectAnswers,
      accuracy: leitnerCompletion.accuracy,
      leitner: leitnerStats
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, __forceTick]); // Depend on forceTick for updates

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

  // Sync Leitner progress with traditional answers state for progress tracking
  useEffect(() => {
    const syncAnswers = async () => {
      await leitnerSystem.ensureInitialized();
      
      // Add entries for questions that have been answered in Leitner system
      const syncedAnswers: Record<string, number[]> = {};
      questions.forEach(question => {
        const progress = leitnerSystem.getQuestionProgress(question.id);
        if (progress) {
          // Add a placeholder entry to mark this question as "answered"
          // Use the correct answer indexes as the stored answer for progress tracking
          syncedAnswers[question.id] = question.answerIndexes;
        }
      });
      
      // Merge with existing answers (preserve user selections)
      setAnswers(prev => ({ ...prev, ...syncedAnswers }));
    };
    
    syncAnswers();
  }, [questions, __forceTick]); // Re-sync when forceTick changes (after new answers)

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

      // Store submission state with submitted answers
      setSubmissionStates(prev => {
        const newState = {
          ...prev,
          [questionId]: {
            isSubmitted: true,
            isCorrect,
            showAnswer: true,
            submittedAt: Date.now(),
            submittedAnswers: answerIndexes // Store the submitted answers
          }
        };
        return newState;
      });

      try {
        // Process with Leitner system (synchronous operation)
        const result = leitnerSystem.processAnswer(questionId, isCorrect);
        
        // Force stats recalculation immediately
        setForceTick(prev => {
          console.log('[LeitnerHook] forceTick update:', prev, '->', prev + 1);
          console.log('[LeitnerHook] Question completed:', questionId, 'isCorrect:', isCorrect);
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

    getSubmissionState: (questionId: string) => {
      const state = submissionStates[questionId] || null;
      return state;
    },

    clearAllProgress: () => {
      console.log('[Leitner] clearAllProgress');
      leitnerSystem.clearProgress();
      setAnswers({});
      setSubmissionStates({});
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
    submissionStates, // Needed for getSubmissionState to access current state
  ]);

  console.log('[LeitnerHook] render', { currentQuestionIndex, filteredLen: filteredQuestions.length, answersKeys: Object.keys(answers).length, forceTick: __forceTick });

  // Reactive question progress that updates when answers change
  const getQuestionProgress = useCallback((questionId: string) => {
    // This will be called fresh each time __forceTick changes
    return leitnerSystem.getQuestionProgress(questionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [__forceTick]); // Re-create when forceTick changes

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions,
    getQuestionProgress
  };
}
