'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStoredSyncCode,
  sync,
  getLastSyncTime,
  SyncResponse,
} from '@/lib/sync-client';
import { debug } from '@/lib/logger';

interface UseSyncReturn {
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<SyncResponse | null>;
  error: string | null;
}

export function useSync(): UseSyncReturn {
  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize state
  useEffect(() => {
    setLastSyncTime(getLastSyncTime());
  }, []);

  // Stable reference — no deps on isSyncing so effects don't re-register
  const syncNow = useCallback(async () => {
    const code = getStoredSyncCode();
    if (!code) {
      debug('Sync skipped: No sync code found');
      return null;
    }

    if (isSyncingRef.current) return null;

    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      setError(null);
      debug('🔄 Auto-sync started');
      const result = await sync(code);

      if (result.success) {
        setLastSyncTime(result.lastSync || new Date().toISOString());
        debug('✅ Auto-sync completed');
      } else {
        setError(result.error || 'Sync failed');
        console.error('Auto-sync failed:', result.error);
      }
      return result;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      console.error('Auto-sync error:', e);
      return { success: false, error: errorMessage };
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // 1. Sync on Mount (if code exists)
  useEffect(() => {
    const code = getStoredSyncCode();
    if (code) {
      syncNow();
    }
  }, [syncNow]);

  // 2. Sync on Visibility Change (switching tabs/apps)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const code = getStoredSyncCode();
        if (code) {
          debug('👁️ App visible - triggering sync');
          syncNow();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncNow]);

  return {
    isSyncing,
    lastSyncTime,
    syncNow,
    error,
  };
}
