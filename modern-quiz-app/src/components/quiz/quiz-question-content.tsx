'use client';

import ReactMarkdown from 'react-markdown';
import type { Question } from '@/types/quiz';

interface QuizQuestionContentProps {
  question: Question;
  className?: string;
}

export function QuizQuestionContent({ 
  question, 
  className = 'prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed mb-4 max-w-none sm:mb-6'
}: QuizQuestionContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown>{question.question}</ReactMarkdown>
    </div>
  );
}
