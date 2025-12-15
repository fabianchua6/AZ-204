'use client';

import { useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface QuizOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showAnswer: boolean;
  isMultipleChoice: boolean;
  onSelect: (index: number) => void;
  disabled?: boolean;
}

export function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  showAnswer,
  isMultipleChoice,
  onSelect,
  disabled = false,
}: QuizOptionProps) {
  const getOptionClassName = useCallback(() => {
    // If disabled or showing answer, use special styling
    if (disabled || showAnswer) {
      if (showAnswer) {
        if (isCorrect) {
          return cn(
            'p-3 sm:p-4 rounded-lg border cursor-default',
            'bg-success-light border-success text-success-light-foreground shadow-sm'
          );
        }
        if (isSelected && !isCorrect) {
          return cn(
            'p-3 sm:p-4 rounded-lg border cursor-default',
            'bg-destructive-light border-destructive text-destructive-light-foreground shadow-sm'
          );
        }
        return 'p-3 sm:p-4 rounded-lg border bg-muted/40 border-muted-foreground/20 cursor-default opacity-60';
      }

      // Just disabled but not showing answer
      return cn(
        'p-3 sm:p-4 rounded-lg border cursor-not-allowed opacity-50',
        isSelected
          ? 'bg-accent border-primary'
          : 'bg-card-secondary border-border'
      );
    }

    // Interactive state
    return cn(
      'group relative p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200',
      'hover:bg-card-secondary hover:border-primary/50 hover:shadow-sm dark:hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/20',
      isSelected
        ? 'bg-accent border-primary shadow-sm dark:bg-accent/60 dark:border-primary/70 dark:shadow-sm'
        : 'bg-card-secondary border-border hover:border-primary/40 dark:bg-background-secondary dark:border-muted'
    );
  }, [isSelected, showAnswer, isCorrect, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled && !showAnswer) {
      triggerHaptic('selection');
      onSelect(index);
    }
  }, [disabled, showAnswer, onSelect, index]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && !showAnswer) {
        e.preventDefault();
        triggerHaptic('selection');
        onSelect(index);
      }
    },
    [disabled, showAnswer, onSelect, index]
  );

  return (
    <div className='relative'>
      <div
        className={getOptionClassName()}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled || showAnswer ? -1 : 0}
        role='button'
        aria-pressed={isSelected}
        aria-label={`Option ${index + 1}`}
        aria-disabled={disabled || showAnswer}
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
        </div>
      </div>
    </div>
  );
}
