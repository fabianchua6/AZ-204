'use client';

// React imports
import { useEffect, useState } from 'react';

// Third-party imports
import { motion } from 'framer-motion';
import { Target, CheckCircle, Clock } from 'lucide-react';

// UI component imports
import { Progress } from '@/components/ui/progress';

interface QuizCompletionProgressProps {
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    leitner: {
      totalQuestions: number;
      boxDistribution: Record<number, number>;
      dueToday: number;
      accuracyRate: number;
      streakDays: number;
    };
  };
  className?: string;
  showDetailed?: boolean;
}

export function QuizCompletionProgress({
  stats,
  className = '',
  showDetailed = false,
}: QuizCompletionProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Calculate completion percentage for 60-question target
  const targetQuestions = 60;
  const actualProgress = Math.min(
    (stats.answeredQuestions / targetQuestions) * 100,
    100
  );
  const isComplete = stats.answeredQuestions >= targetQuestions;

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(actualProgress);
    }, 300);
    return () => clearTimeout(timer);
  }, [actualProgress]);

  const questionsRemaining = Math.max(
    0,
    targetQuestions - stats.answeredQuestions
  );

  if (showDetailed) {
    return (
      <motion.div
        className={`space-y-4 rounded-lg border bg-card p-4 ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Target className='h-5 w-5 text-primary' />
            <h3 className='font-semibold'>Quiz Progress</h3>
          </div>
          {isComplete && (
            <div className='flex items-center gap-1 text-green-600 dark:text-green-400'>
              <CheckCircle className='h-4 w-4' />
              <span className='text-sm font-medium'>Complete!</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              {stats.answeredQuestions} / {targetQuestions} questions
            </span>
            <span
              className={`font-medium ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}
            >
              {Math.round(actualProgress)}%
            </span>
          </div>
          <div className='relative'>
            <Progress value={animatedProgress} className='h-2' />
            {isComplete && (
              <div className='absolute inset-0 h-2 w-full rounded-full bg-green-500/20'>
                <div
                  className='h-full rounded-full bg-green-500 transition-all duration-500'
                  style={{ width: `${animatedProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div className='space-y-1'>
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Clock className='h-3 w-3' />
              <span>Remaining</span>
            </div>
            <div className='font-semibold'>{questionsRemaining} questions</div>
          </div>
          <div className='space-y-1'>
            <div className='text-muted-foreground'>Accuracy</div>
            <div className='font-semibold text-green-600 dark:text-green-400'>
              {Math.round(stats.accuracy)}%
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact version
  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className='flex items-center gap-2 text-sm'>
        <Target className='h-4 w-4 text-primary' />
        <span className='font-medium'>
          {stats.answeredQuestions}/{targetQuestions}
        </span>
        {isComplete && (
          <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
        )}
      </div>
      <div className='min-w-[80px] flex-1'>
        <div className='relative'>
          <Progress value={animatedProgress} className='h-1.5' />
          {isComplete && (
            <div className='absolute inset-0 h-1.5 w-full rounded-full bg-green-500/20'>
              <div
                className='h-full rounded-full bg-green-500 transition-all duration-500'
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <span
        className={`text-sm font-medium ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
      >
        {Math.round(actualProgress)}%
      </span>
    </motion.div>
  );
}
