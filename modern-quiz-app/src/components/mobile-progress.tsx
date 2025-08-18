'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
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
			'w-full bg-card/80 backdrop-blur-sm border border-border rounded-xl p-3 mb-4 shadow-sm',
			className
		)}>
			{/* Minimal progress bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<div className="flex items-center gap-1.5">
						<Target className="w-3 h-3" />
						<span className="font-mono">
							{questionNumber}/{totalQuestions}
						</span>
					</div>
					{stats.answeredQuestions > 0 && (
						<span>{accuracyPercentage}% correct</span>
					)}
				</div>
				<div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
					<motion.div
						className="h-full bg-primary rounded-full"
						initial={{ width: 0 }}
						animate={{ width: `${progressPercentage}%` }}
						transition={{ 
							duration: 0.4, 
							ease: [0.25, 0.8, 0.25, 1]
						}}
					/>
				</div>
			</div>
		</div>
	);
}
