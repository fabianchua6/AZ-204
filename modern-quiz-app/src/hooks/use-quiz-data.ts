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

        // Load topics
        const topicsResponse = await fetch('/data/topics.json');
        if (!topicsResponse.ok) throw new Error('Failed to load topics');
        const topicsData = await topicsResponse.json();

        // Load questions
        const questionsResponse = await fetch('/data/questions.json');
        if (!questionsResponse.ok) throw new Error('Failed to load questions');
        const questionsData = await questionsResponse.json();

        setTopics(topicsData);
        setQuestions(questionsData);
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
