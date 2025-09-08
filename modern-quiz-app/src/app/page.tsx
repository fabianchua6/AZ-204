'use client';

// React imports
import { useState, useEffect, useCallback } from 'react';

// Third-party imports
import { motion, AnimatePresence } from 'framer-motion';

// Component imports
import { Header } from '@/components/header';
import { LeitnerQuizCard } from '@/components/leitner-quiz-card';
import { QuizCard } from '@/components/quiz-card';
import { TopicSelector } from '@/components/topic-selector';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { LeitnerBoxDistribution } from '@/components/leitner-box-distribution';

// Hook imports
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizStateWithLeitner } from '@/hooks/use-quiz-state-leitner';
import { useQuizState } from '@/hooks/use-quiz-state';

// Utility imports
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/constants';

export default function Home() {
  const { questions, topics, loading, error } = useQuizData();

  // Shared topic state - this is the single source of truth
  const [selectedTopic, setSelectedTopicState] = useState<string | null>(null);

  // Set dynamic page title based on selected topic
  useEffect(() => {
    if (selectedTopic) {
      document.title = `${selectedTopic} Quiz - AZ-204 Certification`;
    } else {
      document.title = 'Practice Quiz - AZ-204 Certification';
    }
  }, [selectedTopic]);

  // Load saved topic state
  useEffect(() => {
    const savedTopic = loadFromLocalStorage('quiz-topic', null);
    setSelectedTopicState(savedTopic);
  }, []);

  // Save topic changes
  useEffect(() => {
    saveToLocalStorage('quiz-topic', selectedTopic);
  }, [selectedTopic]);

  // Stable topic setter to avoid re-renders
  const setSelectedTopic = useCallback((topic: string | null) => {
    setSelectedTopicState(topic);
  }, []);

  // Use different hooks based on mode, passing the shared topic state
  const leitnerState = useQuizStateWithLeitner(
    questions,
    selectedTopic,
    setSelectedTopic
  );
  const practiceState = useQuizState(
    questions,
    selectedTopic,
    setSelectedTopic
  );

  // Determine which mode to use based on selected topic
  const isLeitnerMode = selectedTopic === null;

  // Reset question index when switching between modes or topics - only when mode/topic actually changes
  useEffect(() => {
    if (isLeitnerMode) {
      leitnerState.actions.goToQuestion(0);
    } else {
      practiceState.actions.goToQuestion(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeitnerMode, selectedTopic]);

  // Get current state based on mode
  const currentState = isLeitnerMode ? leitnerState : practiceState;
  const currentQuestionIndex = currentState.currentQuestionIndex;
  const filteredQuestions = currentState.filteredQuestions;
  const answers = currentState.answers;

  if (loading) {
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
      <Header />

      <main className='container mx-auto px-4 py-6'>
        <div className='mx-auto max-w-4xl'>
          {/* Quiz Card - Primary Focus */}
          <AnimatePresence mode='wait'>
            {/* Session Complete State - Show results when all 20 questions done */}
            {isLeitnerMode &&
            leitnerState.isSessionComplete &&
            leitnerState.sessionResults ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: ANIMATION_DURATIONS.CARD_TRANSITION,
                  ease: ANIMATION_EASINGS.EASE_OUT_QUART,
                }}
              >
                {/* Session Results Card - Same structure as quiz cards */}
                <div className='space-y-4'>
                  {/* Contextual Toolbar */}
                  <QuizControls
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={setSelectedTopic}
                    totalQuestions={leitnerState.stats.totalQuestions}
                    stats={{
                      totalQuestions: leitnerState.stats.totalQuestions,
                      answeredQuestions: leitnerState.stats.answeredQuestions,
                      correctAnswers: leitnerState.stats.correctAnswers,
                      incorrectAnswers: leitnerState.stats.incorrectAnswers,
                      accuracy: leitnerState.stats.accuracy,
                    }}
                    leitnerStats={{
                      dueToday: leitnerState.stats.leitner.dueToday,
                      streakDays: leitnerState.stats.leitner.streakDays,
                    }}
                  />

                  {/* Main Results Card */}
                  <Card className='relative border border-border bg-card shadow-sm dark:shadow-sm'>
                    {/* Header */}
                    <CardHeader className='px-4 pb-3 pt-4 sm:pt-6'>
                      <div className='flex items-center justify-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20'>
                          <span className='text-2xl'>🎉</span>
                        </div>
                        <div className='text-center'>
                          <h2 className='text-xl font-bold'>
                            Session Complete!
                          </h2>
                          <p className='text-sm text-muted-foreground'>
                            {leitnerState.sessionResults.total} questions
                            completed
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Results Content */}
                    <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
                      {/* Main Stats - Simple attempts/correct/wrong */}
                      <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                            {leitnerState.sessionResults.total}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Total Attempts
                          </div>
                        </div>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                            {leitnerState.sessionResults.correct}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Correct
                          </div>
                        </div>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                            {leitnerState.sessionResults.total - leitnerState.sessionResults.correct}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Wrong
                          </div>
                        </div>
                      </div>

                      {/* Box distribution - Use dedicated component */}
                      <div className='mb-6'>
                        <LeitnerBoxDistribution questions={questions} />
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => leitnerState.actions.startNewSession()}
                        size='lg'
                        className='w-full'
                      >
                        {leitnerState.stats.leitner.dueToday > 0
                          ? `Continue Learning (${leitnerState.stats.leitner.dueToday} left)`
                          : 'Start New Session'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: ANIMATION_DURATIONS.CARD_TRANSITION,
                  ease: ANIMATION_EASINGS.EASE_OUT_QUART, // easeOutQuart for more natural feel
                }}
              >
                {isLeitnerMode ? (
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
                    selectedTopic={selectedTopic}
                    onTopicChange={setSelectedTopic}
                    stats={leitnerState.stats}
                    questionProgress={leitnerState.getQuestionProgress(
                      currentQuestion.id
                    )}
                    getSubmissionState={leitnerState.actions.getSubmissionState}
                    // 🎯 Session control props
                    sessionProgress={leitnerState.sessionProgress}
                    onEndSession={leitnerState.actions.endCurrentSession}
                  />
                ) : (
                  <QuizCard
                    question={currentQuestion}
                    selectedAnswers={answers[currentQuestion.id] || []}
                    showAnswer={practiceState.showAnswer}
                    onAnswerSelect={practiceState.actions.setAnswer}
                    onShowAnswer={practiceState.actions.toggleShowAnswer}
                    onNext={() => {
                      practiceState.actions.nextQuestion();
                    }}
                    onPrevious={() => {
                      practiceState.actions.previousQuestion();
                    }}
                    canGoNext={
                      currentQuestionIndex < filteredQuestions.length - 1
                    }
                    canGoPrevious={currentQuestionIndex > 0}
                    // Pass additional props for contextual controls
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={setSelectedTopic}
                    stats={practiceState.stats}
                  />
                )}
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
                      {isLeitnerMode
                        ? 'All Questions Complete!'
                        : 'Ready to start?'}
                    </h2>
                    <p className='text-muted-foreground'>
                      {isLeitnerMode
                        ? 'No questions are due for review right now. Great job!'
                        : 'Choose a topic to begin your AZ-204 practice'}
                    </p>
                  </div>

                  {/* Show stats when in Leitner mode */}
                  {isLeitnerMode && leitnerState.stats && (
                    <div className='mx-auto max-w-2xl'>
                      <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-primary'>
                            {leitnerState.stats.leitner.questionsStarted}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Questions Started
                          </div>
                        </div>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-green-600'>
                            {leitnerState.stats.leitner.accuracyRate.toFixed(0)}
                            %
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Accuracy Rate
                          </div>
                        </div>
                        <div className='rounded-lg border bg-card p-4'>
                          <div className='text-2xl font-bold text-blue-600'>
                            {leitnerState.stats.leitner.streakDays}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Day Streak
                          </div>
                        </div>
                      </div>

                      {/* Box distribution */}
                      <div className='rounded-lg border bg-card p-4'>
                        <h3 className='mb-3 font-medium'>Progress by Box</h3>
                        <div className='grid grid-cols-3 gap-3 text-sm'>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-red-600'>
                              {leitnerState.stats.leitner.boxDistribution[1] ||
                                0}
                            </div>
                            <div className='text-muted-foreground'>
                              Box 1 (New)
                            </div>
                          </div>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-yellow-600'>
                              {leitnerState.stats.leitner.boxDistribution[2] ||
                                0}
                            </div>
                            <div className='text-muted-foreground'>
                              Box 2 (Learning)
                            </div>
                          </div>
                          <div className='text-center'>
                            <div className='text-lg font-bold text-green-600'>
                              {leitnerState.stats.leitner.boxDistribution[3] ||
                                0}
                            </div>
                            <div className='text-muted-foreground'>
                              Box 3 (Mastered)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Topic selector for practice mode only */}
                  {!isLeitnerMode && (
                    <TopicSelector
                      topics={topics}
                      selectedTopic={selectedTopic}
                      onTopicChange={setSelectedTopic}
                      questionCount={filteredQuestions.length}
                      compact={false}
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
