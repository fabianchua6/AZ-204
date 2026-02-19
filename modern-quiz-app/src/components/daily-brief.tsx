'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Clock, BookOpen } from 'lucide-react';
import { leitnerSystem } from '@/lib/leitner';
import type { LeitnerStats } from '@/lib/leitner';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface DailyBriefProps {
  questions: Question[];
}

export function DailyBrief({ questions }: DailyBriefProps) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<LeitnerStats | null>(null);

  useEffect(() => {
    if (questions.length === 0) return;

    const today = toLocalDateStr(new Date());
    const lastShown = loadFromLocalStorage<string>(
      'daily-brief-last-shown',
      ''
    );

    if (lastShown === today) return;

    leitnerSystem.ensureInitialized().then(() => {
      const s = leitnerSystem.getStats(questions);
      setStats(s);
      setOpen(true);
    });
  }, [questions]);

  const handleDismiss = () => {
    saveToLocalStorage('daily-brief-last-shown', toLocalDateStr(new Date()));
    setOpen(false);
  };

  if (!stats) return null;

  const box1 = stats.boxDistribution[1] || 0;
  const box2 = stats.boxDistribution[2] || 0;
  const box3 = stats.boxDistribution[3] || 0;
  const boxTotal = box1 + box2 + box3 || 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key='backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]'
            onClick={handleDismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key='sheet'
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className='fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-border bg-card shadow-xl'
          >
            {/* Drag handle */}
            <div
              className='flex shrink-0 cursor-pointer justify-center pb-2 pt-3'
              onClick={handleDismiss}
              role='button'
              aria-label='Close daily brief'
            >
              <div className='h-1 w-10 rounded-full bg-muted-foreground/25' />
            </div>

            {/* Scrollable content */}
            <div className='flex-1 overflow-y-auto px-5 pb-10'>
              {/* Greeting */}
              <div className='mb-5 flex items-start justify-between'>
                <div>
                  <h2 className='text-xl font-semibold text-foreground'>
                    {getGreeting()}
                  </h2>
                  <p className='mt-0.5 text-sm text-muted-foreground'>
                    Here&apos;s your study brief
                  </p>
                </div>
                {stats.streakDays > 0 && (
                  <span className='flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'>
                    <Flame className='h-3.5 w-3.5' />
                    {stats.streakDays}d
                  </span>
                )}
              </div>

              {/* 2×2 stat grid */}
              <div className='mb-5 grid grid-cols-2 gap-3'>
                <div className='rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/10'>
                  <div className='flex items-center gap-1.5 text-amber-600 dark:text-amber-400'>
                    <Clock className='h-3.5 w-3.5' />
                    <span className='text-xs font-medium'>Due Today</span>
                  </div>
                  <p className='mt-2 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300'>
                    {stats.dueToday}
                  </p>
                </div>

                <div className='rounded-xl border border-violet-200/60 bg-violet-50/60 p-3 dark:border-violet-500/20 dark:bg-violet-500/10'>
                  <div className='flex items-center gap-1.5 text-violet-600 dark:text-violet-400'>
                    <Target className='h-3.5 w-3.5' />
                    <span className='text-xs font-medium'>Accuracy</span>
                  </div>
                  <p className='mt-2 text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300'>
                    {Math.round(stats.accuracyRate * 100)}%
                  </p>
                </div>

                <div className='rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10'>
                  <div className='flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                    <Target className='h-3.5 w-3.5' />
                    <span className='text-xs font-medium'>Mastered</span>
                  </div>
                  <p className='mt-2 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300'>
                    {box3}
                  </p>
                </div>

                <div className='rounded-xl border border-blue-200/60 bg-blue-50/60 p-3 dark:border-blue-500/20 dark:bg-blue-500/10'>
                  <div className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400'>
                    <BookOpen className='h-3.5 w-3.5' />
                    <span className='text-xs font-medium'>Started</span>
                  </div>
                  <p className='mt-2 text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300'>
                    {stats.questionsStarted}
                  </p>
                </div>
              </div>

              {/* Box distribution */}
              <div className='mb-5'>
                <p className='mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                  Leitner Boxes
                </p>
                <div className='space-y-2'>
                  {([1, 2, 3] as const).map(box => {
                    const count = stats.boxDistribution[box] || 0;
                    const pct = Math.round((count / boxTotal) * 100);
                    const barColor =
                      box === 1
                        ? 'bg-red-400 dark:bg-red-500'
                        : box === 2
                          ? 'bg-amber-400 dark:bg-amber-500'
                          : 'bg-emerald-400 dark:bg-emerald-500';
                    return (
                      <div key={box} className='flex items-center gap-3'>
                        <span className='w-3 shrink-0 text-center text-xs font-medium text-muted-foreground'>
                          {box}
                        </span>
                        <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60'>
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className='w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground'>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Heatmap */}
              <div>
                <p className='mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                  Activity
                </p>
                <ActivityHeatmap compact />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
