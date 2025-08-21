'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Clock,
  BookOpen,
  Zap,
  BarChart3,
  Calendar,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  LearningMetrics,
  LearningStrategy,
  SmartQuizSettings,
} from '@/types/learning';

interface LearningDashboardProps {
  metrics: LearningMetrics;
  settings: SmartQuizSettings;
  onSettingsChange: (settings: SmartQuizSettings) => void;
  onStartSession: (strategy?: LearningStrategy) => void;
  className?: string;
}

const STRATEGY_INFO = {
  spaced_repetition: {
    name: 'Spaced Repetition',
    description: 'Focus on due reviews for optimal retention',
    icon: Clock,
    color: 'blue',
  },
  active_recall: {
    name: 'Active Recall',
    description: 'Mix of new questions and struggling areas',
    icon: Brain,
    color: 'purple',
  },
  weak_areas: {
    name: 'Weak Areas',
    description: 'Target your struggling topics',
    icon: AlertTriangle,
    color: 'orange',
  },
  comprehensive: {
    name: 'Comprehensive',
    description: 'Balanced review of all content',
    icon: BookOpen,
    color: 'green',
  },
  quick_review: {
    name: 'Quick Review',
    description: 'Fast session with confident topics',
    icon: Zap,
    color: 'yellow',
  },
} as const;

export function LearningDashboard({
  metrics,
  settings,
  onSettingsChange,
  onStartSession,
  className,
}: LearningDashboardProps) {
  const masteryPercentage = Math.round(
    (metrics.masteredQuestions / metrics.totalQuestions) * 100
  );
  const confidencePercentage = Math.round(metrics.averageConfidence * 100);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Learning Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <div className='rounded-lg bg-primary/5 p-4 text-center'>
              <div className='text-2xl font-bold text-primary'>
                {masteryPercentage}%
              </div>
              <div className='text-sm text-muted-foreground'>Mastered</div>
              <div className='mt-1 text-xs text-muted-foreground'>
                {metrics.masteredQuestions}/{metrics.totalQuestions}
              </div>
            </div>

            <div className='rounded-lg bg-green-50 p-4 text-center dark:bg-green-950/20'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {confidencePercentage}%
              </div>
              <div className='text-sm text-muted-foreground'>Confidence</div>
              <div className='mt-1 text-xs text-muted-foreground'>Average</div>
            </div>

            <div className='rounded-lg bg-orange-50 p-4 text-center dark:bg-orange-950/20'>
              <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                {metrics.reviewDueQuestions}
              </div>
              <div className='text-sm text-muted-foreground'>
                Due for Review
              </div>
              <div className='mt-1 text-xs text-muted-foreground'>
                Questions
              </div>
            </div>

            <div className='rounded-lg bg-red-50 p-4 text-center dark:bg-red-950/20'>
              <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                {metrics.strugglingQuestions}
              </div>
              <div className='text-sm text-muted-foreground'>Struggling</div>
              <div className='mt-1 text-xs text-muted-foreground'>
                Need Focus
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Performance */}
      {(metrics.strongTopics.length > 0 || metrics.weakTopics.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              Topic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {metrics.strongTopics.length > 0 && (
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-green-600' />
                    <span className='font-medium text-green-700 dark:text-green-300'>
                      Strong Topics
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {metrics.strongTopics.map(topic => (
                      <Badge
                        key={topic}
                        variant='secondary'
                        className='bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {metrics.weakTopics.length > 0 && (
                <div>
                  <div className='mb-3 flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4 text-orange-600' />
                    <span className='font-medium text-orange-700 dark:text-orange-300'>
                      Areas for Improvement
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {metrics.weakTopics.map(topic => (
                      <Badge
                        key={topic}
                        variant='secondary'
                        className='bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5' />
            Study Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {Object.entries(STRATEGY_INFO).map(([strategy, info]) => {
              const Icon = info.icon;
              const isSelected = settings.strategy === strategy;

              return (
                <motion.div
                  key={strategy}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer border-2 transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() =>
                      onSettingsChange({
                        ...settings,
                        strategy: strategy as LearningStrategy,
                      })
                    }
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            `bg-${info.color}-100 dark:bg-${info.color}-900/20`
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              `text-${info.color}-600 dark:text-${info.color}-400`
                            )}
                          />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='mb-1 text-sm font-medium'>
                            {info.name}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {info.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
            <Button
              onClick={() => onStartSession()}
              className='flex items-center gap-2'
              size='lg'
            >
              <Calendar className='h-4 w-4' />
              Start Study Session
            </Button>

            {metrics.reviewDueQuestions > 0 && (
              <Button
                variant='outline'
                onClick={() => onStartSession('spaced_repetition')}
                className='flex items-center gap-2'
              >
                <Clock className='h-4 w-4' />
                Review Due ({metrics.reviewDueQuestions})
              </Button>
            )}

            {metrics.strugglingQuestions > 0 && (
              <Button
                variant='outline'
                onClick={() => onStartSession('weak_areas')}
                className='flex items-center gap-2'
              >
                <AlertTriangle className='h-4 w-4' />
                Focus Weak Areas ({metrics.strugglingQuestions})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
