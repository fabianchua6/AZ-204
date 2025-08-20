'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { QuizQuestionContent } from '@/components/quiz/quiz-question-content';
import type { Question } from '@/types/quiz';
import type { QuizStats } from '@/types/quiz';

interface QuizCardBaseProps {
  question: Question;
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  stats: QuizStats;
  headerContent: ReactNode;
  optionsContent: ReactNode;
  answerContent: ReactNode;
  className?: string;
}

export function QuizCardBase({
  question,
  topics,
  selectedTopic,
  onTopicChange,
  stats,
  headerContent,
  optionsContent,
  answerContent,
  className = 'relative border border-border bg-card shadow-sm dark:shadow-sm',
}: QuizCardBaseProps) {
  return (
    <div className='space-y-4'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={stats.totalQuestions}
        stats={stats}
      />

      {/* Main Quiz Card */}
      <Card className={className}>
        {/* Header */}
        <CardHeader className='sticky top-0 z-10 rounded-t-lg bg-card/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:pt-6'>
          {headerContent}
        </CardHeader>

        {/* Question Content */}
        <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
          <QuizQuestionContent question={question} />
          {optionsContent}
          {answerContent}
        </CardContent>
      </Card>
    </div>
  );
}
