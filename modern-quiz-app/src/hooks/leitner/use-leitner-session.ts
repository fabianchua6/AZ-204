'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Question } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';
import { leitnerSystem } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import { debug } from '@/lib/logger';

// Helper for shuffling
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SessionResults {
  correct: number;
  incorrect: number;
  total: number;
}

interface UseLeitnerSessionProps {
  questions: Question[];
  // Callback to signal other hooks that session is resetting
  onSessionReset: () => void;
}

export function useLeitnerSession({
  questions,
  onSessionReset,
}: UseLeitnerSessionProps) {
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [savedSessionResults, setSavedSessionResults] =
    useState<SessionResults | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use ref for session ending flag to avoid race conditions
  const isEndingSessionRef = useRef(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Load session results from previous end-of-session
  // (In original code this was not persisted to LS explicitly BUT derived/memoized.
  //  Actually check original: savedSessionResults was state, initialized to null?
  //  Wait, original code: `const [savedSessionResults, setSavedSessionResults] = useState<{...} | null>(null);`
  //  It was NOT loaded from LS. It was only set when user clicked "End Quiz".
  //  So if they refresh on the results screen, they lose results?
  //  Let's keep original behavior for now, or improve it later.)

  // 1. Initialize Session (Load or Create)
  useEffect(() => {
    let isMounted = true;

    const updateQuestions = async () => {
      // Setup
      if (questions.length === 0) return;

      // Skip if currently ending session
      if (isEndingSession || isEndingSessionRef.current) {
        debug('⚠️ Skipping question regeneration - session is ending');
        return;
      }

      // Skip if we already have results (session complete view)
      if (savedSessionResults) {
        return;
      }

      try {
        setIsLoadingSession(true);
        await leitnerSystem.ensureInitialized();

        if (!isMounted) return;

        // Filter base questions
        const baseQuestions = questionService.filterQuestions(questions);

        // Try to restore existing session
        const savedSession = loadFromLocalStorage<{
          questionIds: string[];
          createdAt: number;
          totalQuestions?: number;
        } | null>('leitner-current-session', null);

        const SESSION_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours
        const now = Date.now();

        // Check validity
        const questionCountChanged =
          savedSession?.totalQuestions &&
          Math.abs(savedSession.totalQuestions - baseQuestions.length) >
            baseQuestions.length * 0.1;

        if (
          savedSession &&
          savedSession.questionIds &&
          savedSession.questionIds.length > 0 &&
          now - savedSession.createdAt < SESSION_EXPIRY &&
          !questionCountChanged
        ) {
          // Restore
          const restoredQuestions = savedSession.questionIds
            .map(id => baseQuestions.find(q => q.id === id))
            .filter((q): q is Question => q !== undefined);

          // Check completion status via side-channel (submission states are in LS)
          const savedSubmissions = loadFromLocalStorage<
            Record<string, { isSubmitted: boolean }>
          >('leitner-submission-states', {});
          const allAnswered =
            restoredQuestions.length > 0 &&
            restoredQuestions.every(q => savedSubmissions[q.id]?.isSubmitted);

          if (allAnswered) {
            debug(
              '⚠️ All questions answered in saved session - generating fresh session'
            );
            // Fall through to generate new
            saveToLocalStorage('leitner-current-session', null);
            // We don't clear submissions here, that happens in startNewSession usually,
            // but here we are auto-starting new session implicitly?
            // Original logic: "saveToLocalStorage('leitner-submission-states', {});"
            saveToLocalStorage('leitner-submission-states', {});
          } else if (
            restoredQuestions.length >=
            savedSession.questionIds.length * 0.5
          ) {
            // Valid restore
            if (!isMounted) return;
            setFilteredQuestions(restoredQuestions);
            setIsLoadingSession(false);
            debug(
              '✅ Session restored:',
              restoredQuestions.length,
              'questions'
            );
            return;
          }
        }

        // Generate NEW Session
        debug('🆕 Generating new session');
        const dueQuestions = await leitnerSystem.getDueQuestions(baseQuestions);

        if (!isMounted) return;

        const shuffledDueQuestions = shuffleArray(dueQuestions);

        // PDF-first ordering: clear all PDF questions before non-PDF ones
        const SESSION_SIZE = 20;
        const MAX_PDF = Math.ceil(SESSION_SIZE * 0.8); // up to 16 PDF
        const MAX_NON_PDF = SESSION_SIZE - MAX_PDF; // up to 4 non-PDF

        const pdfQuestions = shuffledDueQuestions.filter(q => isPdfQuestion(q));
        const nonPdfQuestions = shuffledDueQuestions.filter(
          q => !isPdfQuestion(q)
        );

        // Take as many PDF as possible; fill any shortfall from non-PDF
        const selectedPdf = pdfQuestions.slice(0, MAX_PDF);
        const pdfShortfall = MAX_PDF - selectedPdf.length;

        const selectedNonPdf = nonPdfQuestions.slice(
          0,
          MAX_NON_PDF + pdfShortfall
        );

        // PDFs first (shuffled within group), then non-PDFs (shuffled within group)
        const sessionQuestions = [
          ...shuffleArray(selectedPdf),
          ...shuffleArray(selectedNonPdf),
        ];

        // Save
        saveToLocalStorage('leitner-current-session', {
          questionIds: sessionQuestions.map(q => q.id),
          createdAt: now,
          totalQuestions: baseQuestions.length,
        });

        if (!isMounted) return;
        setFilteredQuestions(sessionQuestions);
        setIsLoadingSession(false);

        // Signal a "new session" start (which should clear stats/answers in other hooks)
        // However, we are inside useEffect. We can't call the callback here if it triggers state updates in parent
        // that improperly re-trigger this.
        // Actually, the original logic cleared 'answers' state here?
        // Yes: setAnswers(prev => clean... dueQuestions)
        // We will rely on the consumer of this hook to handle that via `onSessionReset` or similar explicit action,
        // OR we just rely on `startNewSession` action.
        // For auto-generated sessions, the answers might be stale.
        // We'll leave answer cleanup to `useLeitnerProgress` which can check against `filteredQuestions`.
      } catch (error) {
        console.error('Failed to update questions:', error);
        setIsLoadingSession(false);
      }
    };

    updateQuestions();

    return () => {
      isMounted = false;
    };
  }, [questions, refreshTrigger, isEndingSession, savedSessionResults]); // removed validation dependencies for now

  // Action: Start New Session
  const startNewSession = useCallback(() => {
    debug('🚀 Starting new session');
    setSavedSessionResults(null);
    setIsEndingSession(false);
    isEndingSessionRef.current = false;

    saveToLocalStorage('leitner-current-session', null);
    // Clearing submission states is responsibility of Progress hook, but we need to coordinate.
    // We will trigger a refresh which will cause re-generation.

    onSessionReset(); // Tell parent/other hooks to clear their state
    setRefreshTrigger(prev => prev + 1);
  }, [onSessionReset]);

  // Action: End Session
  const endCurrentSession = useCallback(
    (
      currentSubmissions: Record<
        string,
        { isSubmitted: boolean; isCorrect: boolean }
      >
    ) => {
      debug('🚨 endCurrentSession called');
      setIsEndingSession(true);
      isEndingSessionRef.current = true;

      const results = filteredQuestions.map(q => ({
        question: q,
        submission: currentSubmissions[q.id],
      }));

      const correct = results.filter(r => r.submission?.isCorrect).length;
      const total = results.length;

      setSavedSessionResults({
        correct,
        incorrect: total - correct,
        total,
      });

      // Clear session persistence
      saveToLocalStorage('leitner-current-session', null);
      // Note: We don't clear filteredQuestions here to avoid UI flash, we just show results overlay

      // We DO want to signal that the session is "logically" over for the system
      setTimeout(() => {
        isEndingSessionRef.current = false;
        setIsEndingSession(false);
        setRefreshTrigger(prev => prev + 1);
      }, 500);
    },
    [filteredQuestions]
  );

  return {
    filteredQuestions,
    isLoadingSession,
    savedSessionResults,
    startNewSession,
    endCurrentSession,
    isSessionComplete: !!savedSessionResults,
  };
}
