'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';
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
  const [submissionStates, setSubmissionStates] = useState<
    Record<
      string,
      {
        isSubmitted: boolean;
        isCorrect: boolean;
        showAnswer: boolean;
        submittedAt: number;
        submittedAnswers: number[]; // Add submitted answers to the type
      }
    >
  >({});
  const [__forceTick, setForceTick] = useState(0); // Keep for clearAllProgress only
  
  // Initialize stats with safe defaults to prevent null reference errors
  const [stats, setStats] = useState<EnhancedQuizStats>(() => ({
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    leitner: {
      totalQuestions: 0,
      questionsStarted: 0,
      boxDistribution: {},
      dueToday: 0,
      accuracyRate: 0,
      streakDays: 0,
    },
  }));

  // Simple in-place shuffle helper
  function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Load saved state (including submission states)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  useEffect(() => {
    const savedIndex = loadFromLocalStorage('leitner-quiz-index', 0);
    setCurrentQuestionIndex(savedIndex);
    
    // Load submission states
    const savedSubmissionStates = loadFromLocalStorage('leitner-submission-states', {});
    setSubmissionStates(savedSubmissionStates);
  }, []);

  // Save state changes (including submission states)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  useEffect(() => {
    saveToLocalStorage('leitner-quiz-index', currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Save submission states when they change
  useEffect(() => {
    saveToLocalStorage('leitner-submission-states', submissionStates);
  }, [submissionStates]);

  // Filter and sort questions based on topic and Leitner system
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // Update filtered questions when dependencies change
  useEffect(() => {
    const updateQuestions = async () => {
      await leitnerSystem.ensureInitialized();
      
      // Use centralized filtering first
      let baseQuestions = questionService.filterQuestions(questions);

      if (selectedTopic) {
        baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
        
        // Sort to prioritize PDF questions first, then shuffle within each group
        const pdfQuestions = baseQuestions.filter(q => isPdfQuestion(q));
        const regularQuestions = baseQuestions.filter(q => !isPdfQuestion(q));
        
        // Shuffle each group separately, then combine with PDF questions first
        const shuffledPdf = shuffleArray(pdfQuestions);
        const shuffledRegular = shuffleArray(regularQuestions);
        baseQuestions = [...shuffledPdf, ...shuffledRegular];
        
        setFilteredQuestions(baseQuestions);
      } else {
        // For Leitner mode, get due questions from the Leitner system
        const dueQuestions = await leitnerSystem.getDueQuestions(baseQuestions);
        
        // Sort due questions to prioritize PDF questions first
        dueQuestions.sort((a, b) => {
          // PDF questions come first (handle undefined safely)
          const aIsPdf = isPdfQuestion(a);
          const bIsPdf = isPdfQuestion(b);
          
          if (aIsPdf && !bIsPdf) return -1;
          if (!aIsPdf && bIsPdf) return 1;
          // Within same type (PDF or regular), maintain Leitner system order
          return 0;
        });
        
        setFilteredQuestions(dueQuestions);
        
        // Clear answer state for all due questions to ensure fresh review
        setAnswers(prev => {
          const cleaned = { ...prev };
          dueQuestions.forEach(question => {
            delete cleaned[question.id];
          });
          return cleaned;
        });
        
        // DO NOT clear submission states - this destroys user progress!
        // Submission states should persist to track completion progress
        // Only clear them explicitly when user chooses to reset progress
      }
    };

    updateQuestions();
  }, [questions, selectedTopic, __forceTick]); // Add __forceTick to refresh after answers

  // Initialize and update stats when questions, topic, or force refresh change
  // Note: We don't include submissionStates here to avoid excessive recalculation
  useEffect(() => {
    if (questions.length > 0) {
      try {
        const filteredQs = questionService.filterQuestions(questions);
        const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQs);
        const leitnerStats = leitnerSystem.getStats(filteredQs);

        setStats({
          totalQuestions: leitnerCompletion.totalQuestions,
          answeredQuestions: leitnerCompletion.answeredQuestions,
          correctAnswers: leitnerCompletion.correctAnswers,
          incorrectAnswers: leitnerCompletion.incorrectAnswers,
          accuracy: leitnerCompletion.accuracy,
          leitner: leitnerStats,
        });
      } catch (error) {
        console.error('Failed to update stats:', error);
        // Keep existing stats on error - don't update
      }
    }
  }, [questions, selectedTopic, __forceTick]); // Removed submissionStates for performance

  // Separate effect to update stats when submissions change (debounced)
  useEffect(() => {
    if (questions.length === 0) return;

    const timeoutId = setTimeout(() => {
      try {
        const filteredQs = questionService.filterQuestions(questions);
        const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQs);
        const leitnerStats = leitnerSystem.getStats(filteredQs);

        setStats({
          totalQuestions: leitnerCompletion.totalQuestions,
          answeredQuestions: leitnerCompletion.answeredQuestions,
          correctAnswers: leitnerCompletion.correctAnswers,
          incorrectAnswers: leitnerCompletion.incorrectAnswers,
          accuracy: leitnerCompletion.accuracy,
          leitner: leitnerStats,
        });
      } catch (error) {
        console.error('Failed to update stats after submission:', error);
      }
    }, 100); // 100ms debounce to avoid excessive calculations

    return () => clearTimeout(timeoutId);
  }, [submissionStates, questions, selectedTopic]);

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Clear answer state when the current question changes
  useEffect(() => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers(prev => {
        const cleaned = { ...prev };
        delete cleaned[currentQuestion.id];
        return cleaned;
      });
    }
  }, [currentQuestionIndex, filteredQuestions]);

  // Separate function for just updating selected answers (no Leitner processing)
  const updateSelectedAnswers = useCallback(
    (questionId: string, answerIndexes: number[]) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndexes,
      }));
    },
    []
  );

  // Clear stale answer selections (but preserve submission history for progress tracking)
  useEffect(() => {
    // Only clean current answer selections, NOT submission states
    // This prevents memory leaks while preserving user progress
    const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
    
    setAnswers(prev => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach(questionId => {
        if (!currentQuestionIds.has(questionId)) {
          delete cleaned[questionId];
        }
      });
      return cleaned;
    });
    
    // DO NOT clean submission states - they contain valuable progress data
    // that should persist across topic switches and sessions
  }, [filteredQuestions]); // Clean up when filtered questions change

  // Actions - Memoized to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
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
          [questionId]: answerIndexes,
        }));

        // Find the question to check correctness
        const question = questions.find(q => q.id === questionId);
        if (!question) {
          console.error('[Leitner] Question not found', { questionId });
          return;
        }

        // Check if answer is correct
        const isCorrect =
          answerIndexes.length === question.answerIndexes.length &&
          answerIndexes.every(answer =>
            question.answerIndexes.includes(answer)
          );

        // Store submission state with submitted answers
        setSubmissionStates(prev => {
          const newState = {
            ...prev,
            [questionId]: {
              isSubmitted: true,
              isCorrect,
              showAnswer: true,
              submittedAt: Date.now(),
              submittedAnswers: answerIndexes, // Store the submitted answers
            },
          };
          
          // Save to localStorage for mobile persistence
          saveToLocalStorage('leitner-submission-states', newState);
          
          return newState;
        });

        try {
          console.log(`🔍 [DEBUG] submitAnswer called: questionId=${questionId.slice(-8)}, answerIndexes=[${answerIndexes.join(',')}]`);
          
          // Ensure Leitner system is initialized first
          await leitnerSystem.ensureInitialized();
          
          console.log(`🔍 [DEBUG] Leitner system initialized, processing answer: isCorrect=${isCorrect}`);
          
          // Process with Leitner system (synchronous operation)
          const result = leitnerSystem.processAnswer(questionId, isCorrect);

          console.log(`🔍 [DEBUG] Leitner processAnswer result:`, result);

          // Stats are updated inline with submission state to prevent race conditions
          // No separate updateStatsAfterSubmission call needed

          // Return result for UI feedback without auto-navigation
          return result;
        } catch (error) {
          console.error('🔍 [DEBUG] [Leitner] Failed to process answer:', error);
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
          
          // Only clear current answer selection, NOT submission state
          // This preserves progress while allowing fresh answer selection
          const newQuestionId = filteredQuestions[index]?.id;
          if (newQuestionId) {
            setAnswers(prev => {
              const newAnswers = { ...prev };
              delete newAnswers[newQuestionId];
              return newAnswers;
            });
            
            // DO NOT delete submission states - preserve progress!
            // The user should see their previous submission if they navigate back
          }
        }
      },

      clearAllProgress: () => {
        leitnerSystem.clearProgress();
        setForceTick(prev => prev + 1);
      },

      // Expose submission state for a question (used by UI to highlight wrong selections)
      getSubmissionState: (questionId: string) => {
        return submissionStates[questionId] || null;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [
      setSelectedTopic,
      updateSelectedAnswers,
      currentQuestionIndex,
      filteredQuestions,
      questions,
      submissionStates,
    ]
  );

  // Removed render debug log

  // Reactive question progress that updates when answers change
  const getQuestionProgress = useCallback(
    (questionId: string) => {
      // This will be called fresh each time __forceTick changes
      return leitnerSystem.getQuestionProgress(questionId);
    },
    [] // Remove __forceTick dependency as it's not actually needed
  );

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions,
    getQuestionProgress,
  };
}
