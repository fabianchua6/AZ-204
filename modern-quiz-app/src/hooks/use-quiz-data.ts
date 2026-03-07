'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types/quiz';

export function useQuizData() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch all data concurrently to reduce loading time
        const [topicsData, regularQuestions, pdfQuestions] = await Promise.all([
          fetch('/data/topics.json').then(res => {
            if (!res.ok) throw new Error('Failed to load topics');
            return res.json();
          }),
          fetch('/data/questions.json').then(res => {
            if (!res.ok) throw new Error('Failed to load questions');
            return res.json();
          }),
          fetch('/data/pdf-questions.json')
            .then(res => (res.ok ? res.json() : []))
            .catch(err => {
              console.warn('PDF questions not available:', err);
              return [];
            }) as Promise<Question[]>,
        ]);

        // Merge and prioritize PDF questions
        // PDF questions come first, then regular questions
        const allQuestions = [...pdfQuestions, ...regularQuestions];

        // Extract unique topics from both regular and PDF questions
        const allTopics = new Set([...topicsData]);

        // Add topics from PDF questions that might not be in the original topics list
        pdfQuestions.forEach(q => {
          if (q.topic) {
            allTopics.add(q.topic);
          }
        });

        setTopics(Array.from(allTopics).sort());
        setQuestions(allQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { questions, topics, loading, error };
}
