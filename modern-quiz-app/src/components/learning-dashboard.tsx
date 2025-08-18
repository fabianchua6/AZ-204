'use client';

import { motion } from 'framer-motion';
import { 
	Brain, 
	Target, 
	TrendingUp, 
	Clock, 
	BookOpen, 
	Zap,
	BarChart3,
	Calendar,
	Trophy,
	AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LearningMetrics, LearningStrategy, SmartQuizSettings } from '@/types/learning';

interface LearningDashboardProps {
	metrics: LearningMetrics;
	settings: SmartQuizSettings;
	onSettingsChange: (settings: SmartQuizSettings) => void;
	onStartSession: (strategy?: LearningStrategy) => void;
	className?: string;
}

const STRATEGY_INFO = {
	spaced_repetition: {
		name: 'Spaced Repetition',
		description: 'Focus on due reviews for optimal retention',
		icon: Clock,
		color: 'blue',
	},
	active_recall: {
		name: 'Active Recall',
		description: 'Mix of new questions and struggling areas',
		icon: Brain,
		color: 'purple',
	},
	weak_areas: {
		name: 'Weak Areas',
		description: 'Target your struggling topics',
		icon: AlertTriangle,
		color: 'orange',
	},
	comprehensive: {
		name: 'Comprehensive',
		description: 'Balanced review of all content',
		icon: BookOpen,
		color: 'green',
	},
	quick_review: {
		name: 'Quick Review',
		description: 'Fast session with confident topics',
		icon: Zap,
		color: 'yellow',
	},
} as const;

export function LearningDashboard({
	metrics,
	settings,
	onSettingsChange,
	onStartSession,
	className,
}: LearningDashboardProps) {
	const masteryPercentage = Math.round((metrics.masteredQuestions / metrics.totalQuestions) * 100);
	const confidencePercentage = Math.round(metrics.averageConfidence * 100);

	return (
		<div className={cn('space-y-6', className)}>
			{/* Learning Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="w-5 h-5" />
						Learning Progress
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="text-center p-4 bg-primary/5 rounded-lg">
							<div className="text-2xl font-bold text-primary">{masteryPercentage}%</div>
							<div className="text-sm text-muted-foreground">Mastered</div>
							<div className="text-xs text-muted-foreground mt-1">
								{metrics.masteredQuestions}/{metrics.totalQuestions}
							</div>
						</div>
						
						<div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{confidencePercentage}%
							</div>
							<div className="text-sm text-muted-foreground">Confidence</div>
							<div className="text-xs text-muted-foreground mt-1">Average</div>
						</div>
						
						<div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
							<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
								{metrics.reviewDueQuestions}
							</div>
							<div className="text-sm text-muted-foreground">Due for Review</div>
							<div className="text-xs text-muted-foreground mt-1">Questions</div>
						</div>
						
						<div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
							<div className="text-2xl font-bold text-red-600 dark:text-red-400">
								{metrics.strugglingQuestions}
							</div>
							<div className="text-sm text-muted-foreground">Struggling</div>
							<div className="text-xs text-muted-foreground mt-1">Need Focus</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Topic Performance */}
			{(metrics.strongTopics.length > 0 || metrics.weakTopics.length > 0) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Target className="w-5 h-5" />
							Topic Performance
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{metrics.strongTopics.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-3">
										<Trophy className="w-4 h-4 text-green-600" />
										<span className="font-medium text-green-700 dark:text-green-300">
											Strong Topics
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{metrics.strongTopics.map(topic => (
											<Badge key={topic} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
												{topic}
											</Badge>
										))}
									</div>
								</div>
							)}
							
							{metrics.weakTopics.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-3">
										<AlertTriangle className="w-4 h-4 text-orange-600" />
										<span className="font-medium text-orange-700 dark:text-orange-300">
											Areas for Improvement
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{metrics.weakTopics.map(topic => (
											<Badge key={topic} variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
												{topic}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Learning Strategies */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="w-5 h-5" />
						Study Strategies
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Object.entries(STRATEGY_INFO).map(([strategy, info]) => {
							const Icon = info.icon;
							const isSelected = settings.strategy === strategy;
							
							return (
								<motion.div
									key={strategy}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<Card 
										className={cn(
											'cursor-pointer transition-all duration-200 border-2',
											isSelected 
												? 'border-primary bg-primary/5' 
												: 'border-border hover:border-primary/50'
										)}
										onClick={() => onSettingsChange({ ...settings, strategy: strategy as LearningStrategy })}
									>
										<CardContent className="p-4">
											<div className="flex items-start gap-3">
												<div className={cn(
													'p-2 rounded-lg',
													`bg-${info.color}-100 dark:bg-${info.color}-900/20`
												)}>
													<Icon className={cn(
														'w-4 h-4',
														`text-${info.color}-600 dark:text-${info.color}-400`
													)} />
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium text-sm mb-1">
														{info.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{info.description}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							);
						})}
					</div>
					
					<div className="mt-6 flex flex-col sm:flex-row gap-3">
						<Button 
							onClick={() => onStartSession()}
							className="flex items-center gap-2"
							size="lg"
						>
							<Calendar className="w-4 h-4" />
							Start Study Session
						</Button>
						
						{metrics.reviewDueQuestions > 0 && (
							<Button 
								variant="outline"
								onClick={() => onStartSession('spaced_repetition')}
								className="flex items-center gap-2"
							>
								<Clock className="w-4 h-4" />
								Review Due ({metrics.reviewDueQuestions})
							</Button>
						)}
						
						{metrics.strugglingQuestions > 0 && (
							<Button 
								variant="outline"
								onClick={() => onStartSession('weak_areas')}
								className="flex items-center gap-2"
							>
								<AlertTriangle className="w-4 h-4" />
								Focus Weak Areas ({metrics.strugglingQuestions})
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
