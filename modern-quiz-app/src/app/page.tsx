'use client';

// React imports
// import { useMemo } from 'react';

// Third-party imports
import { motion, AnimatePresence } from 'framer-motion';

// Component imports
import { Header } from '@/components/header';
import { DailyBrief } from '@/components/daily-brief';
import { LeitnerQuizCard } from '@/components/leitner-quiz-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SessionResults } from '@/components/leitner/session-results';
import { DashboardStats } from '@/components/dashboard-stats';

// Hook imports
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizStateWithLeitner } from '@/hooks/use-quiz-state-leitner';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useSync } from '@/hooks/use-sync';
import { useEffect } from 'react';

// Utility imports
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/constants';

export default function Home() {
  const { questions, topics, loading, error } = useQuizData();
  const { isHeaderVisible } = useScrollDirection({ threshold: 15 });

  // Leitner mode is now the only mode
  const leitnerState = useQuizStateWithLeitner(
    questions,
    null, // selectedTopic is always null for Leitner mode
    () => {} // No-op for topic setter
  );

  const currentQuestionIndex = leitnerState.currentQuestionIndex;
  const filteredQuestions = leitnerState.filteredQuestions;
  const answers = leitnerState.answers;

  // Auto-sync integration
  const { syncNow, isInitialSyncComplete } = useSync();

  // Trigger sync when session completes
  useEffect(() => {
    if (leitnerState.isSessionComplete) {
      console.log('🎯 Session complete - triggering auto-sync');
      syncNow();
    }
  }, [leitnerState.isSessionComplete, syncNow]);

  if (loading || !isInitialSyncComplete) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-destructive'>
            Error Loading Quiz Data
          </h1>
          <p className='text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className='via-background-secondary to-background-tertiary min-h-screen bg-gradient-to-br from-background'>
      <Header isVisible={isHeaderVisible} />
      <DailyBrief questions={questions} />

      <main className='container mx-auto px-2 py-2'>
        <div className='mx-auto max-w-4xl'>
          {/* Quiz Card - Primary Focus */}
          <AnimatePresence mode='wait'>
            {/* Session Complete State - Show results when all questions done */}
            {leitnerState.isSessionComplete &&
            leitnerState.sessionResults &&
            leitnerState.stats ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: ANIMATION_DURATIONS.CARD_TRANSITION,
                  ease: ANIMATION_EASINGS.EASE_OUT_QUART,
                }}
              >
                <SessionResults
                  sessionResults={leitnerState.sessionResults}
                  stats={leitnerState.stats}
                  onStartNewSession={leitnerState.actions.startNewSession}
                  topics={topics}
                />
              </motion.div>
            ) : leitnerState.isLoadingSession ? (
              // Show loading state while session is being initialized
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='flex h-[600px] items-center justify-center'
              >
                <div className='text-center'>
                  <div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
                  <p className='text-muted-foreground'>Loading session...</p>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: ANIMATION_DURATIONS.CARD_TRANSITION,
                  ease: ANIMATION_EASINGS.EASE_OUT_QUART,
                }}
              >
                <LeitnerQuizCard
                  question={currentQuestion}
                  selectedAnswers={answers[currentQuestion.id] || []}
                  onAnswerSelect={leitnerState.actions.updateAnswers}
                  onAnswerSubmit={leitnerState.actions.submitAnswer}
                  onNext={() => {
                    leitnerState.actions.nextQuestion();
                  }}
                  onPrevious={() => {
                    leitnerState.actions.previousQuestion();
                  }}
                  canGoNext={
                    currentQuestionIndex < filteredQuestions.length - 1
                  }
                  canGoPrevious={currentQuestionIndex > 0}
                  // Pass additional props for contextual controls
                  topics={topics}
                  selectedTopic={null}
                  onTopicChange={() => {}}
                  stats={leitnerState.stats}
                  questionProgress={leitnerState.getQuestionProgress(
                    currentQuestion.id
                  )}
                  getSubmissionState={leitnerState.actions.getSubmissionState}
                  // 🎯 Session control props
                  sessionProgress={leitnerState.sessionProgress}
                  onEndSession={leitnerState.actions.endCurrentSession}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='py-20 text-center'
              >
                <div className='space-y-6'>
                  <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                    <span className='text-2xl'>🎯</span>
                  </div>
                  <div>
                    <h2 className='mb-2 text-xl font-semibold'>
                      All Questions Complete!
                    </h2>
                    <p className='text-muted-foreground'>
                      No questions are due for review right now. Great job!
                    </p>
                  </div>

                  {leitnerState.stats && (
                    <DashboardStats
                      stats={leitnerState.stats}
                      section='compact'
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
