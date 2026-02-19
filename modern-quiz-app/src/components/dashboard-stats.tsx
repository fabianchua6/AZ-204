'use client';

// React imports
import { useEffect, useState } from 'react';

// Third-party imports
import { motion } from 'framer-motion';
import { Calendar, Flame, Target, Clock } from 'lucide-react';

// UI component imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeitnerBoxBar } from '@/components/leitner/leitner-box-bar';

// Service and utility imports
import { questionService } from '@/lib/question-service';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import { DateUtils } from '@/lib/leitner/utils';

// Type imports
import type { Question } from '@/types/quiz';
import type { LeitnerStats } from '@/lib/leitner';

interface DashboardStatsProps {
  /** For async fetch mode (dashboard page) — provide questions to compute stats */
  questions?: Question[];
  /** For pre-computed mode (main page fallback) — provide stats directly */
  stats?: { leitner: LeitnerStats };
  /** 'stats' = cards only, 'leitner' = box bar only, 'compact' = simple 3-stat + box grid, default = both */
  section?: 'stats' | 'leitner' | 'compact';
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

export function DashboardStats({
  questions,
  stats: precomputedStats,
  section,
}: DashboardStatsProps) {
  const [initialized, setInitialized] = useState(false);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [studyStreak, setStudyStreak] = useState<StudyStreak>({
    currentStreak: 0,
    lastStudyDate: null,
    bestStreak: 0,
  });

  // --- Pre-computed mode (compact) ---
  // When `stats` prop is provided, skip the async fetch entirely
  const isPrecomputed = !!precomputedStats;

  // Initialize and load stats from centralized service (async fetch mode)
  useEffect(() => {
    if (isPrecomputed || !questions) return;

    const init = async () => {
      const stats = await questionService.getAppStatistics(questions);
      setAppStats(stats);
      setInitialized(true);
    };

    init();
  }, [questions, isPrecomputed]);

  // Derive streak from Leitner system's robust calculation (based on actual
  // lastReviewed dates across all progress) and persist to study-streak key
  // so it syncs across devices.
  useEffect(() => {
    if (!initialized || !appStats) return;

    // streakDays is computed by AlgorithmUtils.calculateStreakDays which walks
    // backwards through the last 30 days checking actual question review dates
    const leitnerStreak = appStats.streakDays;

    const stored = loadFromLocalStorage<StudyStreak>('study-streak', {
      currentStreak: 0,
      lastStudyDate: null,
      bestStreak: 0,
    });

    const today = DateUtils.getLocalDateString(new Date()); // YYYY-MM-DD
    const newBestStreak = Math.max(leitnerStreak, stored.bestStreak);

    const updatedStreak: StudyStreak = {
      currentStreak: leitnerStreak,
      lastStudyDate: today,
      bestStreak: newBestStreak,
    };

    setStudyStreak(updatedStreak);
    saveToLocalStorage('study-streak', updatedStreak);
  }, [initialized, appStats]);

  // --- Compact mode (pre-computed stats from parent) ---
  if (section === 'compact' && precomputedStats) {
    const leitner = precomputedStats.leitner;
    return (
      <div className='mx-auto max-w-2xl'>
        <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-lg border bg-card p-4'>
            <div className='text-2xl font-bold text-primary'>
              {leitner.questionsStarted}
            </div>
            <div className='text-sm text-muted-foreground'>
              Questions Started
            </div>
          </div>
          <div className='rounded-lg border bg-card p-4'>
            <div className='text-2xl font-bold text-success dark:text-emerald-400'>
              {leitner.accuracyRate.toFixed(0)}%
            </div>
            <div className='text-sm text-muted-foreground'>Accuracy Rate</div>
          </div>
          <div className='rounded-lg border bg-card p-4'>
            <div className='text-2xl font-bold text-primary dark:text-blue-400'>
              {leitner.streakDays}
            </div>
            <div className='text-sm text-muted-foreground'>Day Streak</div>
          </div>
        </div>

        {/* Box distribution */}
        <div className='rounded-lg border bg-card p-4'>
          <h3 className='mb-3 font-medium'>Progress by Box</h3>
          <div className='grid grid-cols-3 gap-3 text-sm'>
            <div className='text-center'>
              <div className='text-lg font-bold text-destructive dark:text-red-400'>
                {leitner.boxDistribution[1] || 0}
              </div>
              <div className='text-muted-foreground'>Box 1 (New)</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-warning dark:text-amber-400'>
                {leitner.boxDistribution[2] || 0}
              </div>
              <div className='text-muted-foreground'>Box 2 (Learning)</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-success dark:text-emerald-400'>
                {leitner.boxDistribution[3] || 0}
              </div>
              <div className='text-muted-foreground'>Box 3 (Mastered)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const statsGrid = (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4'>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={`h-full ${stat.bgColor} border-0 shadow-sm backdrop-blur-sm`}
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
  );

  const leitnerSection = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className='space-y-3'
    >
      <h2 className='text-base font-semibold tracking-wide text-muted-foreground'>
        Leitner Box Distribution
      </h2>
      <LeitnerBoxBar
        boxDistribution={appStats.boxDistribution}
        totalQuestions={appStats.totalQuestions}
      />
    </motion.div>
  );

  if (section === 'stats') return statsGrid;
  if (section === 'leitner') return leitnerSection;

  return (
    <div className='space-y-8'>
      {statsGrid}
      {leitnerSection}
    </div>
  );
}
