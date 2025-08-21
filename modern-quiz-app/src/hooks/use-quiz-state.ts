'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question, QuizStats } from '@/types/quiz';
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
  useEffect(() => {
    const savedAnswers = loadFromLocalStorage('practice-quiz-answers', {});
    const savedIndex = loadFromLocalStorage('practice-quiz-index', 0);

    setAnswers(savedAnswers);
    setCurrentQuestionIndex(savedIndex);
  }, []);

  // Save state changes (excluding topic which is managed by parent)
  // Use mode-specific localStorage keys to avoid conflicts with Leitner mode
  useEffect(() => {
    saveToLocalStorage('practice-quiz-answers', answers);
  }, [answers]);

  useEffect(() => {
    saveToLocalStorage('practice-quiz-index', currentQuestionIndex);
  }, [currentQuestionIndex]);

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

    if (!selectedTopic) return baseQuestions;
    return baseQuestions.filter(q => q.topic === selectedTopic);
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
  }, [selectedTopic]);

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
