'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TopicSelector } from '@/components/topic-selector';
import type { QuizStats } from '@/types/quiz';

interface QuizControlsProps {
  showControls: boolean;
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  totalQuestions: number;
  stats: QuizStats;
}

export function QuizControls({
  showControls,
  topics,
  selectedTopic,
  onTopicChange,
  totalQuestions,
  stats,
}: QuizControlsProps) {
  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <Card className="border-dashed border-border bg-muted/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Filter by Topic
                    </span>
                  </div>
                  <TopicSelector
                    topics={topics}
                    selectedTopic={selectedTopic}
                    onTopicChange={onTopicChange}
                    questionCount={totalQuestions}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Progress</span>
                  </div>
                  <div className="bg-background rounded-lg p-3 border border-border shadow-sm">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Questions answered
                      </span>
                      <span className="font-medium text-foreground">
                        {stats.answeredQuestions} / {stats.totalQuestions}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 border border-border/50">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round(
                            (stats.answeredQuestions / stats.totalQuestions) * 100
                          )}%`,
                        }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Correct: {stats.correctAnswers}</span>
                      <span>
                        {Math.round(
                          (stats.answeredQuestions / stats.totalQuestions) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
