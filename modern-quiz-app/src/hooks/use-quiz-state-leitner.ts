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

export function useQuizStateWithLeitner(questions: Question[]) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});

  // Load saved state
  useEffect(() => {
    const savedTopic = loadFromLocalStorage('quiz-topic', null);
    const savedIndex = loadFromLocalStorage('quiz-index', 0);
    
    setSelectedTopic(savedTopic);
    setCurrentQuestionIndex(savedIndex);
  }, []);

  // Save state changes
  useEffect(() => {
    saveToLocalStorage('quiz-topic', selectedTopic);
  }, [selectedTopic]);

  useEffect(() => {
    saveToLocalStorage('quiz-index', currentQuestionIndex);
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
  }, [filteredQuestions, answers, questions]);

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Enhanced answer processing with Leitner integration (async)
  const processAnswerWithLeitner = useCallback(async (questionId: string, answerIndexes: number[]) => {
    // Find the question to check correctness
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    // Check if answer is correct
    const isCorrect = answerIndexes.length === question.answerIndexes.length &&
      answerIndexes.every(answer => question.answerIndexes.includes(answer));

    try {
      // Process with Leitner system (now async)
      const result = await leitnerSystem.processAnswer(questionId, isCorrect);
      return result;
    } catch (error) {
      console.error('Failed to process answer with Leitner system:', error);
      return undefined;
    }
  }, [questions]);

  // Separate function for just updating selected answers (no Leitner processing)
  const updateSelectedAnswers = useCallback((questionId: string, answerIndexes: number[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndexes
    }));
  }, []);

  // Actions
  const actions = {
    setSelectedTopic: (topic: string | null) => {
      setSelectedTopic(topic);
    },
    
    // For option selection (no Leitner processing)
    updateAnswers: (questionId: string, answerIndexes: number[]) => {
      updateSelectedAnswers(questionId, answerIndexes);
    },
    
    // For answer submission (with Leitner processing)
    submitAnswer: (questionId: string, answerIndexes: number[]) => {
      return processAnswerWithLeitner(questionId, answerIndexes);
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

    // Leitner-specific actions
    getQuestionProgress: (questionId: string) => {
      return leitnerSystem.getQuestionProgress(questionId);
    },

    clearAllProgress: () => {
      leitnerSystem.clearProgress();
      setAnswers({});
    }
  };

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions
  };
}
