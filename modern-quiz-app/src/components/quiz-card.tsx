'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Code2, CheckCircle2, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { QuizOption } from '@/components/quiz/quiz-option';
import { QuizNavigation } from '@/components/quiz/quiz-navigation';
import { QuizAnswer } from '@/components/quiz/quiz-answer';
import { QuizControls } from '@/components/quiz/quiz-controls';
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

  return (
    <div className="space-y-4">
      {/* Contextual Toolbar */}
      <QuizControls
        showControls={showControls}
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={onTopicChange}
        totalQuestions={totalQuestions}
        stats={stats}
      />

      {/* Main Quiz Card */}
      <Card className="relative border-border bg-card shadow-sm">
        {/* Header */}
        <CardHeader className="pb-3 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            
            {/* Controls on the right */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground font-medium bg-muted/60 px-3 py-1.5 rounded-full border border-border/50">
                {questionNumber}/{totalQuestions}
              </div>
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
            </div>
          )}

          {/* Answer Section */}
          <QuizAnswer answer={question.answer} showAnswer={showAnswer} />
        </CardContent>

        {/* Actions */}
        <CardFooter className="border-t border-border bg-muted/30 p-3 sm:p-4">
          <QuizNavigation
            showAnswer={showAnswer}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            selectedAnswers={selectedAnswers}
            onPrevious={onPrevious}
            onNext={onNext}
            onShowAnswer={onShowAnswer}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
