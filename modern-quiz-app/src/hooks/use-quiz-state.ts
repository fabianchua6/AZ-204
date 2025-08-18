'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question, QuizState, QuizStats } from '@/types/quiz';
import { saveToLocalStorage, loadFromLocalStorage, calculateAccuracy } from '@/lib/utils';

export function useQuizState(questions: Question[]) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [showAnswer, setShowAnswer] = useState(false);

  // Load saved state
  useEffect(() => {
    const savedAnswers = loadFromLocalStorage('quiz-answers', {});
    const savedTopic = loadFromLocalStorage('quiz-topic', null);
    const savedIndex = loadFromLocalStorage('quiz-index', 0);
    
    setAnswers(savedAnswers);
    setSelectedTopic(savedTopic);
    setCurrentQuestionIndex(savedIndex);
  }, []);

  // Save state changes
  useEffect(() => {
    saveToLocalStorage('quiz-answers', answers);
  }, [answers]);

  useEffect(() => {
    saveToLocalStorage('quiz-topic', selectedTopic);
  }, [selectedTopic]);

  useEffect(() => {
    saveToLocalStorage('quiz-index', currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Filter questions by topic
  const filteredQuestions = useMemo(() => {
    if (!selectedTopic) return questions;
    return questions.filter(q => q.topic === selectedTopic);
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
        const isCorrect = userAnswers.length === question.answerIndexes.length &&
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
      accuracy
    };
  }, [filteredQuestions, answers]);

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
  }, [selectedTopic]);

  // Actions
  const actions = {
    setSelectedTopic: (topic: string | null) => {
      setSelectedTopic(topic);
    },
    
    setAnswer: (questionId: string, answerIndexes: number[]) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndexes
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
    }
  };

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    showAnswer,
    stats,
    actions
  };
}
