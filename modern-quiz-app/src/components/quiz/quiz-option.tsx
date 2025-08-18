'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
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
        'hover:bg-accent hover:border-primary/50 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/20',
        isSelected
          ? 'bg-primary/15 border-primary shadow-sm dark:bg-primary/20 dark:border-primary/60'
          : 'bg-card border-border hover:border-primary/30'
      );
    }

    if (isCorrect) {
      return cn(
        'p-3 sm:p-4 rounded-lg border cursor-default',
        'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-600'
      );
    }

    if (isSelected && !isCorrect) {
      return cn(
        'p-3 sm:p-4 rounded-lg border cursor-default',
        'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-600'
      );
    }

    return 'p-3 sm:p-4 rounded-lg border bg-muted/40 border-muted-foreground/20 cursor-default opacity-60';
  }, [isSelected, showAnswer, isCorrect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(index);
    }
  }, [onSelect, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <div
        className={getOptionClassName()}
        onClick={() => onSelect(index)}
        onKeyDown={handleKeyDown}
        tabIndex={showAnswer ? -1 : 0}
        role="button"
        aria-pressed={isSelected}
        aria-label={`Option ${index + 1}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 flex-shrink-0">
            {isMultipleChoice ? (
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40 group-hover:border-primary/60'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40 group-hover:border-primary/60'
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                    className="w-2.5 h-2.5 bg-primary-foreground rounded-full"
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 prose prose-sm dark:prose-invert prose-p:mb-0">
            <ReactMarkdown>{option}</ReactMarkdown>
          </div>

          {/* Show correct/incorrect indicators when answer is revealed */}
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                delay: 0.1 
              }}
              className="flex-shrink-0"
            >
              {isCorrect ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              ) : isSelected ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
