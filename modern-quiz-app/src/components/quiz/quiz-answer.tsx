'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizAnswerProps {
  answer: string;
  showAnswer: boolean;
  isCorrect?: boolean; // Whether the user's answer was correct
}

export function QuizAnswer({ answer, showAnswer, isCorrect = true }: QuizAnswerProps) {
  if (!showAnswer) return null;

  // Style based on whether the answer was correct or wrong
  const styles = isCorrect
    ? {
        iconBg: 'bg-green-200 dark:bg-green-800/60',
        iconColor: 'text-green-700 dark:text-green-200',
        titleColor: 'text-green-800 dark:text-green-200',
        subtitleColor: 'text-green-700 dark:text-green-300',
        containerBorder: 'border-green-300 dark:border-green-600',
        containerBg: 'bg-green-100 dark:bg-green-900/30',
        icon: CheckCircle2,
      }
    : {
        iconBg: 'bg-red-200 dark:bg-red-800/60',
        iconColor: 'text-red-700 dark:text-red-200',
        titleColor: 'text-red-800 dark:text-red-200',
        subtitleColor: 'text-red-700 dark:text-red-300',
        containerBorder: 'border-red-300 dark:border-red-600',
        containerBg: 'bg-red-100 dark:bg-red-900/30',
        icon: XCircle,
      };

  const IconComponent = styles.icon;

  return (
    <div className='mt-4 border-t-2 border-dashed border-border pt-4 sm:mt-6 sm:pt-6'>
      <div className='mb-3 flex items-center gap-3 sm:mb-4'>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.iconBg}`}>
          <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div>
          <h4 className={`text-lg font-bold ${styles.titleColor}`}>
            Explanation
          </h4>
          <p className={`text-sm ${styles.subtitleColor}`}>
            {isCorrect ? 'Understanding the correct answer' : 'Why this answer is incorrect'}
          </p>
        </div>
      </div>
      <div className={`prose prose-sm sm:prose-base dark:prose-invert rounded-xl border-2 p-4 shadow-sm sm:p-6 ${styles.containerBorder} ${styles.containerBg}`}>
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>
    </div>
  );
}
