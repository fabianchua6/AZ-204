'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { DashboardStats } from '@/components/dashboard-stats';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { useQuizData } from '@/hooks/use-quiz-data';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '@/lib/constants';

export default function DashboardPage() {
  const { questions, loading, error } = useQuizData();

  // Set dynamic page title with question count
  useEffect(() => {
    if (questions.length > 0) {
      document.title = `Analytics Dashboard (${questions.length} Questions) - AZ-204`;
    } else {
      document.title = 'Analytics Dashboard - AZ-204 Certification';
    }
  }, [questions.length]);

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
            Error Loading Dashboard Data
          </h1>
          <p className='text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='via-background-secondary to-background-tertiary min-h-screen bg-gradient-to-br from-background'>
      <Header />

      <main className='container mx-auto px-4 py-6'>
        <div className='mx-auto max-w-6xl'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: ANIMATION_DURATIONS.CARD_TRANSITION,
              ease: ANIMATION_EASINGS.EASE_OUT_QUART,
            }}
          >
            <div className='mb-8'>
              <h1 className='mb-2 text-3xl font-bold text-foreground'>
                Learning Dashboard
              </h1>
              <p className='text-muted-foreground'>
                Track your Leitner System progress and study streaks
              </p>
            </div>

            <DashboardStats questions={questions} />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className='mt-6'
            >
              <ActivityHeatmap />
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
