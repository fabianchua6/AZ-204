'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from '@/types/quiz';
import { leitnerSystem, type LeitnerStats } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
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

  // Simple in-place shuffle helper
  function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

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
      // Use centralized filtering instead of manual logic
      let baseQuestions = questionService.filterQuestions(questions);
      
      if (selectedTopic) {
        baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
      }
      // Randomize order for variety
      baseQuestions = shuffleArray(baseQuestions);
      setFilteredQuestions(baseQuestions);
    };

    updateQuestions();
  }, [questions, selectedTopic]);

  // Calculate enhanced stats including Leitner data
  const stats: EnhancedQuizStats = useMemo(() => {
    const filteredQuestions = questionService.filterQuestions(questions);
    const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQuestions);
    const leitnerStats = leitnerSystem.getStats(filteredQuestions);

    return {
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
      
      // Build map of questions that have progress (answered in Leitner system)
      const progressPlaceholders: Record<string, number[]> = {};
      questions.forEach(question => {
        const progress = leitnerSystem.getQuestionProgress(question.id);
        if (progress) {
          // Use correct answers ONLY as a placeholder if user never submitted/select any answers in this session
            progressPlaceholders[question.id] = question.answerIndexes;
        }
      });
      
      // Merge WITHOUT overwriting existing user selections (preserve wrong answers for feedback)
      setAnswers(prev => {
        const merged = { ...prev };
        for (const [qid, ans] of Object.entries(progressPlaceholders)) {
          if (!(qid in prev)) {
            merged[qid] = ans;
          }
        }
        return merged;
      });
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
        setForceTick(prev => prev + 1);
        // processAnswer already records correctness; no separate record* calls needed
        
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
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    },
    
    previousQuestion: () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    },
    
    goToQuestion: (index: number) => {
      if (index >= 0 && index < filteredQuestions.length) {
        setCurrentQuestionIndex(index);
      }
    },
    
    clearAllProgress: () => {
      leitnerSystem.clearProgress();
      setForceTick(prev => prev + 1);
    },
    
    // Expose submission state for a question (used by UI to highlight wrong selections)
    getSubmissionState: (questionId: string) => {
      return submissionStates[questionId] || null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    setSelectedTopic,
    updateSelectedAnswers,
    currentQuestionIndex,
    filteredQuestions,
    questions,
    submissionStates,
  ]);

  // Removed render debug log

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
