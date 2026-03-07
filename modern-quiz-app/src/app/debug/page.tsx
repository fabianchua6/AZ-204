'use client';

import { leitnerSystem } from '@/lib/leitner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { questionService } from '@/lib/question-service';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Cloud,
  Copy,
  Download,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import {
  generateSyncCode,
  isValidCustomSyncCode,
} from '@/lib/generate-sync-code';
import {
  pullData,
  sync,
  getStoredSyncCode,
  getLastSyncTime,
} from '@/lib/sync-client';

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
  const { theme, setTheme } = useTheme();
  const { questions, loading } = useQuizData();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [syncCode, setSyncCode] = useState<string>('');
  const [syncInput, setSyncInput] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showFullChangelog, setShowFullChangelog] = useState(false);

  useEffect(() => {
    document.title = 'Settings - AZ-204 Quiz';
    loadStats();
    // Load existing sync info
    const storedCode = getStoredSyncCode();
    if (storedCode) setSyncCode(storedCode);
    setLastSync(getLastSyncTime());
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
          if (
            key.includes('leitner-current-session') ||
            key.includes('quiz-')
          ) {
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

  // Keys to always preserve across any action
  const preserveKeys = ['theme', 'quiz_sync_code', 'quiz_last_sync'];

  const handleRefreshSession = () => {
    try {
      localStorage.removeItem('leitner-current-session');
      localStorage.removeItem('leitner-submission-states');
      localStorage.removeItem('leitner-quiz-index');
      showMessage('success', 'Session refreshed! Reloading…');
      loadStats();
      setTimeout(() => window.location.reload(), 500);
    } catch {
      showMessage('error', 'Failed to refresh session');
    }
  };

  const handleClearCacheKeepProgress = () => {
    try {
      const progressData = localStorage.getItem('leitner-progress');
      const preserved: Record<string, string> = {};
      preserveKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v) preserved[k] = v;
      });

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'leitner-progress' && !preserveKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (progressData) {
        localStorage.setItem('leitner-progress', progressData);
      }
      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

      showMessage('success', 'Cache cleared, progress & sync code saved.');
      loadStats();
    } catch {
      showMessage('error', 'Failed to clear cache');
    }
  };

  const handleClearAll = () => {
    if (resetConfirmText.toLowerCase() !== 'confirm') return;
    try {
      const preserved: Record<string, string> = {};
      preserveKeys.forEach(k => {
        const v = localStorage.getItem(k);
        if (v) preserved[k] = v;
      });

      localStorage.clear();

      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

      setResetConfirmOpen(false);
      setResetConfirmText('');
      showMessage('success', 'All progress cleared. Sync code preserved.');
      loadStats();
      loadQuestionStats();
    } catch {
      showMessage('error', 'Failed to clear data');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-sm'>
        <div className='container mx-auto flex max-w-2xl items-center gap-3 px-4 py-3'>
          <Link
            href='/'
            className='-ml-2 rounded-lg p-2 transition-colors hover:bg-muted'
          >
            <ChevronLeft className='h-5 w-5' />
          </Link>
          <h1 className='text-lg font-semibold'>Settings</h1>
        </div>
      </header>

      <div className='container mx-auto max-w-2xl space-y-8 px-4 py-6'>
        {/* Toast Message */}
        {message && (
          <div
            className={`fixed left-4 right-4 top-20 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg sm:left-1/2 sm:right-auto sm:w-max sm:min-w-72 sm:max-w-sm sm:-translate-x-1/2 sm:px-5 sm:py-3.5 ${
              message.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className='h-5 w-5 shrink-0' />
            ) : (
              <XCircle className='h-5 w-5 shrink-0' />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats Overview */}
        <section>
          <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Overview
          </h2>
          <div className='grid grid-cols-2 gap-3'>
            {/* Questions */}
            <div className='rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4'>
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {loading ? '...' : questionStats?.total || 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Questions
              </div>
            </div>
            {/* In Progress */}
            <div className='rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4'>
              <div className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                {loading ? '...' : questionStats?.inProgress || 0}
              </div>
              <div className='text-sm text-muted-foreground'>In Progress</div>
            </div>
            {/* Mastered */}
            <div className='rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-4'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {loading ? '...' : questionStats?.mastered || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Mastered</div>
            </div>
            {/* Storage */}
            <div className='rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4'>
              <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                {storageStats?.totalSize || '0 KB'}
              </div>
              <div className='text-sm text-muted-foreground'>Storage Used</div>
            </div>
          </div>
        </section>

        {/* Box Distribution */}
        {questionStats && (
          <section>
            <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              Learning Progress
            </h2>
            <div className='flex gap-2'>
              <div className='flex-1 rounded-lg border border-red-500/20 bg-red-500/10 py-3 text-center'>
                <div className='text-xl font-bold text-red-500'>
                  {questionStats.box1}
                </div>
                <div className='text-xs text-muted-foreground'>Box 1</div>
              </div>
              <div className='flex-1 rounded-lg border border-amber-500/20 bg-amber-500/10 py-3 text-center'>
                <div className='text-xl font-bold text-amber-500'>
                  {questionStats.box2}
                </div>
                <div className='text-xs text-muted-foreground'>Box 2</div>
              </div>
              <div className='flex-1 rounded-lg border border-green-500/20 bg-green-500/10 py-3 text-center'>
                <div className='text-xl font-bold text-green-500'>
                  {questionStats.box3}
                </div>
                <div className='text-xs text-muted-foreground'>Box 3</div>
              </div>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section>
          <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Appearance
          </h2>
          <div className='overflow-hidden rounded-xl border border-border bg-card'>
            <div className='px-4 py-3'>
              <p className='mb-3 text-sm text-muted-foreground'>Theme</p>
              <div className='grid grid-cols-3 gap-2'>
                {(
                  [
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      theme === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cloud Sync */}
        <section>
          <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Cloud Sync
          </h2>
          <div className='overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5'>
            {/* Sync code display — only when a code exists */}
            {syncCode && (
              <div className='border-b border-blue-500/10 px-4 pb-3 pt-4'>
                <div className='mb-1 flex items-center justify-between'>
                  <span className='text-xs text-muted-foreground'>
                    Your Sync Code
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(syncCode);
                      showMessage('success', 'Code copied!');
                    }}
                    className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-blue-500 transition-colors hover:bg-blue-500/10'
                  >
                    <Copy className='h-3 w-3' />
                    Copy
                  </button>
                </div>
                <div className='font-mono text-2xl font-bold tracking-widest text-blue-600 dark:text-blue-400'>
                  {syncCode}
                </div>
                {lastSync && (
                  <div className='mt-1 text-xs text-muted-foreground'>
                    Last synced: {new Date(lastSync).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Backup to Cloud */}
            <button
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  const code = syncCode || generateSyncCode();
                  // Use sync() instead of pushData() to merge remote changes instead of overwriting
                  await sync(code);
                  setSyncCode(code);
                  setLastSync(new Date().toISOString());
                  showMessage('success', `Backed up to ${code}`);
                } catch (e) {
                  console.error(e);
                  showMessage('error', 'Backup failed. Try again.');
                } finally {
                  setSyncing(false);
                }
              }}
              className='flex w-full items-center gap-3 border-b border-blue-500/10 px-4 py-3.5 text-left transition-colors hover:bg-blue-500/10 disabled:opacity-50'
            >
              <Cloud className='h-4 w-4 shrink-0 text-blue-500' />
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                  {syncing
                    ? 'Backing up...'
                    : syncCode
                      ? 'Update Backup'
                      : 'Sync / Backup'}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {syncCode
                    ? 'Push latest progress to cloud'
                    : 'Generate a sync code & save'}
                </div>
              </div>
            </button>

            {/* Restore from another device */}
            <div className='space-y-2 px-4 py-3.5'>
              <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                <Download className='h-3.5 w-3.5 shrink-0' />
                Restore from another device
              </div>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <input
                  type='text'
                  placeholder='Enter code (e.g. AZ-X7K9M2)'
                  value={syncInput}
                  onChange={e => setSyncInput(e.target.value.toUpperCase())}
                  className='min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                  maxLength={11}
                />
                <button
                  disabled={syncing || !syncInput}
                  onClick={async () => {
                    if (!isValidCustomSyncCode(syncInput)) {
                      showMessage('error', 'Invalid code format');
                      return;
                    }
                    setSyncing(true);
                    try {
                      const result = await pullData(syncInput.toUpperCase());
                      if (result.data) {
                        setSyncCode(syncInput.toUpperCase());
                        setLastSync(result.lastSync || null);
                        showMessage('success', 'Restored! Reloading...');
                        setTimeout(() => window.location.reload(), 1000);
                      } else {
                        showMessage('error', 'No data found for this code');
                      }
                    } catch (e) {
                      console.error(e);
                      showMessage(
                        'error',
                        'Restore failed. Check code & try again.'
                      );
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  className='w-full shrink-0 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 sm:w-auto'
                >
                  {syncing ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section>
          <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Actions
          </h2>
          <div className='space-y-2'>
            {/* Primary Action */}
            <button
              onClick={handleRefreshSession}
              className='flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15'
            >
              <div className='rounded-lg bg-primary/20 p-2'>
                <RefreshCw className='h-5 w-5 text-primary' />
              </div>
              <div className='flex-1'>
                <div className='font-medium'>Refresh Session</div>
                <div className='text-sm text-muted-foreground'>
                  New question order, keeps progress & reloads page
                </div>
              </div>
              <Sparkles className='h-4 w-4 text-primary' />
            </button>

            {/* Secondary Action */}
            <button
              onClick={handleClearCacheKeepProgress}
              className='flex w-full items-center gap-3 rounded-xl border border-border/50 p-4 text-left transition-colors hover:bg-muted/50'
            >
              <div className='rounded-lg bg-muted p-2'>
                <RotateCcw className='h-5 w-5 text-muted-foreground' />
              </div>
              <div className='flex-1'>
                <div className='font-medium'>Clear Cache</div>
                <div className='text-sm text-muted-foreground'>
                  Removes temporary data, keeps learning progress & sync code
                </div>
              </div>
            </button>

            {/* Danger Zone */}
            <button
              onClick={() => setResetConfirmOpen(true)}
              className='mt-4 flex w-full items-center gap-3 rounded-xl border border-destructive/30 p-4 text-left transition-colors hover:bg-destructive/10'
            >
              <div className='rounded-lg bg-destructive/20 p-2'>
                <Trash2 className='h-5 w-5 text-destructive' />
              </div>
              <div className='flex-1'>
                <div className='font-medium text-destructive'>
                  Reset Everything
                </div>
                <div className='text-sm text-muted-foreground'>
                  Deletes all progress permanently (sync code is preserved)
                </div>
              </div>
              <AlertTriangle className='h-4 w-4 text-destructive' />
            </button>
          </div>
        </section>

        {/* Reset Confirmation Dialog */}
        {resetConfirmOpen && (
          <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
            <div className='w-full max-w-sm space-y-4 rounded-2xl border border-border bg-background p-6 shadow-xl'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-destructive/20 p-2'>
                  <AlertTriangle className='h-5 w-5 text-destructive' />
                </div>
                <h3 className='text-lg font-semibold'>Reset Everything</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                This will permanently delete all your learning progress, quiz
                history, and session data. Your sync code will be preserved.
              </p>
              <p className='text-sm font-medium'>
                Type{' '}
                <span className='rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-destructive'>
                  confirm
                </span>{' '}
                to proceed:
              </p>
              <input
                type='text'
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                placeholder='Type confirm here'
                className='w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-destructive/50 focus:ring-1 focus:ring-destructive/30'
                autoFocus
                onKeyDown={e => {
                  if (
                    e.key === 'Enter' &&
                    resetConfirmText.toLowerCase() === 'confirm'
                  ) {
                    handleClearAll();
                  }
                }}
              />
              <div className='flex gap-2'>
                <button
                  onClick={() => {
                    setResetConfirmOpen(false);
                    setResetConfirmText('');
                  }}
                  className='flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={resetConfirmText.toLowerCase() !== 'confirm'}
                  className='flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Changelog */}
        <section>
          <h2 className='mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Changelog
          </h2>
          <div className='space-y-4 text-sm'>
            {[
              {
                version: 'v1.11.5',
                date: 'Mar 3, 2026',
                isLatest: true,
                items: [
                  <>
                    ✦ Replaced hand-rolled haptic implementation with the{' '}
                    <code>web-haptics</code> library (
                    <a
                      href='https://haptics.lochie.me/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline'
                    >
                      haptics.lochie.me
                    </a>
                    ) for robust iOS Safari &amp; Android support
                  </>,
                  <>
                    ✦ Fixed Daily Brief dismiss handler TypeScript error with
                    React event types
                  </>,
                ],
              },
              {
                version: 'v1.11.4',
                date: 'Mar 3, 2026',
                items: [
                  <>
                    ✦ Haptics now work on iOS Safari via the hidden-label click
                    trick (bypasses Vibration API restriction)
                  </>,
                  <>
                    ✦ Multi-pulse patterns (success, warning, error) replay on
                    iOS using scheduled label clicks
                  </>,
                ],
              },
              {
                version: 'v1.11.3',
                date: 'Mar 3, 2026',
                items: [
                  <>
                    ✦ Added haptic to &ldquo;Continue Learning&rdquo; and
                    &ldquo;View Progress&rdquo; buttons in quiz completion modal
                  </>,
                  <>✦ Added haptic to topic-selector buttons (topic grid)</>,
                  <>
                    ✦ Added haptic to &ldquo;Finish&rdquo; (End Session) button
                    in the quiz action bar
                  </>,
                ],
              },
              {
                version: 'v1.11.2',
                date: 'Mar 3, 2026',
                items: [
                  <>
                    ✦ Extended haptic feedback to the Session Results
                    &ldquo;Start New Session&rdquo; button
                  </>,
                  <>
                    ✦ Added haptic feedback on Daily Brief tap-dismiss (light)
                    and swipe-dismiss (warning double-tap)
                  </>,
                ],
              },
              {
                version: 'v1.11.1',
                date: 'Feb 26, 2026',
                items: [
                  <>
                    ✦ Fixed &ldquo;X left&rdquo; showing stale data on the
                    session results page by bypassing the stats cache after each
                    answer submission
                  </>,
                ],
              },
              {
                version: 'v1.11.0',
                date: 'Feb 26, 2026',
                items: [
                  <>
                    ✦ Added keyboard shortcuts for the quiz on desktop: 1-9 to
                    select options, ← for previous, → or Enter for submit/next
                  </>,
                ],
              },
              {
                version: 'v1.10.10',
                date: 'Feb 23, 2026',
                items: [
                  <>
                    ✦ App now waits for initial sync to finish before leaving
                    the loading screen
                  </>,
                  <>
                    ✦ Daily Brief is now shown only after startup sync completes
                    so it reflects the latest pulled and pushed activity
                  </>,
                  <>
                    ✦ Added startup loading coverage to ensure sync gating
                    behavior stays intact
                  </>,
                ],
              },
              {
                version: 'v1.10.9',
                date: 'Feb 20, 2026',
                items: [
                  <>
                    ✦ Fixed already-answered questions reappearing after syncing
                    progress from another device
                  </>,
                  <>
                    ✦ Session state (current session, submission states, quiz
                    index) is now treated as device-local and is never
                    overwritten by a remote sync
                  </>,
                  <>
                    ✦ Leitner progress is now reloaded from storage immediately
                    after a successful sync so due-question calculations are
                    always up to date
                  </>,
                ],
              },
              {
                version: 'v1.10.8',
                date: 'Feb 20, 2026',
                items: [
                  <>
                    ✦ Added swipe-down dismissal support from anywhere inside
                    the Daily Brief sheet, not only the pull handle
                  </>,
                  <>
                    ✦ Preserved in-sheet scroll behavior by only starting sheet
                    drag when content is already at the top
                  </>,
                ],
              },
              {
                version: 'v1.10.7',
                date: 'Feb 20, 2026',
                items: [
                  <>
                    ✦ Added real-time pull-handle drag feedback so the Daily
                    Brief sheet now visibly follows finger movement on iPhone
                  </>,
                  <>
                    ✦ Tuned swipe-down dismissal to work with live drag distance
                    for a more native sheet interaction
                  </>,
                ],
              },
              {
                version: 'v1.10.6',
                date: 'Feb 20, 2026',
                items: [
                  <>
                    ✦ Fixed Daily Brief so background content no longer scrolls
                    while the sheet is open on iPhone
                  </>,
                  <>
                    ✦ Added swipe-down dismissal from the Daily Brief pull
                    handle for more natural mobile sheet behavior
                  </>,
                ],
              },
              {
                version: 'v1.10.5',
                date: 'Feb 20, 2026',
                items: [
                  <>
                    ✦ Fixed Daily Brief sheet scrolling on iPhone by enabling
                    touch momentum scrolling in the sheet content area
                  </>,
                  <>
                    ✦ Improved touch gesture handling for vertical pan inside
                    the Daily Brief bottom sheet to prevent stuck scroll
                  </>,
                ],
              },
              {
                version: 'v1.10.4',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Fixed sync collisions for shared Leitner keys so remote
                    and local data now merge instead of silently dropping one
                    side
                  </>,
                  <>
                    ✦ Added key-aware merge rules for leitner-progress, daily
                    attempts, submission states, current session, and quiz index
                  </>,
                  <>
                    ✦ Added sync regression tests to keep "questions left"
                    counts and progress state consistent across devices
                  </>,
                ],
              },
              {
                version: 'v1.10.3',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Fixed streak display on the main quiz card by deriving
                    streak from daily activity history first
                  </>,
                  <>
                    ✦ Added fallback to legacy progress-based streak logic when
                    daily history is unavailable
                  </>,
                  <>
                    ✦ Added dedicated Leitner streak regression tests for
                    yesterday-start streaks and gap handling
                  </>,
                ],
              },
              {
                version: 'v1.10.2',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Added sync-client edge-case tests for streak merge
                    fallback behavior when local or remote streak data is
                    partial
                  </>,
                  <>
                    ✦ Added debug-page safety tests for Clear Cache and guarded
                    Reset Everything flows
                  </>,
                  <>
                    ✦ Verified full suite at 144 passing tests and clean
                    TypeScript build after QA expansion
                  </>,
                ],
              },
              {
                version: 'v1.10.1',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Added QA regression suites for DashboardStats and Daily
                    Brief component flows
                  </>,
                  <>
                    ✦ Added automation suites for Home page orchestration and
                    Session Results CTA behavior
                  </>,
                  <>
                    ✦ Strengthened useLeitnerStats tests for debounce timing,
                    stale timer cleanup, and failure resilience
                  </>,
                  <>
                    ✦ Expanded useLeitnerSession tests for expired/invalid saved
                    sessions and end-session timing guards
                  </>,
                  <>
                    ✦ Added 24 new automated tests across high-risk async, UI,
                    and orchestration branches
                  </>,
                ],
              },
              {
                version: 'v1.10.0',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Unified two divergent DashboardStats components into one
                    with a compact/full section mode
                  </>,
                  <>
                    ✦ Extracted shared LeitnerBoxBar component — replaces
                    copy-pasted box distribution UI in 3 places
                  </>,
                  <>
                    ✦ Routed useLeitnerStats through QuestionService cache for
                    consistent filtered stats everywhere
                  </>,
                  <>✦ Fixed Daily Brief showing unfiltered question counts</>,
                  <>
                    ✦ Fixed streak sync resurrecting dead streaks across devices
                    — only bestStreak and lastStudyDate are merged now
                  </>,
                  <>
                    ✦ Deduplicated date formatting (4 variants → canonical
                    DateUtils), shuffleArray (2 copies → 1), and
                    EnhancedQuizStats type (2 definitions → 1 export)
                  </>,
                  <>
                    ✦ Fixed useSync stale closure causing effect re-registration
                    on every sync cycle
                  </>,
                  <>
                    ✦ Removed 8 dead files (~600+ lines) and 2 dead utility
                    functions
                  </>,
                ],
              },
              {
                version: 'v1.9.1',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Fixed streak display on Learning Dashboard — now uses
                    Leitner system&apos;s robust streak calculation instead of
                    naive day-counter that only updated on dashboard visits
                  </>,
                  <>
                    ✦ Best Streak now correctly persists and syncs across
                    sessions
                  </>,
                ],
              },
              {
                version: 'v1.9.0',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Deep data layer cleanup — removed 8 dead/orphaned
                    localStorage keys and their sync baggage
                  </>,
                  <>
                    ✦ One-time storage migration runs on first load to prune
                    legacy keys (quiz_progress_*, quiz_answered_global,
                    quiz-practice-state, etc.)
                  </>,
                  <>
                    ✦ Sync collector rewritten with explicit allowlist — no
                    longer ships dead data to Redis via greedy prefix sweep
                  </>,
                  <>
                    ✦ Retired answeredQuestions sync bucket — Leitner system is
                    the sole source of truth
                  </>,
                  <>
                    ✦ Study streak date format standardized to YYYY-MM-DD (ISO)
                    — migration auto-converts old format
                  </>,
                  <>
                    ✦ Deleted orphaned use-smart-learning hook and legacy
                    leitner-stats storage key
                  </>,
                ],
              },
              {
                version: 'v1.8.3',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Fixed PDF parser dropping inline explanations — 3
                    questions (SAS, Always Encrypted, Managed Identity) now show
                    their explanations
                  </>,
                  <>
                    ✦ Study streaks now sync across devices — current streak,
                    best streak, and last study date are included in cloud sync
                  </>,
                  <>
                    ✦ Daily brief state syncs across devices — dismissal carries
                    over
                  </>,
                  <>
                    ✦ Smart streak merge — sync picks the higher streak values
                    and most recent study date between devices
                  </>,
                  <>
                    ✦ Rebuilt all data files — src/data and public/data now
                    verified in sync
                  </>,
                ],
              },
              {
                version: 'v1.8.2',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Smart sync merge — syncing now pulls remote first and
                    unions both devices&apos; answers before pushing
                  </>,
                  <>
                    ✦ Sync pull no longer throws on server errors — returns a
                    clean error instead
                  </>,
                  <>
                    ✦ Server now accepts custom sync codes (e.g.{' '}
                    <span className='font-mono'>AZ-FABIAN</span>) end-to-end
                  </>,
                  <>✦ Daily Brief sheet constrained to a card on desktop</>,
                ],
              },
              {
                version: 'v1.8.1',
                date: 'Feb 2026',
                items: [
                  <>
                    ✦ Fixed sync backup — &ldquo;Update Backup&rdquo; was
                    silently failing due to missing export
                  </>,
                  <>
                    ✦ Custom sync codes — codes like{' '}
                    <span className='font-mono'>AZ-FABIAN</span> now accepted
                    (3–8 alphanumeric chars after{' '}
                    <span className='font-mono'>AZ-</span>)
                  </>,
                  <>
                    ✦ Change Sync Code — migrate all progress to a new or custom
                    code within Settings
                  </>,
                ],
              },
              {
                version: 'v1.8.0',
                date: 'Feb 19, 2026',
                items: [
                  <>
                    ✦ Daily Brief — slide-up sheet with stats and heatmap on
                    first daily visit
                  </>,
                  <>✦ Activity heatmap now fully responsive on mobile</>,
                  <>✦ Removed heatmap legend; expanded to 15 weeks</>,
                  <>✦ Heatmap moved above stats cards on Dashboard</>,
                ],
              },
              {
                version: 'v1.7.0',
                date: 'Feb 19, 2026',
                items: [
                  <>✦ GitHub-style daily activity heatmap on Dashboard</>,
                  <>✦ Extended daily activity history retention to 90 days</>,
                  <>
                    ✦ Moved theme toggle to Settings — Light / Dark / System
                    picker
                  </>,
                ],
              },
              {
                version: 'v1.6.0',
                date: 'Feb 2026',
                items: [
                  <>
                    ✦ Cross-device sync backend via Upstash Redis with sync
                    codes
                  </>,
                  <>✦ Auto-sync progress to cloud on session completion</>,
                  <>✦ PDF questions prioritised before non-PDF in sessions</>,
                  <>✦ Unified Cloud Sync card with mobile-responsive layout</>,
                  <>✦ Fixed stale submission states on session refresh</>,
                  <>✦ Rewrote 5 blank question explanations for accuracy</>,
                ],
              },
              {
                version: 'v1.5.1',
                date: 'Jan 14, 2026',
                items: [
                  <>✦ Replaced hardcoded colors with semantic design tokens</>,
                  <>✦ Success and warning button variants</>,
                  <>✦ Fixed iOS font size overrides (rem → px)</>,
                  <>✦ Removed non-exam &quot;awesomeness&quot; question</>,
                ],
              },
              {
                version: 'v1.5.0',
                date: 'Jan 5, 2026',
                items: [
                  <>✦ Redesigned Settings page with modern minimal aesthetic</>,
                  <>✦ Added Changelog section</>,
                  <>✦ Disabled iOS Dynamic Type font scaling</>,
                ],
              },
              {
                version: 'v1.4.1',
                date: 'Dec 26–28, 2025',
                items: [
                  <>✦ Fixed Arc browser TLS error loop (HSTS, cache headers)</>,
                  <>✦ Upgraded Next.js to 15.5.9 (security patches)</>,
                  <>✦ Resolved conflicting Vercel/Next.js header config</>,
                ],
              },
              {
                version: 'v1.4.0',
                date: 'Dec 24, 2025',
                items: [
                  <>✦ Removed Practice Mode — single Leitner-only experience</>,
                  <>
                    ✦ Decomposed monolithic hook into session, progress, and
                    stats
                  </>,
                  <>✦ 80/20 PDF-to-non-PDF question split per session</>,
                  <>
                    ✦ Auto-hide header on scroll, sticky footer, mobile grid
                    layout
                  </>,
                ],
              },
              {
                version: 'v1.3.1',
                date: 'Dec 17–18, 2025',
                items: [
                  <>✦ Added &quot;End Quiz&quot; button after final question</>,
                  <>✦ Show answer feedback before session auto-complete</>,
                  <>✦ Fixed session refresh bug and sequence randomisation</>,
                ],
              },
              {
                version: 'v1.3.0',
                date: 'Oct – Dec 16, 2025',
                items: [
                  <>✦ Extracted 142 questions from exam PDF documents</>,
                  <>✦ Settings page for managing quiz progress</>,
                  <>✦ Custom AZ-204 favicon and haptic feedback on mobile</>,
                  <>
                    ✦ Performance pass — React.memo, debug logger, shared hook
                  </>,
                  <>✦ Improved randomisation and session auto-invalidation</>,
                  <>✦ Cleaned broken questions and fixed answer data</>,
                ],
              },
              {
                version: 'v1.2.0',
                date: 'Aug 22 – Sep 9, 2025',
                items: [
                  <>✦ PWA implementation attempted and cleanly reverted</>,
                  <>✦ Fixed critical localStorage iteration bug</>,
                  <>✦ Complete state isolation between quiz modes</>,
                  <>✦ Content audit — removed inappropriate questions</>,
                  <>✦ Completion celebration with session results breakdown</>,
                  <>✦ Dynamic browser tab titles and debug navigation</>,
                ],
              },
              {
                version: 'v1.1.0',
                date: 'Aug 19–21, 2025',
                items: [
                  <>✦ 3-box Leitner spaced repetition system</>,
                  <>
                    ✦ Quiz card redesign with dark mode and layered colour
                    system
                  </>,
                  <>✦ Dashboard with Leitner box distribution</>,
                  <>✦ Filtered code-block and solution-goal questions</>,
                  <>✦ Refactored codebase for engineering best practices</>,
                ],
              },
              {
                version: 'v1.0.0',
                date: 'Aug 18, 2025',
                items: [
                  <>✦ Next.js quiz app deployed on Vercel</>,
                  <>✦ Questions seeded from AZ-204 topic markdown files</>,
                  <>✦ Topic selector, quiz card, answer options</>,
                ],
              },
            ]
              .slice(0, showFullChangelog ? undefined : 3)
              .map((log, i) => (
                <div key={i}>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold'>{log.version}</span>
                    <span className='text-xs text-muted-foreground'>
                      {log.date}
                    </span>
                    {log.isLatest && (
                      <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
                        Latest
                      </span>
                    )}
                  </div>
                  <ul className='mt-1 space-y-0.5 text-muted-foreground'>
                    {log.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>

          <button
            onClick={() => setShowFullChangelog(!showFullChangelog)}
            className='mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline'
          >
            {showFullChangelog ? (
              <>
                <ChevronUp className='h-3 w-3' />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className='h-3 w-3' />
                See more
              </>
            )}
          </button>
        </section>

        {/* App Info */}
        <section className='pb-8'>
          <div className='text-center text-xs text-muted-foreground'>
            <div>AZ-204 Quiz App</div>
            <div className='mt-1'>Made with ❤️ for Azure certification</div>
          </div>
        </section>
      </div>
    </div>
  );
}
