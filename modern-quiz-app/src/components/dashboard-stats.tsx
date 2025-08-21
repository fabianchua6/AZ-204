'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { questionService } from '@/lib/question-service';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
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

  // Use centralized stats instead of manual calculations
  const masteredQuestions =
    (appStats.boxDistribution[4] || 0) + (appStats.boxDistribution[5] || 0);
  const masteryPercentage = Math.round(
    (masteredQuestions / appStats.totalQuestions) * 100
  );

  const stats = [
    {
      title: 'Due Today',
      value: appStats.dueToday.toString(),
      icon: Clock,
      description: 'Questions ready for review',
      bgColor: 'bg-amber-50 dark:bg-amber-500/15',
      textColor: 'text-amber-700 dark:text-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Current Streak',
      value: `${studyStreak.currentStreak} days`,
      icon: Flame,
      description: 'Consecutive study days',
      bgColor: 'bg-orange-50 dark:bg-orange-500/15',
      textColor: 'text-orange-700 dark:text-orange-200',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Best Streak',
      value: `${studyStreak.bestStreak} days`,
      icon: Target,
      description: 'Your longest study streak',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/15',
      textColor: 'text-emerald-700 dark:text-emerald-200',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Mastery Progress',
      value: `${masteryPercentage}%`,
      icon: Target,
      description: `${masteredQuestions} questions in boxes 4-5`,
      bgColor: 'bg-violet-50 dark:bg-violet-500/15',
      textColor: 'text-violet-700 dark:text-violet-200',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Questions Started',
      value: appStats.questionsStarted.toString(),
      icon: Calendar,
      description: `Out of ${appStats.totalQuestions} total questions`,
      bgColor: 'bg-blue-50 dark:bg-blue-500/15',
      textColor: 'text-blue-700 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Accuracy Rate',
      value: `${Math.round(appStats.accuracyRate * 100)}%`,
      icon: Target,
      description: 'Overall performance',
      bgColor: 'bg-green-50 dark:bg-green-500/15',
      textColor: 'text-green-700 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
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
            <Card className={`${stat.bgColor} border-0 shadow-sm`}>
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
          {/* Segmented Bar (polished) */}
          <div className='flex w-full overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm dark:bg-background/60'>
            {Object.entries(appStats.boxDistribution).map(([box, count], idx) => {
              const boxNumber = parseInt(box, 10);
              const questionCount = count as number;
              const percentage = appStats.totalQuestions > 0 ? (questionCount / appStats.totalQuestions) * 100 : 0;
              const flexGrow = questionCount > 0 ? questionCount : 0.6;

              const segmentStyles = (() => {
                switch (boxNumber) {
                  case 1:
                    return {
                      fill: 'bg-slate-100 dark:bg-slate-800/70',
                      text: 'text-slate-800 dark:text-slate-100',
                      accent: 'before:bg-slate-400/70 dark:before:bg-slate-500/70'
                    };
                  case 2:
                    return {
                      fill: 'bg-amber-100 dark:bg-amber-700/60',
                      text: 'text-amber-900 dark:text-amber-50',
                      accent: 'before:bg-amber-400/80 dark:before:bg-amber-300/70'
                    };
                  case 3:
                    return {
                      fill: 'bg-sky-100 dark:bg-sky-700/60',
                      text: 'text-sky-900 dark:text-sky-50',
                      accent: 'before:bg-sky-400/80 dark:before:bg-sky-300/70'
                    };
                  case 4:
                    return {
                      fill: 'bg-emerald-100 dark:bg-emerald-700/60',
                      text: 'text-emerald-900 dark:text-emerald-50',
                      accent: 'before:bg-emerald-400/80 dark:before:bg-emerald-300/70'
                    };
                  case 5:
                    return {
                      fill: 'bg-violet-100 dark:bg-violet-700/60',
                      text: 'text-violet-900 dark:text-violet-50',
                      accent: 'before:bg-violet-400/80 dark:before:bg-violet-300/70'
                    };
                  default:
                    return {
                      fill: 'bg-slate-100 dark:bg-slate-800/70',
                      text: 'text-slate-800 dark:text-slate-100',
                      accent: 'before:bg-slate-400/70 dark:before:bg-slate-500/70'
                    };
                }
              })();

              return (
                <div
                  key={box}
                  className={`relative group flex min-w-[54px] flex-col items-center justify-center px-2 py-3 sm:px-3 sm:py-4 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${segmentStyles.fill} ${segmentStyles.text} ${segmentStyles.accent} before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-full before:content-[''] ${idx !== 0 ? 'border-l border-border/40 dark:border-border/30' : ''}`}
                  style={{ flexGrow, flexBasis: `${percentage}%` }}
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
                  <div className='pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity group-hover:opacity-[0.06] group-focus-visible:opacity-[0.10] bg-black dark:bg-white' />
                </div>
              );
            })}
          </div>
          {/* Legend */}
            <div className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
              {Object.entries(appStats.boxDistribution).map(([box, count]) => {
                const boxNumber = parseInt(box, 10);
                const questionCount = count as number;
                const percentage = appStats.totalQuestions > 0 ? Math.round((questionCount / appStats.totalQuestions) * 100) : 0;
                const colorDot = (() => {
                  switch (boxNumber) {
                    case 1: return 'bg-slate-400';
                    case 2: return 'bg-amber-400';
                    case 3: return 'bg-sky-400';
                    case 4: return 'bg-emerald-400';
                    case 5: return 'bg-violet-400';
                    default: return 'bg-slate-400';
                  }
                })();
                return (
                  <div key={box} className='flex items-center gap-1 text-muted-foreground'>
                    <span className={`h-2 w-2 rounded-full ${colorDot}`}></span>
                    <span className='font-medium text-foreground'>{boxNumber}</span>
                    <span className='tabular-nums text-foreground/80'>{questionCount}</span>
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
