import { Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopicSelectorProps {
  topics: string[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
  questionCount: number;
}

export function TopicSelector({ 
  topics, 
  selectedTopic, 
  onTopicChange, 
  questionCount 
}: TopicSelectorProps) {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Select Topic</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {questionCount} questions
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        <Button
          variant={selectedTopic === null ? "default" : "outline"}
          size="sm"
          onClick={() => onTopicChange(null)}
          className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
        >
          <Users className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">All Topics</span>
        </Button>
        
        {topics.map((topic) => (
          <Button
            key={topic}
            variant={selectedTopic === topic ? "default" : "outline"}
            size="sm"
            onClick={() => onTopicChange(topic)}
            className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
          >
            <span className="truncate">{topic}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
