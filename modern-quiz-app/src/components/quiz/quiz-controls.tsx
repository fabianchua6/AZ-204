'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicSelector } from '@/components/topic-selector';
import type { QuizStats } from '@/types/quiz';

interface QuizControlsProps {
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  totalQuestions: number;
  stats: QuizStats;
}

export function QuizControls({
  topics,
  selectedTopic,
  onTopicChange,
  totalQuestions,
  stats,
}: QuizControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className='bg-card border border-border shadow-md dark:shadow-lg dark:shadow-black/10 dark:border-border-light'>
      {/* Collapsed Header */}
      <div
        className='flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/30 dark:hover:bg-muted/20 rounded-t-lg'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>
              {selectedTopic || 'All Topics'}
            </span>
          </div>
          <div className='h-4 w-px bg-border' />
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Target className='h-3 w-3' />
            <span>
              {stats.answeredQuestions}/{stats.totalQuestions}
            </span>
            <span>
              (
              {Math.round(
                (stats.answeredQuestions / stats.totalQuestions) * 100
              )}
              %)
            </span>
          </div>
        </div>

        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
          {isExpanded ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </Button>
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
