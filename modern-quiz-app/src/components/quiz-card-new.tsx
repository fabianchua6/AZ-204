'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Code2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizNavigation } from '@/components/quiz/quiz-navigation';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
import { useAnswerSelection } from '@/hooks/use-answer-selection';
import { useQuizCardState } from '@/hooks/use-quiz-card-state';
import {
  createNavigationHandler,
  getNavigationButtonStates,
  type QuizNavigationState,
  type QuizNavigationActions,
} from '@/lib/quiz-navigation';
import type { Question } from '@/types/quiz';
import type { QuizStats as QuizStatsType } from '@/types/quiz';

interface QuizCardProps {
  question: Question;
  selectedAnswers: number[];
  showAnswer: boolean;
  onAnswerSelect: (questionId: string, answerIndexes: number[]) => void;
  onShowAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  // Contextual controls
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  stats: QuizStatsType;
}

export function QuizCard({
  question,
  selectedAnswers: externalSelectedAnswers,
  showAnswer: externalShowAnswer,
  onAnswerSelect,
  onShowAnswer,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  topics,
  selectedTopic,
  onTopicChange,
  stats,
}: QuizCardProps) {
  const isMultipleChoice = question.answerIndexes.length > 1;

  // Use our modular hooks - but keep external control for practice mode
  const answerSelection = useAnswerSelection({
    questionId: question.id,
    isMultipleChoice,
    initialAnswers: externalSelectedAnswers,
    onAnswerChange: onAnswerSelect,
    disabled: externalShowAnswer,
  });

  // Create navigation state and actions for practice mode
  const navigationState: QuizNavigationState = {
    showAnswer: externalShowAnswer,
    hasAnswers: answerSelection.hasAnswers,
    canGoNext,
    canGoPrevious,
    answerSubmitted: false, // Practice mode doesn't submit
    isSubmitting: false,
  };

  const navigationActions: QuizNavigationActions = {
    onShowAnswer,
    onNext,
    onPrevious,
  };

  const navigationHandler = createNavigationHandler(
    navigationState,
    navigationActions
  );

  return (
    <div className='space-y-4'>
      {/* Contextual Toolbar */}
      <QuizControls
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={stats.totalQuestions}
        stats={stats}
      />

      {/* Main Quiz Card */}
      <Card className='dark:border-border-light relative border border-border bg-card shadow-sm dark:shadow-sm'>
        {/* Header with Topic Badge and Navigation */}
        <CardHeader className='sticky top-0 z-10 rounded-t-lg bg-card/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:pt-6'>
          <div className='flex flex-row items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='rounded-full border border-primary/30 bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary'>
                {question.topic}
              </div>
              {question.hasCode && (
                <div className='flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-2 py-1 text-xs text-blue-800 shadow-sm dark:border-blue-600/50 dark:bg-blue-900/40 dark:text-blue-200'>
                  <Code2 className='h-3 w-3' />
                  <span className='font-medium'>Code Example</span>
                </div>
              )}
            </div>

            {/* Navigation in Header */}
            <div className='flex-shrink-0'>
              <QuizNavigation
                showAnswer={externalShowAnswer}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                selectedAnswers={answerSelection.selectedAnswers}
                onPrevious={onPrevious}
                onNext={navigationHandler.handleNext}
                onShowAnswer={navigationHandler.handleShowAnswer}
                compact={true}
              />
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
              {isMultipleChoice && (
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
                  isSelected={answerSelection.isAnswerSelected(index)}
                  isCorrect={question.answerIndexes.includes(index)}
                  showAnswer={externalShowAnswer}
                  isMultipleChoice={isMultipleChoice}
                  onSelect={answerSelection.toggleAnswer}
                  disabled={externalShowAnswer}
                />
              ))}
            </div>
          )}

          {/* Answer Section */}
          <QuizAnswer
            answer={question.answer}
            showAnswer={externalShowAnswer}
          />
        </CardContent>
      </Card>
    </div>
  );
}
