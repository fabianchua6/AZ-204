'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/header';
import { QuizCard } from '@/components/quiz-card';
import { TopicSelector } from '@/components/topic-selector';
import { QuizStats } from '@/components/quiz-stats';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { useQuizState } from '@/hooks/use-quiz-state';
import type { Question } from '@/types/quiz';

export default function Home() {
  const { questions, topics, loading, error } = useQuizData();
  const {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    showAnswer,
    stats,
    actions
  } = useQuizState(questions);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Quiz Data</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Topic Selector */}
          <TopicSelector
            topics={topics}
            selectedTopic={selectedTopic}
            onTopicChange={actions.setSelectedTopic}
            questionCount={filteredQuestions.length}
          />

          {/* Quiz Stats */}
          <QuizStats stats={stats} />

          {/* Quiz Card */}
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuizCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={filteredQuestions.length}
                  selectedAnswers={answers[currentQuestion.id] || []}
                  showAnswer={showAnswer}
                  onAnswerSelect={actions.setAnswer}
                  onShowAnswer={actions.toggleShowAnswer}
                  onNext={actions.nextQuestion}
                  onPrevious={actions.previousQuestion}
                  canGoNext={currentQuestionIndex < filteredQuestions.length - 1}
                  canGoPrevious={currentQuestionIndex > 0}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <h2 className="text-2xl font-bold text-muted-foreground">
                  {selectedTopic ? 'No questions found for this topic' : 'Select a topic to start'}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
