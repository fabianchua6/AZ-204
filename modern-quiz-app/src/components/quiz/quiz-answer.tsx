'use client';

import { CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizAnswerProps {
  answer: string;
  showAnswer: boolean;
}

export function QuizAnswer({ answer, showAnswer }: QuizAnswerProps) {
  if (!showAnswer) return null;

  return (
    <div className='mt-4 border-t-2 border-dashed border-border pt-4 sm:mt-6 sm:pt-6'>
      <div className='mb-3 flex items-center gap-3 sm:mb-4'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-200 dark:bg-green-800/60'>
          <CheckCircle2 className='h-5 w-5 text-green-700 dark:text-green-200' />
        </div>
        <div>
          <h4 className='text-lg font-bold text-green-800 dark:text-green-200'>
            Explanation
          </h4>
          <p className='text-sm text-green-700 dark:text-green-300'>
            Understanding the correct answer
          </p>
        </div>
      </div>
      <div className='prose prose-sm sm:prose-base dark:prose-invert rounded-xl border-2 border-green-300 bg-green-100 p-4 shadow-sm dark:border-green-600 dark:bg-green-900/30 sm:p-6'>
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
    </div>
  );
}
