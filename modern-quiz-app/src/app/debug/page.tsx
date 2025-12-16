'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Database,
  Zap,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

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
    document.title = 'Debug - AZ-204 Quiz';
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
      const stats = leitnerSystem.getStats();

      setQuestionStats({
        total: questions.length,
        filtered: filtered.length,
        inProgress: stats.questionsStarted,
        box1: stats.boxDistribution[1] || 0,
        box2: stats.boxDistribution[2] || 0,
        box3: stats.boxDistribution[3] || 0,
        mastered: stats.boxDistribution[3] || 0,
      });
    } catch {
      console.error('Failed to load question stats');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Keep progress, clear session cache (allows new question order)
  const handleRefreshSession = () => {
    try {
      localStorage.removeItem('leitner-current-session');
      localStorage.removeItem('quiz-practice-state');
      localStorage.removeItem('quiz-leitner-state');
      showMessage('success', 'Session cleared! Refresh the page for new question order.');
      loadStats();
    } catch {
      showMessage('error', 'Failed to clear session');
    }
  };

  // Clear everything except Leitner progress
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
      
      // Restore progress
      if (progressData) {
        localStorage.setItem('leitner-progress', progressData);
      }
      
      showMessage('success', 'Cache cleared! Your learning progress is preserved. Refresh the page.');
      loadStats();
    } catch {
      showMessage('error', 'Failed to clear cache');
    }
  };

  // Nuclear option - clear everything
  const handleClearAll = () => {
    if (confirm('This will DELETE all your learning progress. Are you sure?')) {
      try {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        showMessage('success', 'All data cleared. Refresh the page.');
        loadStats();
        loadQuestionStats();
      } catch {
        showMessage('error', 'Failed to clear data');
      }
    }
  };

  // Force reload from server
  const handleForceReload = () => {
    handleRefreshSession();
    window.location.reload();
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Console</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
          Back to Quiz
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Question Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Question Pool
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : questionStats ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="ml-2 font-mono">{questionStats.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">After Filtering:</span>
                <span className="ml-2 font-mono">{questionStats.filtered}</span>
              </div>
              <div>
                <span className="text-muted-foreground">In Progress:</span>
                <span className="ml-2 font-mono">{questionStats.inProgress}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mastered (Box 3):</span>
                <span className="ml-2 font-mono">{questionStats.mastered}</span>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <span className="text-muted-foreground">Box Distribution:</span>
                <div className="flex gap-4 mt-1">
                  <span className="font-mono text-red-500">Box 1: {questionStats.box1}</span>
                  <span className="font-mono text-yellow-500">Box 2: {questionStats.box2}</span>
                  <span className="font-mono text-green-500">Box 3: {questionStats.box3}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load stats</p>
          )}
        </CardContent>
      </Card>

      {/* Storage Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageStats ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total Size:</span>
                <span className="ml-2 font-mono">{storageStats.totalSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Keys:</span>
                <span className="ml-2 font-mono">{storageStats.totalKeys}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Progress Data:</span>
                <span className="ml-2 font-mono">{(storageStats.leitnerProgress / 1024).toFixed(1)} KB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Session Cache:</span>
                <span className="ml-2 font-mono">{(storageStats.sessionData / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load storage stats</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Recommended action */}
          <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">Refresh Session (Recommended)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clears session cache for new question order. Keeps all your learning progress.
                </p>
                <Button 
                  className="mt-2" 
                  size="sm"
                  onClick={handleRefreshSession}
                >
                  Clear Session Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Clear cache keep progress */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">Clear All Cache (Keep Progress)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clears all cached data but preserves your Leitner box progress.
                </p>
                <Button 
                  variant="outline"
                  className="mt-2" 
                  size="sm"
                  onClick={handleClearCacheKeepProgress}
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Force reload */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">Force Reload</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clear session cache and immediately reload the page.
                </p>
                <Button 
                  variant="outline"
                  className="mt-2" 
                  size="sm"
                  onClick={handleForceReload}
                >
                  Clear & Reload
                </Button>
              </div>
            </div>
          </div>

          {/* Nuclear option */}
          <div className="p-3 border rounded-lg border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Reset Everything</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Deletes ALL data including your learning progress. Cannot be undone.
                </p>
                <Button 
                  variant="destructive"
                  className="mt-2" 
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Same questions appearing?</strong> Click "Clear Session Cache" then refresh.</p>
          <p><strong>Wrong question count?</strong> Click "Clear & Reload" to fetch latest from server.</p>
          <p><strong>App acting weird?</strong> Try "Clear All Cache (Keep Progress)" first.</p>
          <p><strong>Starting fresh?</strong> Use "Reset Everything" to wipe all data.</p>
        </CardContent>
      </Card>
    </div>
  );
}
