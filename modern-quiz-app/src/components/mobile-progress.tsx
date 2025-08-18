'use client';

import { motion } from 'framer-motion';
import { Target, Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizStats } from '@/types/quiz';

interface MobileProgressProps {
	questionNumber: number;
	totalQuestions: number;
	stats: QuizStats;
	className?: string;
}

export function MobileProgress({
	questionNumber,
	totalQuestions,
	stats,
	className,
}: MobileProgressProps) {
	const progressPercentage = (questionNumber / totalQuestions) * 100;
	const accuracyPercentage = stats.answeredQuestions > 0 
		? Math.round((stats.correctAnswers / stats.answeredQuestions) * 100)
		: 0;

	return (
		<div className={cn(
			'w-full bg-gradient-to-r from-card/80 to-card-secondary/80 backdrop-blur-md border-border-light border rounded-2xl p-4 mb-6 shadow-lg',
			className
		)}>
			{/* Top row - Question counter and accuracy */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
						<Target className="w-4 h-4 text-primary" />
					</div>
					<div>
						<div className="text-sm font-semibold text-foreground">
							Question {questionNumber}
						</div>
						<div className="text-xs text-muted-foreground">
							of {totalQuestions} total
						</div>
					</div>
				</div>

				{stats.answeredQuestions > 0 && (
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
							<CheckCircle2 className="w-4 h-4 text-success" />
						</div>
						<div className="text-right">
							<div className="text-sm font-semibold text-foreground">
								{accuracyPercentage}%
							</div>
							<div className="text-xs text-muted-foreground">
								accuracy
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Progress bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Progress</span>
					<span>{Math.round(progressPercentage)}%</span>
				</div>
				<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
					<motion.div
						className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full shadow-sm"
						initial={{ width: 0 }}
						animate={{ width: `${progressPercentage}%` }}
						transition={{ 
							duration: 0.5, 
							ease: [0.25, 0.8, 0.25, 1] // easeInOutQuart
						}}
					/>
				</div>
			</div>

			{/* Stats row */}
			{stats.answeredQuestions > 0 && (
				<div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
					<div className="flex items-center gap-4 text-xs">
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-success rounded-full"></div>
							<span className="text-muted-foreground">
								{stats.correctAnswers} correct
							</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-destructive rounded-full"></div>
							<span className="text-muted-foreground">
								{stats.answeredQuestions - stats.correctAnswers} incorrect
							</span>
						</div>
					</div>
					<div className="text-xs text-muted-foreground">
						{stats.answeredQuestions} / {stats.totalQuestions} answered
					</div>
				</div>
			)}
		</div>
	);
}
