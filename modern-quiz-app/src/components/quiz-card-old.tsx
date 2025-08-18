'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
i  return (
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
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by Topic</span>
                    </div>
                    <TopicSelector
                      topics={topics}
                      selectedTopic={selectedTopic}
                      onTopicChange={onTopicChange}
                      questionCount={totalQuestions}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Progress</span>
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Questions answered</span>
                        <span className="font-medium">{stats.answeredCount} / {stats.totalQuestions}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <motion.div
                          className="bg-primary h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.answeredCount / stats.totalQuestions) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
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
      <Card className="relative group hover:shadow-lg transition-all duration-300">
        {/* Floating Action Menu */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2">
            {/* Progress indicator - subtle */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border">
              <Target className="h-3 w-3" />
              {questionNumber} / {totalQuestions}
            </div>
            
            {/* Controls toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background border"
            >
              <Settings2 className={cn("h-3 w-3 transition-transform", showControls && "rotate-90")} />
            </Button>
          </div>
        </div>ort { 
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
  Target
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { TopicSelector } from '@/components/topic-selector';
import { QuizStats } from '@/components/quiz-stats';
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
  const [showStats, setShowStats] = useState(false);
  
  const isMultipleChoice = question.answerIndexes.length > 1;
  
  const handleOptionSelect = (optionIndex: number) => {
    if (showAnswer) return;
    
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
  };
  
  const getOptionClassName = (optionIndex: number) => {
    const isSelected = selectedAnswers.includes(optionIndex);
    const isCorrect = question.answerIndexes.includes(optionIndex);
    
    if (!showAnswer) {
      return cn(
        'quiz-option',
        isSelected && 'selected'
      );
    }
    
    if (isCorrect) {
      return cn('quiz-option correct');
    }
    
    if (isSelected && !isCorrect) {
      return cn('quiz-option incorrect');
    }
    
    return 'quiz-option';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      {/* Header */}
      <CardHeader className="question-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </span>
            {question.hasCode && (
              <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                <Code2 className="h-3 w-3" />
                Code
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground font-medium bg-accent px-3 py-1 rounded-full">
            {question.topic}
          </div>
        </div>
      </CardHeader>

      {/* Question Content */}
      <CardContent className="question-content">
        <div className="prose prose-sm sm:prose-base max-w-none mb-6">
          <ReactMarkdown>
            {question.question}
          </ReactMarkdown>
        </div>

        {/* Options */}
        {question.options.length > 0 && (
          <div className="space-y-3 mb-6">
            {isMultipleChoice && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                This question has multiple correct answers
              </div>
            )}
            
            {question.options.map((option, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: showAnswer ? 1 : 1.02 }}
                whileTap={{ scale: showAnswer ? 1 : 0.98 }}
                className="relative"
              >
                <div
                  className={cn(
                    getOptionClassName(index),
                    showAnswer && 'disabled'
                  )}
                  onClick={() => handleOptionSelect(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {isMultipleChoice ? (
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          selectedAnswers.includes(index) 
                            ? "bg-primary border-primary" 
                            : "border-border hover:border-primary/50"
                        )}>
                          {selectedAnswers.includes(index) && (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                      ) : (
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedAnswers.includes(index) 
                            ? "bg-primary border-primary" 
                            : "border-border hover:border-primary/50"
                        )}>
                          {selectedAnswers.includes(index) && (
                            <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 prose prose-sm">
                      <ReactMarkdown>{option}</ReactMarkdown>
                    </div>
                    
                    {/* Show correct/incorrect indicators when answer is revealed */}
                    {showAnswer && (
                      <div className="flex-shrink-0">
                        {question.answerIndexes.includes(index) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : selectedAnswers.includes(index) ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Answer Section */}
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t pt-4 mt-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-700 dark:text-green-400">
                Answer
              </h4>
            </div>
            <div className="prose prose-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <ReactMarkdown>
                {question.answer}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="question-actions">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="w-full sm:w-auto flex items-center gap-2"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant={showAnswer ? "secondary" : "default"}
            onClick={onShowAnswer}
            className="w-full sm:w-auto flex items-center gap-2"
            size="sm"
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
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="w-full sm:w-auto flex items-center gap-2"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
