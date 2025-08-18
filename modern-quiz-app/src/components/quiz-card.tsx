'use client';

import { useState } from 'react';
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

	const handleOptionSelect = (optionIndex: number) => {
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
		
		// For single choice, show answer after selection
		if (!isMultipleChoice) {
			setTimeout(() => onShowAnswer(), 500);
		}
	};

	const getOptionClassName = (optionIndex: number) => {
		const isSelected = selectedAnswers.includes(optionIndex);
		const isCorrect = question.answerIndexes.includes(optionIndex);

		if (!showAnswer) {
			return cn(
				'group relative p-4 rounded-lg border cursor-pointer transition-colors duration-150',
				isSelected
					? 'bg-primary/5 border-primary/30'
					: 'bg-card border-border hover:border-primary/20'
			);
		}

		if (isCorrect) {
			return cn(
				'p-4 rounded-lg border cursor-default',
				'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800'
			);
		}

		if (isSelected && !isCorrect) {
			return cn(
				'p-4 rounded-lg border cursor-default',
				'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800'
			);
		}

		return 'p-4 rounded-lg border bg-muted/20 border-muted cursor-default opacity-60';
	};

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
						<Card className="border-dashed bg-muted/30">
							<CardContent className="p-4">
								<div className="flex flex-col lg:flex-row gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<Filter className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm font-medium">
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
											<span className="text-sm font-medium">Progress</span>
										</div>
										<div className="bg-background rounded-lg p-3 border">
											<div className="flex items-center justify-between text-sm mb-2">
												<span className="text-muted-foreground">
													Questions answered
												</span>
												<span className="font-medium">
													{stats.answeredQuestions} / {stats.totalQuestions}
												</span>
											</div>
											<div className="w-full bg-muted rounded-full h-2">
												<motion.div
													className="bg-primary h-2 rounded-full"
													initial={{ width: 0 }}
													animate={{
														width: `${Math.round(
															(stats.answeredQuestions / stats.totalQuestions) *
																100
														)}%`,
													}}
													transition={{ duration: 0.3, ease: 'easeOut' }}
												/>
											</div>
											<div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
												<span>Correct: {stats.correctAnswers}</span>
												<span>
													{Math.round(
														(stats.answeredQuestions / stats.totalQuestions) *
															100
													)}
													%
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
			<Card className="relative group hover:shadow-lg transition-all duration-300 border-border/50">
				{/* Floating Action Menu - Redesigned */}
				<div className="absolute top-6 right-6 z-10">
					<div className="flex items-center gap-3">
						{/* Controls toggle */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowControls(!showControls)}
							className={cn(
								'h-9 w-9 p-0 transition-all duration-200',
								'bg-background/90 backdrop-blur-md hover:bg-background border shadow-lg hover:shadow-xl',
								'hover:scale-110 active:scale-95',
								showControls &&
									'bg-primary text-primary-foreground shadow-primary/25'
							)}
						>
							<Settings2
								className={cn(
									'h-4 w-4 transition-transform duration-300',
									showControls && 'rotate-180'
								)}
							/>
						</Button>
					</div>
				</div>

				{/* Header - Improved spacing and hierarchy */}
				<CardHeader className="pb-4 pt-6">
					<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-16">
						<div className="flex flex-wrap items-center gap-3">
							<div className="text-sm font-semibold text-foreground bg-accent/80 px-4 py-2 rounded-full border">
								{question.topic}
							</div>
							{question.hasCode && (
								<div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
									<Code2 className="h-3.5 w-3.5" />
									<span className="font-medium">Code Example</span>
								</div>
							)}
						</div>
					</div>
				</CardHeader>

				{/* Question Content - Better typography and spacing */}
				<CardContent className="pt-0 pb-8 px-6">
					<div className="prose prose-base sm:prose-lg max-w-none mb-8 dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed">
						<ReactMarkdown>{question.question}</ReactMarkdown>
					</div>

					{/* Options - Enhanced design */}
					{question.options.length > 0 && (
						<div className="space-y-4 mb-8">
							{isMultipleChoice && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="flex items-center gap-3 text-sm bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800"
								>
									<div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
										<CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<div className="font-medium text-blue-800 dark:text-blue-200">
											Multiple Choice Question
										</div>
										<div className="text-blue-600 dark:text-blue-300 text-xs">
											Select all correct answers
										</div>
									</div>
								</motion.div>
							)}

							{question.options.map((option, index) => (
								<div
									key={index}
									className="relative"
								>
									<div
										className={getOptionClassName(index)}
										onClick={() => handleOptionSelect(index)}
									>
										<div className="flex items-start gap-3">
											<div className="mt-0.5 flex-shrink-0">
												{isMultipleChoice ? (
													<div
														className={cn(
															'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150',
															selectedAnswers.includes(index)
																? 'bg-primary border-primary'
																: 'border-border'
														)}
													>
														{selectedAnswers.includes(index) && (
															<CheckCircle2 className="w-3 h-3 text-primary-foreground" />
														)}
													</div>
												) : (
													<div
														className={cn(
															'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-150',
															selectedAnswers.includes(index)
																? 'bg-primary border-primary'
																: 'border-border'
														)}
													>
														{selectedAnswers.includes(index) && (
															<div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
														)}
													</div>
												)}
											</div>
											<div className="flex-1 prose prose-sm dark:prose-invert prose-p:mb-0">
												<ReactMarkdown>{option}</ReactMarkdown>
											</div>
											
											{/* Show correct/incorrect indicators when answer is revealed */}
											{showAnswer && (
												<div className="flex-shrink-0">
													{question.answerIndexes.includes(index) ? (
														<div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
															<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
														</div>
													) : selectedAnswers.includes(index) ? (
														<div className="w-6 h-6 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
															<XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
														</div>
													) : null}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Answer Section - Enhanced design */}
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
								className="border-t-2 border-dashed border-border pt-8 mt-8 overflow-hidden"
							>
								<div className="flex items-center gap-3 mb-5">
									<div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
										<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
									<div>
										<h4 className="font-bold text-green-700 dark:text-green-400 text-lg">
											Explanation
										</h4>
										<p className="text-sm text-green-600 dark:text-green-300">
											Understanding the correct answer
										</p>
									</div>
								</div>
								<div className="prose prose-sm sm:prose-base dark:prose-invert bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
									<ReactMarkdown>{question.answer}</ReactMarkdown>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</CardContent>

				{/* Actions - Redesigned with proper hierarchy */}
				<CardFooter className="border-t bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 p-6">
					<div className="w-full">
						{/* Primary Action - Show/Hide Answer */}
						<div className="flex justify-center mb-4">
							<Button
								variant={showAnswer ? 'secondary' : 'default'}
								onClick={onShowAnswer}
								className="h-11 px-6 flex items-center gap-3 font-medium transition-colors duration-150"
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
						</div>

						{/* Secondary Actions - Navigation */}
						<div className="flex items-center justify-between">
							<Button
								variant="ghost"
								onClick={onPrevious}
								disabled={!canGoPrevious}
								className={cn(
									'h-10 px-4 flex items-center gap-2 font-medium transition-colors duration-150',
									!canGoPrevious
										? 'opacity-40 cursor-not-allowed'
										: 'hover:bg-accent'
								)}
								size="default"
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="hidden sm:inline">Previous</span>
								<span className="sm:hidden">Prev</span>
							</Button>

							{/* Progress indicator - redesigned */}
							<div className="flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-sm border rounded-full shadow-sm">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Target className="h-3.5 w-3.5" />
									<span className="font-mono tabular-nums">
										{questionNumber.toString().padStart(2, '0')} /{' '}
										{totalQuestions.toString().padStart(2, '0')}
									</span>
								</div>

								{/* Mini progress bar */}
								<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
									<motion.div
										className="h-full bg-primary rounded-full"
										initial={{ width: 0 }}
										animate={{
											width: `${(questionNumber / totalQuestions) * 100}%`,
										}}
										transition={{ duration: 0.3, ease: 'easeOut' }}
									/>
								</div>
							</div>

							<Button
								variant="ghost"
								onClick={onNext}
								disabled={!canGoNext}
								className={cn(
									'h-10 px-4 flex items-center gap-2 font-medium transition-colors duration-150',
									!canGoNext
										? 'opacity-40 cursor-not-allowed'
										: 'hover:bg-accent'
								)}
								size="default"
							>
								<span className="hidden sm:inline">Next</span>
								<span className="sm:hidden">Next</span>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
