'use client';

import { Code2 } from 'lucide-react';
import type { Question } from '@/types/quiz';

interface QuizBadgesProps {
  question: Question;
  className?: string;
}

export function QuizBadges({ question, className = '' }: QuizBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Topic Badge */}
      <div className='flex h-8 items-center rounded-full border border-primary/30 bg-primary/20 px-3 text-sm font-medium text-primary'>
        {question.topic}
      </div>

      {/* Code Example Badge */}
      {question.hasCode && (
        <div className='flex h-8 items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-3 text-xs text-blue-800 dark:border-blue-600/50 dark:bg-blue-900/40 dark:text-blue-200'>
          <Code2 className='h-3 w-3' />
          <span className='font-medium'>Code Example</span>
        </div>
      )}
    </div>
  );
}
