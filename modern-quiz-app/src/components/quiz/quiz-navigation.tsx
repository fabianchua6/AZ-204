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
}

export function QuizNavigation({
  showAnswer,
  canGoPrevious,
  canGoNext,
  selectedAnswers,
  onPrevious,
  onNext,
  onShowAnswer,
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

  return (
    <div className="flex w-full items-center gap-3">
      {/* Primary Action - Left Side */}
      <Button
        variant={showAnswer ? 'outline' : 'default'}
        onClick={onShowAnswer}
        className={cn(
          "flex h-10 items-center gap-3 px-6 font-medium transition-all duration-300 shadow-sm",
          showAnswer 
            ? "hover:bg-muted border-primary/60 text-primary hover:text-primary" 
            : "hover:shadow-md hover:scale-[1.02]"
        )}
        size="default"
      >
        {showAnswer ? (
          <>
            <EyeOff className="h-4 w-4" />
            <span className="hidden sm:inline">Hide Answer</span>
            <span className="sm:hidden">Hide</span>
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Show Answer</span>
            <span className="sm:hidden">Show</span>
          </>
        )}
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation Group - Right Side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
            !canGoPrevious
              ? "cursor-not-allowed opacity-30"
              : "hover:bg-accent/80 hover:scale-105"
          )}
          size="sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
            !canGoNext
              ? "cursor-not-allowed opacity-30"
              : "hover:bg-accent/80 hover:scale-105"
          )}
          size="sm"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
