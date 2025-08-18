'use client';

import { useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface QuizOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showAnswer: boolean;
  isMultipleChoice: boolean;
  onSelect: (index: number) => void;
}

export function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  showAnswer,
  isMultipleChoice,
  onSelect,
}: QuizOptionProps) {
  const getOptionClassName = useCallback(() => {
    if (!showAnswer) {
      return cn(
        'group relative p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200',
        'hover:bg-card-secondary hover:border-primary/50 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 focus-within:ring-2 focus-within:ring-primary/20',
        isSelected
          ? 'bg-accent border-primary shadow-md dark:bg-accent/60 dark:border-primary/70 dark:shadow-lg dark:shadow-primary/5'
          : 'bg-card-secondary border-border hover:border-primary/40 dark:bg-background-secondary dark:border-muted'
      );
    }

    if (isCorrect) {
      return cn(
        'p-3 sm:p-4 rounded-lg border cursor-default',
        'bg-success-light border-success dark:bg-success-light dark:border-success/50 shadow-sm'
      );
    }

    if (isSelected && !isCorrect) {
      return cn(
        'p-3 sm:p-4 rounded-lg border cursor-default',
        'bg-destructive-light border-destructive dark:bg-destructive-light dark:border-destructive/50 shadow-sm'
      );
    }

    return 'p-3 sm:p-4 rounded-lg border bg-muted/40 border-muted-foreground/20 cursor-default opacity-60';
  }, [isSelected, showAnswer, isCorrect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(index);
      }
    },
    [onSelect, index]
  );

  return (
    <div className='relative'>
      <div
        className={getOptionClassName()}
        onClick={() => onSelect(index)}
        onKeyDown={handleKeyDown}
        tabIndex={showAnswer ? -1 : 0}
        role='button'
        aria-pressed={isSelected}
        aria-label={`Option ${index + 1}`}
      >
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 flex-shrink-0'>
            {isMultipleChoice ? (
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40 group-hover:border-primary/60'
                )}
              >
                {isSelected && (
                  <CheckCircle2 className='h-2.5 w-2.5 text-primary-foreground' />
                )}
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40 group-hover:border-primary/60'
                )}
              >
                {isSelected && (
                  <div className='h-2 w-2 rounded-full bg-primary-foreground' />
                )}
              </div>
            )}
          </div>
          <div className='prose prose-sm dark:prose-invert prose-p:mb-0 flex-1 leading-relaxed'>
            <ReactMarkdown>{option}</ReactMarkdown>
          </div>

          {/* Show correct/incorrect indicators when answer is revealed */}
          {showAnswer && (
            <div className='flex-shrink-0'>
              {isCorrect ? (
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50'>
                  <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                </div>
              ) : isSelected ? (
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50'>
                  <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
