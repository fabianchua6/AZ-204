'use client';

import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizNavigationProps {
  showAnswer: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  selectedAnswers: number[];
  onPrevious: () => void;
  onNext: () => void;
  onShowAnswer: () => void;
  compact?: boolean;
}

export function QuizNavigation({
  showAnswer,
  canGoPrevious,
  canGoNext,
  selectedAnswers,
  onPrevious,
  onNext,
  onShowAnswer,
  compact = false,
}: QuizNavigationProps) {
  const handleNext = () => {
    if (!showAnswer && selectedAnswers.length > 0) {
      // First click: Show answer
      onShowAnswer();
    } else if (showAnswer) {
      // Second click: Move to next question
      onNext();
    } else {
      // No answer selected, just move to next
      onNext();
    }
  };

  return compact ? (
    // Compact mode for header - minimal icon buttons: Show, Left, Right
    <div className='flex items-center gap-1'>
      <Button
        variant='ghost'
        onClick={onShowAnswer}
        className='h-8 w-8 rounded-md p-0 hover:bg-accent'
        size='sm'
      >
        {showAnswer ? (
          <EyeOff className='h-4 w-4' />
        ) : (
          <Eye className='h-4 w-4' />
        )}
      </Button>

      <Button
        variant='ghost'
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          'h-8 w-8 rounded-md p-0',
          !canGoPrevious ? 'cursor-not-allowed opacity-30' : 'hover:bg-accent'
        )}
        size='sm'
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>

      <Button
        variant='ghost'
        onClick={handleNext}
        disabled={!canGoNext}
        className={cn(
          'h-8 w-8 rounded-md p-0',
          !canGoNext ? 'cursor-not-allowed opacity-30' : 'hover:bg-accent'
        )}
        size='sm'
      >
        <ChevronRight className='h-4 w-4' />
      </Button>
    </div>
  ) : (
    // Full mode for footer
    <div className='flex w-full items-center gap-3'>
      {/* Primary Action - Left Side */}
      <Button
        variant={showAnswer ? 'outline' : 'default'}
        onClick={onShowAnswer}
        className={cn(
          'flex h-10 items-center gap-3 px-6 font-medium shadow-sm transition-all duration-300',
          showAnswer
            ? 'border-primary/60 text-primary hover:bg-muted hover:text-primary'
            : 'hover:scale-[1.02] hover:shadow-sm'
        )}
        size='default'
      >
        {showAnswer ? (
          <>
            <EyeOff className='h-4 w-4' />
            <span className='hidden sm:inline'>Hide Answer</span>
            <span className='sm:hidden'>Hide</span>
          </>
        ) : (
          <>
            <Eye className='h-4 w-4' />
            <span className='hidden sm:inline'>Show Answer</span>
            <span className='sm:hidden'>Show</span>
          </>
        )}
      </Button>

      {/* Spacer */}
      <div className='flex-1' />

      {/* Navigation Group - Right Side */}
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
            !canGoPrevious
              ? 'cursor-not-allowed opacity-30'
              : 'hover:scale-105 hover:bg-accent/80'
          )}
          size='sm'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <Button
          variant='ghost'
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
            !canGoNext
              ? 'cursor-not-allowed opacity-30'
              : 'hover:scale-105 hover:bg-accent/80'
          )}
          size='sm'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
