'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { LeitnerBoxBar } from '@/components/leitner/leitner-box-bar';
import type { LeitnerStats } from '@/lib/leitner';

interface SessionResultsProps {
  sessionResults: {
    correct: number;
    incorrect: number;
    total: number;
  };
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    leitner: LeitnerStats;
  };
  onStartNewSession: () => void;
  topics?: string[];
}

export function SessionResults({
  sessionResults,
  stats,
  onStartNewSession,
  topics = [],
}: SessionResultsProps) {
  return (
    <div className='space-y-4'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={null}
        onTopicChange={() => {}}
        totalQuestions={stats.totalQuestions}
        stats={{
          totalQuestions: stats.totalQuestions,
          answeredQuestions: stats.answeredQuestions,
          correctAnswers: stats.correctAnswers,
          incorrectAnswers: stats.incorrectAnswers,
          accuracy: stats.accuracy,
        }}
        leitnerStats={{
          dueToday: stats.leitner.dueToday,
          streakDays: stats.leitner.streakDays,
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
              <h2 className='text-xl font-bold'>Session Complete!</h2>
            </div>
          </div>
        </CardHeader>

        {/* Results Content */}
        <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
          {/* Main Stats */}
          <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='rounded-lg border-0 bg-blue-50/90 shadow-sm backdrop-blur-sm dark:bg-blue-500/10'>
              <div className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:pb-3'>
                <div className='text-xs font-medium text-blue-800 dark:text-blue-300 sm:text-sm'>
                  Total Attempts
                </div>
              </div>
              <div className='px-4 pb-4 pt-0'>
                <div className='text-lg font-bold text-blue-800 dark:text-blue-300 sm:text-2xl'>
                  {sessionResults.total}
                </div>
                <p className='mt-1 hidden text-xs leading-tight text-blue-800 opacity-75 dark:text-blue-300 sm:block'>
                  Questions attempted
                </p>
              </div>
            </div>
            <div className='rounded-lg border-0 bg-emerald-50/90 shadow-sm backdrop-blur-sm dark:bg-emerald-500/10'>
              <div className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:pb-3'>
                <div className='text-xs font-medium text-emerald-800 dark:text-emerald-300 sm:text-sm'>
                  Correct
                </div>
              </div>
              <div className='px-4 pb-4 pt-0'>
                <div className='text-lg font-bold text-emerald-800 dark:text-emerald-300 sm:text-2xl'>
                  {sessionResults.correct}
                </div>
                <p className='mt-1 hidden text-xs leading-tight text-emerald-800 opacity-75 dark:text-emerald-300 sm:block'>
                  Right answers
                </p>
              </div>
            </div>
            <div className='rounded-lg border-0 bg-red-50/90 shadow-sm backdrop-blur-sm dark:bg-red-500/10'>
              <div className='flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-4 sm:pb-3'>
                <div className='text-xs font-medium text-red-800 dark:text-red-300 sm:text-sm'>
                  Wrong
                </div>
              </div>
              <div className='px-4 pb-4 pt-0'>
                <div className='text-lg font-bold text-red-800 dark:text-red-300 sm:text-2xl'>
                  {sessionResults.total - sessionResults.correct}
                </div>
                <p className='mt-1 hidden text-xs leading-tight text-red-800 opacity-75 dark:text-red-300 sm:block'>
                  Need review
                </p>
              </div>
            </div>
          </div>

          {/* Box distribution */}
          <div className='mb-6 space-y-3'>
            <h3 className='text-base font-semibold tracking-wide text-muted-foreground'>
              Leitner Box Distribution
            </h3>
            <LeitnerBoxBar
              boxDistribution={stats.leitner.boxDistribution}
              totalQuestions={stats.totalQuestions}
            />
          </div>

          {/* Action Button */}
          <Button onClick={onStartNewSession} size='lg' className='w-full'>
            {stats.leitner.dueToday > 0
              ? `Continue Learning (${stats.leitner.dueToday} left)`
              : 'Start New Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
