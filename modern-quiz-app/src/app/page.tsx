'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/header';
import { LeitnerQuizCard } from '@/components/leitner-quiz-card';
import { QuizCard } from '@/components/quiz-card';
import { TopicSelector } from '@/components/topic-selector';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizStateWithLeitner } from '@/hooks/use-quiz-state-leitner';
import { useQuizState } from '@/hooks/use-quiz-state';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/constants';

export default function Home() {
  const { questions, topics, loading, error } = useQuizData();

  // Shared topic state - this is the single source of truth
  const [selectedTopic, setSelectedTopicState] = useState<string | null>(null);

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
  const stats = currentState.stats;

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
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
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
                  />
                ) : (
                  <QuizCard
                    question={currentQuestion}
                    selectedAnswers={answers[currentQuestion.id] || []}
                    showAnswer={practiceState.showAnswer}
                    onAnswerSelect={practiceState.actions.setAnswer}
                    onShowAnswer={practiceState.actions.toggleShowAnswer}
                    onNext={() => {
                      console.debug('[Page] onNext clicked (Practice)');
                      practiceState.actions.nextQuestion();
                    }}
                    onPrevious={() => {
                      console.debug('[Page] onPrevious clicked (Practice)');
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
                      Ready to start?
                    </h2>
                    <p className='text-muted-foreground'>
                      Choose a topic to begin your AZ-204 practice
                    </p>
                  </div>
                  <TopicSelector
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={setSelectedTopic}
                    questionCount={filteredQuestions.length}
                    compact={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
