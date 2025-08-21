'use client';

// React imports
import { useEffect, useState } from 'react';

// Third-party imports
import { motion } from 'framer-motion';
import { Calendar, Flame, Target, Clock } from 'lucide-react';

// UI component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Service and utility imports
import { questionService } from '@/lib/question-service';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

// Type imports
import type { Question } from '@/types/quiz';

interface DashboardStatsProps {
  questions: Question[];
}

interface StudyStreak {
  currentStreak: number;
  lastStudyDate: string | null;
  bestStreak: number;
}

interface AppStats {
  totalQuestions: number;
  questionsStarted: number;
  boxDistribution: Record<number, number>;
  dueToday: number;
  accuracyRate: number;
  streakDays: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completionAccuracy: number;
}

export function DashboardStats({ questions }: DashboardStatsProps) {
  const [initialized, setInitialized] = useState(false);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [studyStreak, setStudyStreak] = useState<StudyStreak>({
    currentStreak: 0,
    lastStudyDate: null,
    bestStreak: 0,
  });

  // Initialize and load stats from centralized service
  useEffect(() => {
    const init = async () => {
      const stats = await questionService.getAppStatistics(questions);
      setAppStats(stats);
      setInitialized(true);

      // Load study streak data
      const streak = loadFromLocalStorage('study-streak', {
        currentStreak: 0,
        lastStudyDate: null,
        bestStreak: 0,
      });
      setStudyStreak(streak);
    };

    init();
  }, [questions]);

  // Update study streak if user has answered questions today
  useEffect(() => {
    if (!initialized || !appStats) return;

    if (appStats.questionsStarted > 0) {
      const today = new Date().toDateString();

      if (studyStreak.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = 1;
        if (studyStreak.lastStudyDate === yesterdayStr) {
          newStreak = studyStreak.currentStreak + 1;
        }

        const newBestStreak = Math.max(newStreak, studyStreak.bestStreak);

        const updatedStreak = {
          currentStreak: newStreak,
          lastStudyDate: today,
          bestStreak: newBestStreak,
        };

        setStudyStreak(updatedStreak);
        saveToLocalStorage('study-streak', updatedStreak);
      }
    }
  }, [initialized, appStats, studyStreak]);

  if (!initialized || !appStats) {
    return (
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='pb-3'>
              <div className='h-4 w-24 rounded bg-muted'></div>
            </CardHeader>
            <CardContent>
              <div className='h-8 w-16 rounded bg-muted'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Use centralized stats instead of manual calculations (3-box system)
  const masteredQuestions = appStats.boxDistribution[3] || 0;
  const masteryPercentage = Math.round(
    (masteredQuestions / appStats.totalQuestions) * 100
  );

  const stats = [
    {
      title: 'Due Today',
      value: appStats.dueToday.toString(),
      icon: Clock,
      description: 'Questions ready for review',
      bgColor: 'bg-amber-50/90 dark:bg-amber-500/10',
      textColor: 'text-amber-800 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Current Streak',
      value: `${studyStreak.currentStreak} days`,
      icon: Flame,
      description: 'Consecutive study days',
      bgColor: 'bg-orange-50/90 dark:bg-orange-500/10',
      textColor: 'text-orange-800 dark:text-orange-300',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Best Streak',
      value: `${studyStreak.bestStreak} days`,
      icon: Target,
      description: 'Your longest study streak',
      bgColor: 'bg-teal-50/90 dark:bg-teal-500/10',
      textColor: 'text-teal-800 dark:text-teal-300',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Mastery Progress',
      value: `${masteryPercentage}%`,
      icon: Target,
      description: `${masteredQuestions} questions in box 3`,
      bgColor: 'bg-emerald-50/90 dark:bg-emerald-500/10',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Questions Started',
      value: appStats.questionsStarted.toString(),
      icon: Calendar,
      description: `Out of ${appStats.totalQuestions} total questions`,
      bgColor: 'bg-blue-50/90 dark:bg-blue-500/10',
      textColor: 'text-blue-800 dark:text-blue-300',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Accuracy Rate',
      value: `${Math.round(appStats.accuracyRate * 100)}%`,
      icon: Target,
      description: 'Overall performance',
      bgColor: 'bg-violet-50/90 dark:bg-violet-500/10',
      textColor: 'text-violet-800 dark:text-violet-300',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Main Stats Grid */}
      <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-3'>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`${stat.bgColor} border-0 shadow-sm backdrop-blur-sm`}
            >
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3'>
                <CardTitle
                  className={`text-xs font-medium sm:text-sm ${stat.textColor}`}
                >
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.iconColor}`}
                />
              </CardHeader>
              <CardContent className='pt-0'>
                <div
                  className={`text-lg font-bold sm:text-2xl ${stat.textColor}`}
                >
                  {stat.value}
                </div>
                <p
                  className={`text-xs ${stat.textColor} mt-1 hidden leading-tight opacity-75 sm:block`}
                >
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Compact Box Distribution Subsection (Option A: Proportional Segmented Bar) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='space-y-3'
      >
        <h2 className='text-base font-semibold tracking-wide text-muted-foreground'>
          Leitner Box Distribution
        </h2>
        <div className='flex flex-col gap-3'>
          {/* Segmented Bar - 3 Box System */}
          <div className='flex w-full overflow-hidden rounded-xl border border-border/60'>
            {[1, 2, 3].map((boxNumber, idx) => {
              const questionCount = appStats.boxDistribution[boxNumber] || 0;
              const percentage =
                appStats.totalQuestions > 0
                  ? (questionCount / appStats.totalQuestions) * 100
                  : 0;
              // Use actual percentage for proportional sizing, with small minimum for visibility
              const flexGrow = questionCount > 0 ? Math.max(percentage, 5) : 1;

              const segmentBgClass = `leitner-box-surface-${boxNumber}`;
              const segmentTextClass = `leitner-box-text-${boxNumber}`;

              return (
                <div
                  key={boxNumber}
                  className={`group relative flex flex-col items-center justify-center px-3 py-4 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${segmentBgClass} ${segmentTextClass} ${idx !== 0 ? 'border-l-2 border-white/20 dark:border-black/20' : ''}`}
                  style={{
                    flexGrow,
                    minWidth: '60px', // Larger minimum width for 3-box system
                    minHeight: '60px',
                  }}
                  tabIndex={0}
                  aria-label={`Box ${boxNumber}: ${questionCount} questions (${percentage.toFixed(1)}%)`}
                  title={`Box ${boxNumber} • ${questionCount} (${percentage.toFixed(1)}%)`}
                >
                  <span className='absolute left-1 top-1 rounded-sm bg-black/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide dark:bg-white/10'>
                    {boxNumber}
                  </span>
                  <span className='text-sm font-semibold tabular-nums sm:text-base'>
                    {questionCount}
                  </span>
                  <div className='pointer-events-none absolute inset-0 rounded-md bg-black opacity-0 transition-opacity group-hover:opacity-[0.06] group-focus-visible:opacity-[0.10] dark:bg-white' />
                </div>
              );
            })}
          </div>
          {/* Legend - 3 Box System */}
          <div className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
            {[1, 2, 3].map(boxNumber => {
              const questionCount = appStats.boxDistribution[boxNumber] || 0;
              const percentage =
                appStats.totalQuestions > 0
                  ? Math.round((questionCount / appStats.totalQuestions) * 100)
                  : 0;
              const dotClass = `leitner-box-dot-${boxNumber}`;
              return (
                <div
                  key={boxNumber}
                  className='flex items-center gap-1 text-muted-foreground'
                >
                  <span className={`h-2 w-2 rounded-full ${dotClass}`}></span>
                  <span className='font-medium text-foreground'>
                    {boxNumber}
                  </span>
                  <span className='tabular-nums text-foreground/80'>
                    {questionCount}
                  </span>
                  <span className='opacity-60'>({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
