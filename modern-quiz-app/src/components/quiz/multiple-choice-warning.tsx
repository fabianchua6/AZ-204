'use client';

// Third-party imports
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface MultipleChoiceWarningProps {
  show: boolean;
}

export function MultipleChoiceWarning({ show }: MultipleChoiceWarningProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm'
    >
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/20'>
        <CheckCircle2 className='h-4 w-4 text-primary' />
      </div>
      <div>
        <div className='font-medium text-foreground'>
          Multiple Choice Question
        </div>
        <div className='text-xs text-muted-foreground'>
          You can select multiple answers for this question
        </div>
      </div>
    </motion.div>
  );
}
