'use client';

// React imports
import { useCallback, useState, useMemo, useLayoutEffect, useEffect, useRef, memo } from 'react';
import { flushSync } from 'react-dom';

// Third-party imports
import { ChevronLeft, ChevronRight, Package, Target } from 'lucide-react';

// UI component imports
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Quiz component imports
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { QuizBadges } from '@/components/quiz/quiz-badges';
import { QuizQuestionContent } from '@/components/quiz/quiz-question-content';

// Hook imports
import { useQuizCardState } from '@/hooks/use-quiz-card-state';

// Utility imports
import { triggerHaptic } from '@/lib/haptics';

// Type imports
import type { Question } from '@/types/quiz';

interface EnhancedQuizStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  leitner: {
    totalQuestions: number;
    boxDistribution: Record<number, number>;
    dueToday: number;
    accuracyRate: number;
    streakDays: number;
  };
}

interface LeitnerQuizCardProps {
  question: Question;
  selectedAnswers: number[];
  onAnswerSelect: (questionId: string, answerIndexes: number[]) => void;
  onAnswerSubmit: (
    questionId: string,
    answerIndexes: number[]
  ) => Promise<
    | {
      correct: boolean;
      movedFromBox: number;
      movedToBox: number;
      nextReview: string;
    }
    | undefined
  >;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  stats: EnhancedQuizStats;
  questionProgress?: {
    questionId: string;
    currentBox: number;
    nextReviewDate: string;
    timesCorrect: number;
    timesIncorrect: number;
    lastReviewed: string;
    lastAnswerCorrect: boolean;
  } | null;
  // Add function to get submission state
  getSubmissionState?: (questionId: string) => {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
    submittedAt: number;
    submittedAnswers: number[]; // Add submitted answers to the type
  } | null;
  // 🎯 Session control props
  sessionProgress?: {
    current: number;
    total: number;
    isActive: boolean;
  };
  onEndSession?: () => void;
}

export function LeitnerQuizCard({
  question,
  selectedAnswers: externalSelectedAnswers,
  onAnswerSelect,
  onAnswerSubmit,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  topics,
  selectedTopic,
  onTopicChange,
  stats,
  questionProgress,
  getSubmissionState,
  sessionProgress,
  onEndSession,
}: LeitnerQuizCardProps) {
  const isMultipleChoice = question.answerIndexes.length > 1;
  const answerSectionRef = useRef<HTMLDivElement>(null);

  // Local state to force showing answer after submission
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<boolean | null>(
    null
  );

  // Auto-scroll to explanation when answer is shown
  useEffect(() => {
    if (justSubmitted && answerSectionRef.current) {
      // Small delay to ensure render
      setTimeout(() => {
        answerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [justSubmitted]);

  // CRITICAL: Reset local submission state BEFORE paint when question changes
  // This prevents the momentary flash of the answer
  useLayoutEffect(() => {
    setJustSubmitted(false);
    setSubmissionResult(null);
  }, [question.id]);

  // Use our modular hooks
  const cardState = useQuizCardState({
    questionId: question.id,
    initialSubmissionState: (() => {
      const submissionState = getSubmissionState?.(question.id);
      return submissionState
        ? {
          isSubmitted: submissionState.isSubmitted,
          isCorrect: submissionState.isCorrect,
          showAnswer: submissionState.showAnswer,
        }
        : undefined;
    })(),
  });

  // Handle answer selection with proper multi-select support
  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (cardState.answerSubmitted) {
        return;
      }

      let newAnswers: number[];

      if (isMultipleChoice) {
        // Multi-select: toggle the option
        if (externalSelectedAnswers.includes(optionIndex)) {
          newAnswers = externalSelectedAnswers.filter(i => i !== optionIndex);
        } else {
          newAnswers = [...externalSelectedAnswers, optionIndex];
        }
      } else {
        // Single select: replace existing selection
        newAnswers = [optionIndex];
      }

      onAnswerSelect(question.id, newAnswers);
    },
    [
      cardState.answerSubmitted,
      onAnswerSelect,
      question.id,
      isMultipleChoice,
      externalSelectedAnswers,
    ]
  );

  const handleSubmit = useCallback(async () => {
    if (
      !question.id ||
      !Array.isArray(externalSelectedAnswers) ||
      externalSelectedAnswers.length === 0 ||
      cardState.answerSubmitted ||
      justSubmitted
    ) {
      return;
    }

    triggerHaptic('medium');
    cardState.startSubmitting();

    try {
      const result = await onAnswerSubmit(question.id, externalSelectedAnswers);

      if (result) {
        // Trigger haptic feedback based on result
        triggerHaptic(result.correct ? 'success' : 'error');

        // Set local state immediately for instant feedback
        setJustSubmitted(true);
        setSubmissionResult(result.correct);

        // Also update the card state for consistency
        flushSync(() => {
          cardState.markAnswerSubmitted(true, result.correct);
        });
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      cardState.finishSubmitting();
    }
  }, [
    question.id,
    externalSelectedAnswers,
    cardState,
    onAnswerSubmit,
    justSubmitted,
  ]);

  // Navigation handlers - keep navigation simple and independent of submission
  const handleNext = useCallback(() => {
    if (onNext) {
      triggerHaptic('light');
      onNext();
    }
  }, [onNext]);

  const handlePrevious = useCallback(() => {
    if (onPrevious) {
      triggerHaptic('light');
      onPrevious();
    }
  }, [onPrevious]);

  // Custom button states for Leitner mode - don't disable navigation during submission
  const buttonStates = useMemo(
    () => ({
      showAnswerDisabled: false,
      nextDisabled: !canGoNext,
      previousDisabled: !canGoPrevious,
      submitDisabled:
        externalSelectedAnswers.length === 0 ||
        cardState.isSubmitting ||
        cardState.answerSubmitted,
      showSubmitButton:
        !cardState.answerSubmitted && externalSelectedAnswers.length > 0,
    }),
    [
      canGoNext,
      canGoPrevious,
      externalSelectedAnswers.length,
      cardState.isSubmitting,
      cardState.answerSubmitted,
    ]
  );

  // Get box styling using CSS classes
  const currentBox = questionProgress?.currentBox || 1;
  const boxBgClass = `leitner-box-bg-${currentBox}`;
  const boxTextClass = `leitner-box-text-${currentBox}`;

  return (
    <div className='flex flex-col h-full'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={stats.totalQuestions}
        stats={{
          totalQuestions: stats.totalQuestions,
          answeredQuestions: stats.answeredQuestions,
          correctAnswers: stats.correctAnswers,
          incorrectAnswers: stats.incorrectAnswers,
          accuracy: stats.accuracy,
        }}
        leitnerStats={{
          dueToday: stats.leitner.dueToday,
          streakDays: stats.leitner.streakDays,
        }}
      />

      {/* Main Quiz Card */}
      <Card className='relative flex flex-col border border-border bg-card shadow-sm dark:shadow-sm mb-24'>
        {/* Header with Box Info ONLY */}
        <CardHeader className='rounded-t-lg bg-card/95 px-4 pb-0 pt-4'>
          <div className='flex flex-row items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Box Indicator */}
              <div
                className={`flex h-8 items-center justify-center gap-1 rounded-md border-2 border-border px-2 text-[11px] font-bold shadow-sm ${boxBgClass} ${boxTextClass}`}
              >
                <Package className='h-3 w-3' />
                <span className='leading-none'>{currentBox}</span>
              </div>

              {/* Badges */}
              <QuizBadges question={question} />
            </div>

            {/* Question Counter - Passive */}
            {sessionProgress && (
              <div className='text-xs font-medium text-muted-foreground'>
                {sessionProgress.current} / {sessionProgress.total}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Question Content - Scrollable area */}
        <CardContent className='px-4 pb-4 pt-4 sm:pb-6'>
          <QuizQuestionContent question={question} />

          {/* Options */}
          {question.options.length > 0 && (
            <div className='mt-6 space-y-3'>
              {question.options.map((option, index) => {
                const submissionState = getSubmissionState?.(question.id);
                const isSelected =
                  cardState.showAnswer && submissionState?.submittedAnswers
                    ? submissionState.submittedAnswers.includes(index)
                    : externalSelectedAnswers.includes(index);
                const isCorrect = question.answerIndexes.includes(index);

                return (
                  <QuizOption
                    key={index}
                    option={option}
                    index={index}
                    isSelected={isSelected}
                    isCorrect={isCorrect}
                    showAnswer={cardState.showAnswer}
                    isMultipleChoice={isMultipleChoice}
                    onSelect={handleOptionSelect}
                    disabled={cardState.answerSubmitted}
                  />
                );
              })}
            </div>
          )}

          {/* Answer Section (Explanation) */}
          <div className="mt-4" ref={answerSectionRef}>
            <QuizAnswer
              answer={question.answer}
              showAnswer={justSubmitted || cardState.showAnswer}
              isCorrect={
                submissionResult ?? cardState.lastSubmissionResult ?? true
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* STICKY ACTION BAR (Thumb Zone) */}
      <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 p-4 backdrop-blur-md safe-area-bottom'>
        <div className='mx-auto grid max-w-4xl grid-cols-4 gap-3'>

          <Button
            variant='secondary'
            size='lg'
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className='col-span-1 h-14 w-full rounded-xl border-2 border-border/50 shadow-sm transition-all active:scale-95 disabled:opacity-30'
            aria-label="Previous Question"
          >
            <ChevronLeft className='h-8 w-8' stroke="currentColor" style={{ color: 'hsl(var(--foreground))' }} strokeWidth={3} />
          </Button>

          {/* PRIMARY ACTION BUTTON (Morphing) */}
          <div className="col-span-3">
            {cardState.showAnswer ? (
              // State: Result / Next
              sessionProgress?.isActive && sessionProgress.current === sessionProgress.total ? (
                <Button // End Session
                  onClick={onEndSession}
                  disabled={false}
                  className='h-14 w-full rounded-xl bg-green-600 text-lg font-semibold shadow-md hover:bg-green-700'
                >
                  Finish <Target className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button // Next Question
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className='h-14 w-full rounded-xl text-lg font-semibold shadow-md'
                >
                  Next <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )
            ) : (
              // State: Submit
              <Button
                onClick={handleSubmit}
                disabled={buttonStates.submitDisabled}
                className={`h-14 w-full rounded-xl text-lg font-semibold shadow-md ${cardState.isSubmitting ? 'opacity-80' : ''
                  }`}
              >
                {cardState.isSubmitting ? 'Checking...' : 'Check Answer'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent state changes
export const LeitnerQuizCardMemo = memo(LeitnerQuizCard);
