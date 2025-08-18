'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/header';
import { QuizCard } from '@/components/quiz-card';
import { TopicSelector } from '@/components/topic-selector';
import { QuizStats } from '@/components/quiz-stats';
import { MobileProgress } from '@/components/mobile-progress';
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
		actions,
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
					<h1 className="text-2xl font-bold text-destructive mb-4">
						Error Loading Quiz Data
					</h1>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	const currentQuestion = filteredQuestions[currentQuestionIndex];

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
			<Header />

			<main className="container mx-auto px-4 py-6">
				<div className="max-w-4xl mx-auto">
					{/* Mobile Progress - Shows at top on mobile, hidden on desktop */}
					{currentQuestion && (
						<div className="block lg:hidden">
							<MobileProgress
								questionNumber={currentQuestionIndex + 1}
								totalQuestions={filteredQuestions.length}
								stats={stats}
							/>
						</div>
					)}

					{/* Quiz Card - Primary Focus */}
					<AnimatePresence mode="wait">
						{currentQuestion ? (
							<motion.div
								key={currentQuestion.id}
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 1.02 }}
								transition={{
									duration: 0.2,
									ease: [0.23, 1, 0.32, 1], // easeOutQuart for more natural feel
								}}
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
									canGoNext={
										currentQuestionIndex < filteredQuestions.length - 1
									}
									canGoPrevious={currentQuestionIndex > 0}
									// Pass additional props for contextual controls
									topics={topics}
									selectedTopic={selectedTopic}
									onTopicChange={actions.setSelectedTopic}
									stats={stats}
								/>
							</motion.div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="text-center py-20"
							>
								<div className="space-y-6">
									<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
										<span className="text-2xl">🎯</span>
									</div>
									<div>
										<h2 className="text-xl font-semibold mb-2">
											Ready to start?
										</h2>
										<p className="text-muted-foreground">
											Choose a topic to begin your AZ-204 practice
										</p>
									</div>
									<TopicSelector
										topics={topics}
										selectedTopic={selectedTopic}
										onTopicChange={actions.setSelectedTopic}
										questionCount={filteredQuestions.length}
										compact={false}
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}
