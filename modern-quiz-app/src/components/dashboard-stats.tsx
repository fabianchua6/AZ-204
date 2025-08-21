'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, Flame, Target, Clock } from 'lucide-react';
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

      {/* Compact Box Distribution Subsection (no full card) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='space-y-3'
      >
        <h2 className='text-base font-semibold tracking-wide text-muted-foreground'>
          Leitner Box Distribution
        </h2>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
          {Object.entries(appStats.boxDistribution).map(([box, count]) => {
            const boxNumber = parseInt(box);
            const questionCount = count as number;
            const percentage =
              Math.round((questionCount / appStats.totalQuestions) * 100) || 0;

            const getBoxColors = (boxNum: number) => {
              switch (boxNum) {
                case 1:
                  return 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500';
                case 2:
                  return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-400/50';
                case 3:
                  return 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-200 border-sky-200 dark:border-sky-400/50';
                case 4:
                  return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-400/50';
                case 5:
                  return 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-200 border-violet-200 dark:border-violet-400/50';
                default:
                  return 'bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500';
              }
            };

            const colors = getBoxColors(boxNumber);

            return (
              <div
                key={box}
                className={`relative flex flex-col items-center justify-between rounded-md border p-2 text-center transition-colors ${colors}`}
              >
                <div className='flex items-center gap-1 text-[10px] font-semibold'>
                  <Package className='h-3 w-3 opacity-70' />
                  <span>{box}</span>
                </div>
                <div className='mt-1 text-sm font-bold leading-none'>
                  {questionCount}
                </div>
                <div className='mt-1 text-[10px] tabular-nums opacity-60'>
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
