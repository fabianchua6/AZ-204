'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TopicSelector } from '@/components/topic-selector';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/constants';
import type { QuizStats } from '@/types/quiz';

interface QuizControlsProps {
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  totalQuestions: number;
  stats: QuizStats;
  leitnerStats?: {
    dueToday: number;
    streakDays: number;
  };
}

export function QuizControls({
  topics,
  selectedTopic,
  onTopicChange,
  totalQuestions,
  stats,
  leitnerStats,
}: QuizControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const progressPercentage =
    (stats.answeredQuestions / stats.totalQuestions) * 100;

  return (
    <Card className='dark:border-border-light border border-border bg-card shadow-sm dark:shadow-sm'>
      {/* Always Visible Progress Bar - Mobile Style */}
      <div className='w-full rounded-t-xl bg-card/80 p-3 backdrop-blur-sm'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <Target className='h-3 w-3' />
              <span className='font-mono'>
                {stats.answeredQuestions}/{stats.totalQuestions}
              </span>
            </div>
            <div className='flex items-center gap-3'>
              {leitnerStats && (
                <span className='flex items-center gap-1'>
                  <span
                    className={
                      leitnerStats.dueToday > 0
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }
                  >
                    {leitnerStats.dueToday > 0
                      ? `${leitnerStats.dueToday} left`
                      : 'Good job 🥳'}
                  </span>
                </span>
              )}
              {leitnerStats && leitnerStats.streakDays > 0 && (
                <span className='flex items-center gap-0.5'>
                  <span>🔥</span>
                  <span>{leitnerStats.streakDays}</span>
                </span>
              )}
            </div>
          </div>
          <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
            <motion.div
              className='h-full rounded-full bg-primary'
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{
                duration: ANIMATION_DURATIONS.PROGRESS_ANIMATION,
                ease: ANIMATION_EASINGS.EASE_OUT_CUBIC,
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='overflow-hidden'
          >
            <CardContent className='p-4 pt-0'>
              <div className='space-y-4'>
                <div>
                  <label className='mb-2 block text-sm font-medium'>
                    Topic Filter
                  </label>
                  <TopicSelector
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={onTopicChange}
                    questionCount={totalQuestions}
                    compact={true}
                  />
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Progress</span>
                    <span className='font-medium text-foreground'>
                      {stats.answeredQuestions} / {stats.totalQuestions}
                    </span>
                  </div>
                  <div className='h-2 w-full rounded-full border border-border/50 bg-muted'>
                    <div
                      className='h-2 rounded-full bg-primary transition-all duration-300 ease-out'
                      style={{
                        width: `${Math.round(
                          (stats.answeredQuestions / stats.totalQuestions) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>Correct: {stats.correctAnswers}</span>
                    <span>
                      Accuracy:{' '}
                      {stats.answeredQuestions > 0
                        ? Math.round(
                            (stats.correctAnswers / stats.answeredQuestions) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
