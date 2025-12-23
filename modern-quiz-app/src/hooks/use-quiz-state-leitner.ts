'use client';

import { useCallback, useMemo } from 'react';
import type { Question } from '@/types/quiz';
import { leitnerSystem } from '@/lib/leitner';
import { useLeitnerSession } from './leitner/use-leitner-session';
import { useLeitnerProgress } from './leitner/use-leitner-progress';
import { useLeitnerStats } from './leitner/use-leitner-stats';

export function useQuizStateWithLeitner(
  questions: Question[],
  selectedTopic: string | null, // Kept for API compatibility but unused
  setSelectedTopic: (topic: string | null) => void // Kept for API compatibility
) {
  // 1. Session Management (Questions List, Lifecycle)
  const session = useLeitnerSession({
    questions,
    onSessionReset: () => {
      // This will be connected via the wrapper function below
    }
  });

  // 2. Progress State (Answers, Index, Submissions)
  const progress = useLeitnerProgress(session.filteredQuestions);

  // 3. Stats Management
  const stats = useLeitnerStats(questions, progress.submissionStates);

  // Wrapper for starting new session that syncs both hooks
  const startNewSession = useCallback(() => {
    progress.resetProgress();
    session.startNewSession(); // This generates new questions
  }, [progress, session]);

  // Wrapper for ending session
  const endCurrentSession = useCallback(() => {
    session.endCurrentSession(progress.submissionStates);
  }, [session, progress.submissionStates]);

  // Submit Answer Logic (Coordinator)
  const submitAnswer = useCallback(async (questionId: string, answerIndexes: number[]) => {
    if (!questions || questions.length === 0) return;

    // 1. Find Question
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.error('[Leitner] Question not found', { questionId });
      return;
    }

    // 2. Check Correctness
    const isCorrect =
      answerIndexes.length === question.answerIndexes.length &&
      answerIndexes.every(answer => question.answerIndexes.includes(answer));

    // 3. Update UI State (Progress)
    // Update answers first for immediate feedback (if not already done via select)
    progress.updateAnswers(questionId, answerIndexes);
    progress.submitQuestion(questionId, answerIndexes, isCorrect);

    // 4. Update Business Logic (Leitner System)
    try {
      await leitnerSystem.ensureInitialized();
      const result = leitnerSystem.processAnswer(questionId, isCorrect);
      return result;
    } catch (error) {
      console.error('[Leitner] Failed to process answer:', error);
      throw error;
    }
  }, [questions, progress]);

  // Session Progress Derivation
  const sessionProgress = useMemo(() => {
    if (session.filteredQuestions.length === 0) {
      return { current: 0, total: 0, isActive: false };
    }

    // const submittedCount = Object.keys(progress.submissionStates).filter(id =>
    //   session.filteredQuestions.some(q => q.id === id) && progress.submissionStates[id]?.isSubmitted
    // ).length;

    return {
      current: progress.currentQuestionIndex + 1,
      total: session.filteredQuestions.length,
      isActive: !session.isSessionComplete && session.filteredQuestions.length > 0
    };
  }, [session.filteredQuestions, progress.currentQuestionIndex, session.isSessionComplete]);

  // Question Progress Derivation
  const getQuestionProgress = useCallback((questionId: string) => {
    return leitnerSystem.getQuestionProgress(questionId);
  }, []);

  // Construct Actions API
  const actions = useMemo(() => ({
    setSelectedTopic: setSelectedTopic, // No-op
    updateAnswers: progress.updateAnswers,
    submitAnswer,
    setAnswer: progress.updateAnswers, // Alias
    nextQuestion: progress.nextQuestion,
    previousQuestion: progress.previousQuestion,
    goToQuestion: progress.goToQuestion,
    clearAllProgress: () => { leitnerSystem.clearProgress(); window.location.reload(); }, // Simple reset for now
    getSubmissionState: progress.getSubmissionState,
    startNewSession,
    endCurrentSession,
  }), [
    setSelectedTopic,
    progress.updateAnswers,
    progress.nextQuestion,
    progress.previousQuestion,
    progress.goToQuestion,
    progress.getSubmissionState,
    submitAnswer,
    startNewSession,
    endCurrentSession
  ]);

  return {
    currentQuestionIndex: progress.currentQuestionIndex,
    selectedTopic: null,
    filteredQuestions: session.filteredQuestions,
    answers: progress.answers,
    stats,
    actions,
    getQuestionProgress,
    isSessionComplete: session.isSessionComplete,
    sessionResults: session.savedSessionResults,
    sessionProgress,
    isLoadingSession: session.isLoadingSession,
  };
}
