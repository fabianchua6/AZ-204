'use client';

// Third-party imports
import { Code2, FileText } from 'lucide-react';

// Type imports
import type { Question } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';

interface QuizBadgesProps {
  question: Question;
  className?: string;
}

export function QuizBadges({ question, className = '' }: QuizBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* PDF Badge - highest priority */}
      {isPdfQuestion(question) && (
        <div className='flex h-8 items-center gap-2 rounded-full border border-red-300 bg-red-100 px-3 text-xs text-red-800 dark:border-red-600/50 dark:bg-red-900/40 dark:text-red-200'>
          <FileText className='h-3 w-3' />
        </div>
      )}

      {/* Topic Badge */}
      <div 
        className='flex h-8 items-center rounded-full border border-primary/30 bg-primary/20 px-3 text-sm font-medium text-primary'
        title={question.topic.length > 10 ? question.topic : undefined}
      >
        {question.topic.length > 10 ? `${question.topic.substring(0, 10)}...` : question.topic}
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
