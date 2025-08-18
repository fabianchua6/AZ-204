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
    <Select
      value={selectedTopic || 'all-topics'}
      onValueChange={value =>
        onTopicChange(value === 'all-topics' ? null : value)
      }
    >
      <SelectTrigger className='w-full'>
        <SelectValue placeholder={`All Topics (${questionCount} questions)`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all-topics'>
          All Topics ({questionCount} questions)
        </SelectItem>
        {topics.map(topic => (
          <SelectItem key={topic} value={topic}>
            {topic}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    // Full mode for welcome screen
    <div className='mx-auto max-w-2xl'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <Button
          variant={selectedTopic === null ? 'default' : 'outline'}
          size='lg'
          onClick={() => onTopicChange(null)}
          className='group h-auto justify-start whitespace-normal px-4 py-4 text-left transition-colors duration-200'
        >
          <div className='flex items-center gap-3'>
            <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20'>
              <Users className='h-3 w-3 text-primary' />
            </div>
            <div className='flex flex-col'>
              <div className='font-medium leading-tight'>All Topics</div>
              <div className='text-xs leading-tight text-muted-foreground'>
                {questionCount} questions
              </div>
            </div>
          </div>
        </Button>

        {topics.map(topic => (
          <Button
            key={topic}
            variant={selectedTopic === topic ? 'default' : 'outline'}
            size='lg'
            onClick={() => onTopicChange(topic)}
            className='group h-auto justify-start whitespace-normal px-4 py-4 text-left transition-colors duration-200'
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-accent/80'>
                <span className='text-xs font-medium'>
                  {topic
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <div className='flex flex-col'>
                <div className='text-sm font-medium leading-tight'>{topic}</div>
                <div className='text-xs leading-tight text-muted-foreground'>
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
