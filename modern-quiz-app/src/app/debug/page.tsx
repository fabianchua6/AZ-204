'use client';

import { Button } from '@/components/ui/button';
import { leitnerSystem } from '@/lib/leitner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { questionService } from '@/lib/question-service';
import { useEffect, useState } from 'react';
import {
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  HardDrive,
  RotateCcw,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface StorageStats {
  leitnerProgress: number;
  sessionData: number;
  totalKeys: number;
  totalSize: string;
}

interface QuestionStats {
  total: number;
  filtered: number;
  inProgress: number;
  box1: number;
  box2: number;
  box3: number;
  mastered: number;
}

export default function DebugPage() {
  const { questions, loading } = useQuizData();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Settings - AZ-204 Quiz';
    loadStats();
  }, []);

  useEffect(() => {
    if (!loading && questions.length > 0) {
      loadQuestionStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions]);

  const loadStats = () => {
    try {
      let totalSize = 0;
      let leitnerProgress = 0;
      let sessionData = 0;
      let totalKeys = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const size = new Blob([value]).size;
          totalSize += size;
          totalKeys++;

          if (key.includes('leitner-progress')) {
            leitnerProgress = size;
          }
          if (key.includes('leitner-current-session') || key.includes('quiz-')) {
            sessionData += size;
          }
        }
      }

      setStorageStats({
        leitnerProgress,
        sessionData,
        totalKeys,
        totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      });
    } catch {
      console.error('Failed to load storage stats');
    }
  };

  const loadQuestionStats = async () => {
    try {
      await leitnerSystem.ensureInitialized();
      const filtered = questionService.filterQuestions(questions);
      const stats = leitnerSystem.getStats(filtered);

      setQuestionStats({
        total: questions.length,
        filtered: filtered.length,
        inProgress: stats.questionsStarted,
        box1: stats.boxDistribution[1] || 0,
        box2: stats.boxDistribution[2] || 0,
        box3: stats.boxDistribution[3] || 0,
        mastered: stats.boxDistribution[3] || 0,
      });
    } catch (e) {
      console.error('Failed to load question stats', e);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRefreshSession = () => {
    try {
      localStorage.removeItem('leitner-current-session');
      localStorage.removeItem('quiz-practice-state');
      localStorage.removeItem('quiz-leitner-state');
      showMessage('success', 'Session cleared! Refresh for new questions.');
      loadStats();
    } catch {
      showMessage('error', 'Failed to clear session');
    }
  };

  const handleClearCacheKeepProgress = () => {
    try {
      const progressData = localStorage.getItem('leitner-progress');
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'leitner-progress' && !key.includes('theme')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (progressData) {
        localStorage.setItem('leitner-progress', progressData);
      }

      showMessage('success', 'Cache cleared, progress saved.');
      loadStats();
    } catch {
      showMessage('error', 'Failed to clear cache');
    }
  };

  const handleClearAll = () => {
    if (confirm('DELETE all progress? This cannot be undone.')) {
      try {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        showMessage('success', 'All data cleared.');
        loadStats();
        loadQuestionStats();
      } catch {
        showMessage('error', 'Failed to clear data');
      }
    }
  };

  const handleForceReload = () => {
    handleRefreshSession();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-8">
        {/* Toast Message */}
        {message && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium ${message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        {/* Stats Overview */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Questions */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '...' : questionStats?.total || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            {/* In Progress */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {loading ? '...' : questionStats?.inProgress || 0}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            {/* Mastered */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : questionStats?.mastered || 0}
              </div>
              <div className="text-sm text-muted-foreground">Mastered</div>
            </div>
            {/* Storage */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {storageStats?.totalSize || '0 KB'}
              </div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
          </div>
        </section>

        {/* Box Distribution */}
        {questionStats && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Learning Progress</h2>
            <div className="flex gap-2">
              <div className="flex-1 text-center py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-xl font-bold text-red-500">{questionStats.box1}</div>
                <div className="text-xs text-muted-foreground">Box 1</div>
              </div>
              <div className="flex-1 text-center py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xl font-bold text-amber-500">{questionStats.box2}</div>
                <div className="text-xs text-muted-foreground">Box 2</div>
              </div>
              <div className="flex-1 text-center py-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xl font-bold text-green-500">{questionStats.box3}</div>
                <div className="text-xs text-muted-foreground">Box 3</div>
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Actions</h2>
          <div className="space-y-2">
            {/* Primary Action */}
            <button
              onClick={handleRefreshSession}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-primary/20">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Refresh Session</div>
                <div className="text-sm text-muted-foreground">New question order, keeps progress</div>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </button>

            {/* Secondary Actions */}
            <button
              onClick={handleClearCacheKeepProgress}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 border border-border/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-muted">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Clear Cache</div>
                <div className="text-sm text-muted-foreground">Keeps learning progress</div>
              </div>
            </button>

            <button
              onClick={handleForceReload}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted/50 border border-border/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-muted">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Force Reload</div>
                <div className="text-sm text-muted-foreground">Clear cache & refresh page</div>
              </div>
            </button>

            {/* Danger Zone */}
            <button
              onClick={handleClearAll}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-destructive/10 border border-destructive/30 transition-colors text-left mt-4"
            >
              <div className="p-2 rounded-lg bg-destructive/20">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-destructive">Reset Everything</div>
                <div className="text-sm text-muted-foreground">Delete all data permanently</div>
              </div>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Changelog</h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">v1.5.0</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Latest</span>
              </div>
              <div className="text-muted-foreground mt-1">
                Fixed iOS font scaling • Next.js 15.5.9 • Arc TLS fix
              </div>
            </div>
            <div>
              <div className="font-semibold">v1.4.0</div>
              <div className="text-muted-foreground mt-1">
                Auto-hide header • 80% PDF priority • Sticky footer
              </div>
            </div>
            <div>
              <div className="font-semibold">v1.3.0</div>
              <div className="text-muted-foreground mt-1">
                Hook refactoring • Removed Practice Mode • Mobile UX
              </div>
            </div>
            <div>
              <div className="font-semibold">v1.2.0</div>
              <div className="text-muted-foreground mt-1">
                48 PDF questions • Session auto-refresh • Box 3 tuning
              </div>
            </div>
          </div>
        </section>

        {/* App Info */}
        <section className="pb-8">
          <div className="text-center text-xs text-muted-foreground">
            <div>AZ-204 Quiz App</div>
            <div className="mt-1">Made with ❤️ for Azure certification</div>
          </div>
        </section>
      </div>
    </div>
  );
}
