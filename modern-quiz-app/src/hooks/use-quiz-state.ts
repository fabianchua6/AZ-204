'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question, QuizStats } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  calculateAccuracy,
} from '@/lib/utils';

export function useQuizState(
  questions: Question[],
  selectedTopic: string | null,
  setSelectedTopic: (topic: string | null) => void
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [showAnswer, setShowAnswer] = useState(false);

  // Load saved state (excluding topic which is managed by parent)
  // Use mode-specific localStorage keys to avoid conflicts with Leitner mode
  // Only initialize if we're in Practice mode (selectedTopic !== null)
  useEffect(() => {
    if (selectedTopic === null) {
      // Not in Practice mode - don't initialize or interfere with state
      return;
    }
    
    const savedAnswers = loadFromLocalStorage('practice-quiz-answers', {});
    const savedIndex = loadFromLocalStorage('practice-quiz-index', 0);

    setAnswers(savedAnswers);
    setCurrentQuestionIndex(savedIndex);
  }, [selectedTopic]); // Re-run when mode changes

  // Save state changes (excluding topic which is managed by parent)
  // Use mode-specific localStorage keys to avoid conflicts with Leitner mode
  // Only save if we're in Practice mode
  useEffect(() => {
    if (selectedTopic !== null) {
      saveToLocalStorage('practice-quiz-answers', answers);
    }
  }, [answers, selectedTopic]);

  useEffect(() => {
    if (selectedTopic !== null) {
      saveToLocalStorage('practice-quiz-index', currentQuestionIndex);
    }
  }, [currentQuestionIndex, selectedTopic]);

  // Filter questions by topic and exclude code examples and questions with no options
  const filteredQuestions = useMemo(() => {
    let baseQuestions = questions;

    // Filter out code questions and questions with no select options
    baseQuestions = baseQuestions.filter(question => {
      // Exclude questions with code examples
      if (question.hasCode) {
        return false;
      }
      // Exclude questions with no select options
      if (question.options.length === 0) {
        return false;
      }
      return true;
    });

    if (selectedTopic) {
      baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
    }
    
    // Sort to prioritize PDF questions first
    baseQuestions.sort((a, b) => {
      // PDF questions come first (handle undefined safely)
      const aIsPdf = isPdfQuestion(a);
      const bIsPdf = isPdfQuestion(b);
      
      if (aIsPdf && !bIsPdf) return -1;
      if (!aIsPdf && bIsPdf) return 1;
      // Within same type (PDF or regular), maintain original order
      return 0;
    });
    
    return baseQuestions;
  }, [questions, selectedTopic]);

  // Calculate stats
  const stats: QuizStats = useMemo(() => {
    const totalQuestions = filteredQuestions.length;
    const answeredQuestions = Object.keys(answers).filter(id =>
      filteredQuestions.some(q => q.id === id)
    ).length;

    let correctAnswers = 0;
    filteredQuestions.forEach(question => {
      const userAnswers = answers[question.id];
      if (userAnswers && userAnswers.length > 0) {
        const isCorrect =
          userAnswers.length === question.answerIndexes.length &&
          userAnswers.every(answer => question.answerIndexes.includes(answer));
        if (isCorrect) correctAnswers++;
      }
    });

    const incorrectAnswers = answeredQuestions - correctAnswers;
    const accuracy = calculateAccuracy(correctAnswers, answeredQuestions);

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
    };
  }, [filteredQuestions, answers]);

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    
    // CRITICAL: When entering Practice mode, clear ALL Leitner contamination
    // This prevents cross-contamination between the two quiz systems
    if (selectedTopic !== null && filteredQuestions.length > 0) {
      // Clear ALL Leitner-related localStorage that could interfere with Practice mode
      const leitnerKeys = [
        'leitner-submission-states',
        'leitner-progress',        // ⭐ THIS WAS THE MISSING KEY!
        'leitner-settings',
        'leitner-quiz-index',
      ];
      
      leitnerKeys.forEach(key => {
        const existingData = loadFromLocalStorage(key, null);
        if (existingData) {
          // For progress data, only clear questions relevant to current topic
          if (key === 'leitner-progress' && existingData && typeof existingData === 'object') {
            const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
            const cleaned = { ...(existingData as Record<string, unknown>) };
            
            Object.keys(cleaned).forEach(questionId => {
              if (currentQuestionIds.has(questionId)) {
                delete cleaned[questionId];
              }
            });
            
            saveToLocalStorage(key, cleaned);
          }
          // For submission states, clear topic-specific data
          else if (key === 'leitner-submission-states' && existingData && typeof existingData === 'object') {
            const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
            const cleaned = { ...(existingData as Record<string, unknown>) };
            
            Object.keys(cleaned).forEach(questionId => {
              if (currentQuestionIds.has(questionId)) {
                delete cleaned[questionId];
              }
            });
            
            saveToLocalStorage(key, cleaned);
          }
          // For other keys, clear completely when entering Practice mode
          else {
            localStorage.removeItem(key);
          }
        }
      });
      
      // Also clear any daily attempt keys for today to reset question availability
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `leitner-daily-attempts-${today}`;
      localStorage.removeItem(dailyKey);
      
      // Clear any lingering practice answers from this topic to ensure fresh start
      setAnswers(prev => {
        const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
        const cleaned = { ...prev };
        
        Object.keys(cleaned).forEach(questionId => {
          if (currentQuestionIds.has(questionId)) {
            delete cleaned[questionId];
          }
        });
        
        return cleaned;
      });
    }
  }, [selectedTopic, filteredQuestions]);

  // Actions - Memoized to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
      setSelectedTopic: (topic: string | null) => {
        setSelectedTopic(topic);
      },

      setAnswer: (questionId: string, answerIndexes: number[]) => {
        setAnswers(prev => ({
          ...prev,
          [questionId]: answerIndexes,
        }));
      },

      toggleShowAnswer: () => {
        setShowAnswer(prev => !prev);
      },

      nextQuestion: () => {
        if (currentQuestionIndex < filteredQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setShowAnswer(false);
        }
      },

      previousQuestion: () => {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(prev => prev - 1);
          setShowAnswer(false);
        }
      },

      goToQuestion: (index: number) => {
        if (index >= 0 && index < filteredQuestions.length) {
          setCurrentQuestionIndex(index);
          setShowAnswer(false);
        }
      },
    }),
    [setSelectedTopic, currentQuestionIndex, filteredQuestions.length]
  );

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    showAnswer,
    stats,
    actions,
  };
}
