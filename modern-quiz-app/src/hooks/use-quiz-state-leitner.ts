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
      await leitnerSystem.ensureInitialized();
      
      // Use centralized filtering first
      let baseQuestions = questionService.filterQuestions(questions);

      if (selectedTopic) {
        baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
        
        // For topic mode, just randomize and show all questions in that topic
        baseQuestions = shuffleArray(baseQuestions);
        setFilteredQuestions(baseQuestions);
      } else {
        // For Leitner mode, get due questions from the Leitner system
        const dueQuestions = await leitnerSystem.getDueQuestions(baseQuestions);
        setFilteredQuestions(dueQuestions);
        
        // Clear answer state for all due questions to ensure fresh review
        setAnswers(prev => {
          const cleaned = { ...prev };
          dueQuestions.forEach(question => {
            delete cleaned[question.id];
          });
          return cleaned;
        });
        
        // Also clear submission states for due questions
        setSubmissionStates(prev => {
          const cleaned = { ...prev };
          dueQuestions.forEach(question => {
            delete cleaned[question.id];
          });
          return cleaned;
        });
      }
    };

    updateQuestions();
  }, [questions, selectedTopic, __forceTick]); // Add __forceTick to refresh after answers

  // Calculate enhanced stats including Leitner data
  const stats: EnhancedQuizStats = useMemo(() => {
    const filteredQuestions = questionService.filterQuestions(questions);
    const leitnerCompletion =
      leitnerSystem.getCompletionProgress(filteredQuestions);
    const leitnerStats = leitnerSystem.getStats(filteredQuestions);

    return {
      totalQuestions: leitnerCompletion.totalQuestions,
      answeredQuestions: leitnerCompletion.answeredQuestions,
      correctAnswers: leitnerCompletion.correctAnswers,
      incorrectAnswers: leitnerCompletion.incorrectAnswers,
      accuracy: leitnerCompletion.accuracy,
      leitner: leitnerStats,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, __forceTick]); // Depend on forceTick for updates

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

  // Clear stale answers when questions change or after submissions
  useEffect(() => {
    // Additional cleanup: remove any lingering answer state for questions not in current filtered list
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
    
    setSubmissionStates(prev => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach(questionId => {
        if (!currentQuestionIds.has(questionId)) {
          delete cleaned[questionId];
        }
      });
      return cleaned;
    });
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
          return newState;
        });

        try {
          // Ensure Leitner system is initialized first
          await leitnerSystem.ensureInitialized();
          
          // Process with Leitner system (synchronous operation)
          const result = leitnerSystem.processAnswer(questionId, isCorrect);

          // Force stats recalculation and due questions refresh
          setForceTick(prev => prev + 1);
          
          // Additional cleanup: if the question was answered incorrectly and will come back,
          // ensure its answer state is cleared immediately
          if (!isCorrect) {
            setTimeout(() => {
              setAnswers(prev => {
                const cleaned = { ...prev };
                delete cleaned[questionId];
                return cleaned;
              });
              setSubmissionStates(prev => {
                const cleaned = { ...prev };
                delete cleaned[questionId];
                return cleaned;
              });
            }, 100); // Small delay to allow the submission state to be used for UI feedback first
          }
          
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
          
          // Always clear answer state for the new question to ensure fresh review
          const newQuestionId = filteredQuestions[index]?.id;
          if (newQuestionId) {
            setAnswers(prev => {
              const newAnswers = { ...prev };
              delete newAnswers[newQuestionId];
              return newAnswers;
            });
            
            // Always clear submission state for fresh start
            setSubmissionStates(prev => {
              const newStates = { ...prev };
              delete newStates[newQuestionId];
              return newStates;
            });
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
