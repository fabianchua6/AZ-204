'use client';

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
      className='flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-100 p-4 text-sm dark:border-blue-600 dark:bg-blue-900/40'
    >
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800/60'>
        <CheckCircle2 className='h-4 w-4 text-blue-700 dark:text-blue-300' />
      </div>
      <div>
        <div className='font-medium text-blue-900 dark:text-blue-100'>
          Multiple Choice Question
        </div>
        <div className='text-xs text-blue-700 dark:text-blue-200'>
          Select all correct answers
        </div>
      </div>
    </motion.div>
  );
}
