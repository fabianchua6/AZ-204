'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  topics,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedTopic,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTopicChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalQuestions,
  stats,
  leitnerStats,
}: QuizControlsProps) {
  const progressPercentage =
    (stats.answeredQuestions / stats.totalQuestions) * 100;

  return (
    <>
      {/* Compact inline progress bar - NOT fixed, flows with content */}
      <div className="mb-4 rounded-xl border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm">
        <div className='w-full p-3'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Target className='h-3 w-3' />
                <span className='font-mono font-medium'>
                  {stats.answeredQuestions}/{stats.totalQuestions}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                {leitnerStats && (
                  <span className={leitnerStats.dueToday > 0 ? 'text-orange-500' : 'text-green-500'}>
                    {leitnerStats.dueToday > 0 ? `${leitnerStats.dueToday} left` : '✓ Done'}
                  </span>
                )}
                {leitnerStats && leitnerStats.streakDays > 0 && (
                  <span className='flex items-center gap-0.5'>
                    🔥 {leitnerStats.streakDays}
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
      </div>
    </>
  );
}
