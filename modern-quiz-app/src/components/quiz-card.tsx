'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Code2,
  CheckCircle2,
  XCircle,
  Filter,
  BarChart3,
  Settings2,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { TopicSelector } from '@/components/topic-selector';
import { cn } from '@/lib/utils';
import type { Question } from '@/types/quiz';
import type { QuizStats as QuizStatsType } from '@/types/quiz';

interface QuizCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
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
  questionNumber,
  totalQuestions,
  selectedAnswers,
  showAnswer,
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
  const [showControls, setShowControls] = useState(false);

  const isMultipleChoice = question.answerIndexes.length > 1;

  const handleNext = useCallback(() => {
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
  }, [showAnswer, selectedAnswers.length, onShowAnswer, onNext]);

  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (showAnswer) return;

    let newAnswers: number[];

    if (isMultipleChoice) {
      if (selectedAnswers.includes(optionIndex)) {
        newAnswers = selectedAnswers.filter((i) => i !== optionIndex);
      } else {
        newAnswers = [...selectedAnswers, optionIndex];
      }
    } else {
      newAnswers = [optionIndex];
    }

    onAnswerSelect(question.id, newAnswers);
  }, [showAnswer, isMultipleChoice, selectedAnswers, onAnswerSelect, question.id]);

  const getOptionClassName = useCallback((optionIndex: number) => {
    const isSelected = selectedAnswers.includes(optionIndex);
    const isCorrect = question.answerIndexes.includes(optionIndex);

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
  }, [selectedAnswers, showAnswer, question.answerIndexes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, optionIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionSelect(optionIndex);
    }
  }, [handleOptionSelect]);

  return (
    <div className="space-y-4">
      {/* Contextual Toolbar - Only show when controls are expanded */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <Card className="border-dashed border-border bg-muted/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Filter by Topic
                      </span>
                    </div>
                    <TopicSelector
                      topics={topics}
                      selectedTopic={selectedTopic}
                      onTopicChange={onTopicChange}
                      questionCount={totalQuestions}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Progress</span>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border shadow-sm">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                          Questions answered
                        </span>
                        <span className="font-medium text-foreground">
                          {stats.answeredQuestions} / {stats.totalQuestions}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 border border-border/50">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.round(
                              (stats.answeredQuestions / stats.totalQuestions) * 100
                            )}%`,
                          }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Correct: {stats.correctAnswers}</span>
                        <span>
                          {Math.round(
                            (stats.answeredQuestions / stats.totalQuestions) * 100
                          )}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Quiz Card */}
      <Card className="relative group hover:shadow-lg transition-all duration-300 border-border bg-card shadow-sm">
        {/* Progress indicator and controls - positioned above the card content */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
          <div className="flex items-center gap-2">
            {/* Progress indicator - subtle */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
              <Target className="h-3 w-3" />
              {questionNumber} / {totalQuestions}
            </div>

            {/* Controls toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              aria-label={showControls ? 'Hide quiz controls' : 'Show quiz controls'}
              aria-expanded={showControls}
              className={cn(
                "h-8 w-8 p-0 bg-background/95 backdrop-blur-sm hover:bg-accent border border-border/50 shadow-sm transition-all duration-200",
                showControls && "bg-primary text-primary-foreground border-primary/50"
              )}
            >
              <Settings2
                className={cn(
                  'h-3 w-3 transition-transform duration-300',
                  showControls && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </div>

        {/* Header */}
        <CardHeader className="pb-3 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pr-16 sm:pr-20">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm bg-accent border border-accent-foreground/20 px-3 py-1.5 rounded-full font-medium text-accent-foreground shadow-sm">
                {question.topic}
              </div>
              {question.hasCode && (
                <div className="flex items-center gap-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full border border-blue-300 dark:border-blue-700 shadow-sm">
                  <Code2 className="h-3 w-3" />
                  <span className="font-medium">Code Example</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Question Content */}
        <CardContent className="pt-0 pb-4 sm:pb-6">
          <div className="prose prose-sm sm:prose-base max-w-none mb-4 sm:mb-6 dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed">
            <ReactMarkdown>{question.question}</ReactMarkdown>
          </div>

          {/* Options */}
          {question.options.length > 0 && (
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {isMultipleChoice && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-100 p-4 text-sm dark:border-blue-600 dark:bg-blue-900/40"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800/60">
                    <CheckCircle2 className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      Multiple Choice Question
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-200">
                      Select all correct answers
                    </div>
                  </div>
                </motion.div>
              )}

              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div
                    className={getOptionClassName(index)}
                    onClick={() => handleOptionSelect(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={showAnswer ? -1 : 0}
                    role="button"
                    aria-pressed={selectedAnswers.includes(index)}
                    aria-label={`Option ${index + 1}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {isMultipleChoice ? (
                          <div
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                              selectedAnswers.includes(index)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40 group-hover:border-primary/60'
                            )}
                          >
                            {selectedAnswers.includes(index) && (
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
                              selectedAnswers.includes(index)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40 group-hover:border-primary/60'
                            )}
                          >
                            {selectedAnswers.includes(index) && (
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
                          {question.answerIndexes.includes(index) ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          ) : selectedAnswers.includes(index) ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Answer Section */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut',
                  height: { duration: 0.3 },
                }}
                className="border-t-2 border-dashed border-border pt-4 sm:pt-6 mt-4 sm:mt-6 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 dark:bg-green-800/60">
                    <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-200" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-800 dark:text-green-200">
                      Explanation
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Understanding the correct answer
                    </p>
                  </div>
                </div>
                <div className="prose prose-sm sm:prose-base dark:prose-invert rounded-xl border-2 border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-900/30 p-4 sm:p-6 shadow-sm">
                  <ReactMarkdown>{question.answer}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Actions */}
        <CardFooter className="border-t border-border bg-muted/50 p-4 sm:p-6">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className={cn(
                "flex h-10 items-center gap-2 px-4 font-medium transition-colors duration-200",
                !canGoPrevious
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              size="default"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            <Button
              variant={showAnswer ? 'secondary' : 'default'}
              onClick={onShowAnswer}
              className="flex h-11 items-center gap-3 px-6 font-medium transition-colors duration-200 shadow-sm"
              size="default"
            >
              {showAnswer ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Answer
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Answer
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn(
                "flex h-10 items-center gap-2 px-4 font-medium transition-colors duration-200",
                !canGoNext
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              size="default"
            >
              <span className="hidden sm:inline">
                {!showAnswer && selectedAnswers.length > 0 ? "Show Answer" : "Next"}
              </span>
              <span className="sm:hidden">
                {!showAnswer && selectedAnswers.length > 0 ? "Show" : "Next"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
