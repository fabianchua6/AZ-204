'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { Header } from '@/components/header';
import { LeitnerQuizCard } from '@/components/leitner-quiz-card';
import { TopicSelector } from '@/components/topic-selector';
import { MobileProgress } from '@/components/mobile-progress';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizStateWithLeitner } from '@/hooks/use-quiz-state-leitner';

export default function Home() {
  const { questions, topics, loading, error } = useQuizData();
  const {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions,
  } = useQuizStateWithLeitner(questions);

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
          {/* Progress Bar - Always at top, minimal on mobile, more detailed on desktop */}
          {currentQuestion && (
            <>
              {/* Mobile Progress */}
              <div className='block lg:hidden'>
                <MobileProgress
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={filteredQuestions.length}
                  stats={{
                    totalQuestions: stats.totalQuestions,
                    answeredQuestions: stats.answeredQuestions,
                    correctAnswers: stats.correctAnswers,
                    incorrectAnswers: stats.incorrectAnswers,
                    accuracy: stats.accuracy,
                  }}
                />
              </div>

              {/* Desktop Progress */}
              <div className='mb-6 hidden lg:block'>
                <div className='rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Target className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm font-medium'>
                        Question {currentQuestionIndex + 1} of{' '}
                        {filteredQuestions.length}
                      </span>
                    </div>
                    {stats.answeredQuestions > 0 && (
                      <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <span>{stats.leitner.dueToday} due today</span>
                        <span>
                          {Math.round(stats.leitner.accuracyRate * 100)}%
                          accuracy
                        </span>
                        <span>{stats.leitner.streakDays} day streak</span>
                      </div>
                    )}
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <motion.div
                      className='h-full rounded-full bg-primary'
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%`,
                      }}
                      transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quiz Card - Primary Focus */}
          <AnimatePresence mode='wait'>
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: 0.2,
                  ease: [0.23, 1, 0.32, 1], // easeOutQuart for more natural feel
                }}
              >
                <LeitnerQuizCard
                  question={currentQuestion}
                  selectedAnswers={answers[currentQuestion.id] || []}
                  onAnswerSelect={actions.updateAnswers}
                  onAnswerSubmit={actions.submitAnswer}
                  onNext={actions.nextQuestion}
                  onPrevious={actions.previousQuestion}
                  canGoNext={
                    currentQuestionIndex < filteredQuestions.length - 1
                  }
                  canGoPrevious={currentQuestionIndex > 0}
                  // Pass additional props for contextual controls
                  topics={topics}
                  selectedTopic={selectedTopic}
                  onTopicChange={actions.setSelectedTopic}
                  stats={stats}
                  questionProgress={actions.getQuestionProgress(
                    currentQuestion.id
                  )}
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
                      Ready to start?
                    </h2>
                    <p className='text-muted-foreground'>
                      Choose a topic to begin your AZ-204 practice
                    </p>
                  </div>
                  <TopicSelector
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={actions.setSelectedTopic}
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
