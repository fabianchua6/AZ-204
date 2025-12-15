'use client';

// React imports
import { useEffect, useState } from 'react';

// Third-party imports
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle, Target, Sparkles } from 'lucide-react';

// UI component imports
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Utility imports
import { triggerHaptic } from '@/lib/haptics';

interface QuizCompletionCelebrationProps {
  isVisible: boolean;
  stats: {
    answeredQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  onContinue: () => void;
  onViewProgress: () => void;
}

export function QuizCompletionCelebration({
  isVisible,
  stats,
  onContinue,
  onViewProgress,
}: QuizCompletionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger celebration haptic when modal appears
      triggerHaptic('success');
      const timer = setTimeout(() => setShowConfetti(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <Card className='relative w-full max-w-md overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20'>
              {/* Confetti Effect */}
              {showConfetti && (
                <div className='pointer-events-none absolute inset-0'>
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className='absolute h-2 w-2 rounded-full bg-yellow-400'
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                      }}
                      animate={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                        scale: [1, 0],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>
              )}

              <CardContent className='relative z-10 p-8 text-center'>
                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', duration: 0.6 }}
                  className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                >
                  <Trophy className='h-10 w-10' />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='mb-4 text-2xl font-bold text-green-800 dark:text-green-200'
                >
                  🎉 Congratulations!
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className='mb-6 text-green-700 dark:text-green-300'
                >
                  You've completed your 60-question target! You're well on your
                  way to mastering AZ-204.
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className='mb-8 grid grid-cols-2 gap-4'
                >
                  <div className='rounded-lg bg-white/50 p-4 dark:bg-black/20'>
                    <div className='mb-2 flex items-center justify-center gap-2'>
                      <Target className='h-4 w-4 text-green-600' />
                      <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                        Questions
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-green-800 dark:text-green-200'>
                      {stats.answeredQuestions}
                    </div>
                  </div>
                  <div className='rounded-lg bg-white/50 p-4 dark:bg-black/20'>
                    <div className='mb-2 flex items-center justify-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                        Accuracy
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-green-800 dark:text-green-200'>
                      {Math.round(stats.accuracy)}%
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className='space-y-3'
                >
                  <Button
                    onClick={onContinue}
                    className='w-full bg-green-600 text-white hover:bg-green-700'
                    size='lg'
                  >
                    <Sparkles className='mr-2 h-4 w-4' />
                    Continue Learning
                  </Button>
                  <Button
                    onClick={onViewProgress}
                    variant='outline'
                    className='w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20'
                  >
                    View Progress
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
