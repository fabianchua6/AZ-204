import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopicSelectorProps {
	topics: string[];
	selectedTopic: string | null;
	onTopicChange: (topic: string | null) => void;
	questionCount: number;
	compact?: boolean;
}

export function TopicSelector({
	topics,
	selectedTopic,
	onTopicChange,
	questionCount,
	compact = true,
}: TopicSelectorProps) {
	return compact ? (
		// Compact mode for contextual toolbar
		<Select value={selectedTopic || 'all-topics'} onValueChange={(value) => onTopicChange(value === 'all-topics' ? null : value)}>
			<SelectTrigger className="w-full">
				<SelectValue placeholder={`All Topics (${questionCount} questions)`} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all-topics">All Topics ({questionCount} questions)</SelectItem>
				{topics.map((topic) => (
					<SelectItem key={topic} value={topic}>
						{topic}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	) : (
		// Full mode for welcome screen
		<div className="max-w-2xl mx-auto">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				<Button
					variant={selectedTopic === null ? 'default' : 'outline'}
					size="lg"
					onClick={() => onTopicChange(null)}
					className="justify-start text-left h-auto py-4 px-4 whitespace-normal group transition-colors duration-200"
				>
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<Users className="h-4 w-4 text-primary" />
						</div>
						<div>
							<div className="font-medium">All Topics</div>
							<div className="text-xs text-muted-foreground">
								{questionCount} questions
							</div>
						</div>
					</div>
				</Button>

				{topics.map((topic) => (
					<Button
						key={topic}
						variant={selectedTopic === topic ? 'default' : 'outline'}
						size="lg"
						onClick={() => onTopicChange(topic)}
						className="justify-start text-left h-auto py-4 px-4 whitespace-normal group transition-colors duration-200"
					>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:bg-accent/80 transition-colors">
								<span className="text-sm font-medium">
									{topic
										.split(' ')
										.map((word) => word[0])
										.join('')
										.slice(0, 2)}
								</span>
							</div>
							<div>
								<div className="font-medium text-sm">{topic}</div>
								<div className="text-xs text-muted-foreground">
									Practice questions
								</div>
							</div>
						</div>
					</Button>
				))}
			</div>
		</div>
	);
}
