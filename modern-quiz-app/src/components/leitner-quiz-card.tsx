'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  CheckCircle2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { BOX_COLORS } from '@/lib/leitner';
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
  ) =>
    | {
        correct: boolean;
        movedFromBox: number;
        movedToBox: number;
        nextReview: string;
      }
    | undefined;
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
}

export function LeitnerQuizCard({
  question,
  selectedAnswers,
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
}: LeitnerQuizCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMultipleChoice = question.answerIndexes.length > 1;

  // Cleanup timeout on unmount or question change
  useEffect(() => {
    const currentTimeout = timeoutRef.current;
    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, [question.id]);

  const handleOptionSelect = useCallback(
    (optionIndex: number) => {
      if (answerSubmitted) return;

      let newAnswers: number[];

      if (isMultipleChoice) {
        if (selectedAnswers.includes(optionIndex)) {
          newAnswers = selectedAnswers.filter(i => i !== optionIndex);
        } else {
          newAnswers = [...selectedAnswers, optionIndex];
        }
      } else {
        newAnswers = [optionIndex];
      }

      onAnswerSelect(question.id, newAnswers);
    },
    [
      answerSubmitted,
      isMultipleChoice,
      selectedAnswers,
      onAnswerSelect,
      question.id,
    ]
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (selectedAnswers.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await onAnswerSubmit(question.id, selectedAnswers);
      setAnswerSubmitted(true);
      setShowAnswer(true);

      // Auto-advance after 2.5 seconds if correct, or wait for user if incorrect
      if (result?.correct && canGoNext) {
        timeoutRef.current = setTimeout(() => {
          onNext();
          setAnswerSubmitted(false);
          setShowAnswer(false);
          setIsSubmitting(false);
        }, 2500);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setIsSubmitting(false);
    }
  }, [
    selectedAnswers,
    isSubmitting,
    onAnswerSubmit,
    question.id,
    canGoNext,
    onNext,
  ]);

  const handleNextQuestion = useCallback(() => {
    onNext();
    setAnswerSubmitted(false);
    setShowAnswer(false);
  }, [onNext]);

  const handlePreviousQuestion = useCallback(() => {
    onPrevious();
    setAnswerSubmitted(false);
    setShowAnswer(false);
  }, [onPrevious]);

  // Get box styling
  const currentBox = questionProgress?.currentBox || 1;
  const boxColor = BOX_COLORS[currentBox as keyof typeof BOX_COLORS];

  return (
    <div className='space-y-4'>
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
      />

      {/* Main Quiz Card */}
      <Card className='relative border border-border bg-card shadow-sm dark:shadow-sm'>
        {/* Header with Box Info, Topic Badge and Navigation */}
        <CardHeader className='sticky top-0 z-10 rounded-t-lg bg-card/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:pt-6'>
          <div className='flex flex-row items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Minimalistic Box Number - First */}
              <div
                className={`flex h-8 w-10 items-center justify-center gap-1 rounded-lg border-2 text-xs font-bold ${boxColor.bg} ${boxColor.text} ${boxColor.border}`}
              >
                <Package
                  className={`h-3 w-3 flex-shrink-0 ${boxColor.accent.replace('bg-', 'text-')}`}
                />
                <span>{currentBox}</span>
              </div>

              {/* Topic Badge */}
              <div className='flex h-8 items-center rounded-full border border-primary/30 bg-primary/20 px-3 text-sm font-medium text-primary'>
                {question.topic}
              </div>

              {/* Code Example Badge */}
              {question.hasCode && (
                <div className='flex h-8 items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-3 text-xs text-blue-800 dark:border-blue-600/50 dark:bg-blue-900/40 dark:text-blue-200'>
                  <Code2 className='h-3 w-3' />
                  <span className='font-medium'>Code Example</span>
                </div>
              )}

              {/* Progress Info */}
              {questionProgress && (
                <div className='flex h-8 items-center gap-2 rounded-full border border-muted bg-muted/50 px-3 text-xs text-muted-foreground'>
                  <RotateCcw className='h-3 w-3' />
                  <span>
                    {questionProgress.timesCorrect}✓{' '}
                    {questionProgress.timesIncorrect}✗
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className='flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handlePreviousQuestion}
                  disabled={!canGoPrevious}
                  className='h-8 w-8 p-0'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleNextQuestion}
                  disabled={!canGoNext || !answerSubmitted}
                  className='h-8 w-8 p-0'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className='px-4 pb-4 pt-0 sm:pb-6'>
          <div className='prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed mb-4 max-w-none sm:mb-6'>
            <ReactMarkdown>{question.question}</ReactMarkdown>
          </div>

          {/* Options */}
          {question.options.length > 0 && (
            <div className='mb-4 space-y-2 sm:mb-6 sm:space-y-3'>
              {isMultipleChoice && !answerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-100 p-4 text-sm dark:border-blue-600 dark:bg-blue-900/40'
                >
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800/60'>
                    <CheckCircle2 className='h-4 w-4 text-blue-700 dark:text-blue-300' />
                  </div>
                  <div>
                    <div className='font-medium text-blue-900 dark:text-blue-100'>
                      Multiple Choice Question
                    </div>
                    <div className='text-xs text-blue-700 dark:text-blue-200'>
                      Select all correct answers
                    </div>
                  </div>
                </motion.div>
              )}

              {question.options.map((option, index) => (
                <QuizOption
                  key={index}
                  option={option}
                  index={index}
                  isSelected={selectedAnswers.includes(index)}
                  isCorrect={question.answerIndexes.includes(index)}
                  showAnswer={showAnswer}
                  isMultipleChoice={isMultipleChoice}
                  onSelect={handleOptionSelect}
                />
              ))}

              {/* Submit Answer Button */}
              {!answerSubmitted && selectedAnswers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='pt-2'
                >
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting}
                    className='w-full sm:w-auto'
                    size='lg'
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Answer'}
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {/* Answer Section */}
          <QuizAnswer answer={question.answer} showAnswer={showAnswer} />
        </CardContent>
      </Card>
    </div>
  );
}
