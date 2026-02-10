# Integration Guide

This guide shows how to integrate the sync functionality into the quiz apps.

## For quiz-app (React Router)

### 1. Copy the sync client

Copy `sync-client.js` to `quiz-app/app/lib/`:

```bash
cp sync-backend/src/sync-client.js quiz-app/app/lib/sync-client.js
```

### 2. Add sync UI to settings page

Edit `quiz-app/app/routes/settings.tsx`:

```tsx
import { SyncClient } from '~/lib/sync-client';
import { useState } from 'react';

export default function Settings() {
  const [syncStatus, setSyncStatus] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  const syncClient = new SyncClient('http://localhost:3001'); // Or your deployed URL
  
  const handlePush = async () => {
    setSyncing(true);
    setSyncStatus('Uploading...');
    try {
      await syncClient.push();
      setSyncStatus('Upload successful! ✓');
    } catch (error) {
      setSyncStatus(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  const handlePull = async () => {
    setSyncing(true);
    setSyncStatus('Downloading...');
    try {
      await syncClient.pull();
      setSyncStatus('Download successful! ✓');
      window.location.reload(); // Reload to show synced data
    } catch (error) {
      setSyncStatus(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Syncing...');
    try {
      await syncClient.sync();
      setSyncStatus('Sync successful! ✓');
      window.location.reload(); // Reload to show synced data
    } catch (error) {
      setSyncStatus(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  // Add this to your settings UI
  return (
    // ... existing settings UI
    <div className="sync-section">
      <h2>Sync Across Devices</h2>
      <p>Your device ID: {syncClient.deviceId}</p>
      
      <div className="sync-buttons">
        <button onClick={handlePush} disabled={syncing}>
          ⬆️ Upload to Cloud
        </button>
        <button onClick={handlePull} disabled={syncing}>
          ⬇️ Download from Cloud
        </button>
        <button onClick={handleSync} disabled={syncing}>
          🔄 Two-Way Sync
        </button>
      </div>
      
      {syncStatus && <p className="sync-status">{syncStatus}</p>}
    </div>
  );
}
```

### 3. Auto-sync on app load (optional)

Edit `quiz-app/app/root.tsx`:

```tsx
import { useEffect } from 'react';
import { SyncClient } from '~/lib/sync-client';

export default function App() {
  useEffect(() => {
    // Auto-pull on app load (only if user has synced before)
    const syncClient = new SyncClient('http://localhost:3001');
    
    const lastSyncTime = localStorage.getItem('last_sync_time');
    if (lastSyncTime) {
      // Only auto-pull if last sync was more than 1 hour ago
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - parseInt(lastSyncTime) > oneHour) {
        syncClient.pull().then(() => {
          localStorage.setItem('last_sync_time', Date.now().toString());
        }).catch(err => {
          console.warn('Auto-sync failed:', err);
        });
      }
    }
  }, []);
  
  // ... rest of app
}
```

## For modern-quiz-app (Next.js)

### 1. Copy the sync client

Copy `sync-client.js` to `modern-quiz-app/src/lib/`:

```bash
cp sync-backend/src/sync-client.js modern-quiz-app/src/lib/sync-client.ts
# Rename to .ts and add types
```

### 2. Add sync component

Create `modern-quiz-app/src/components/SyncButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { SyncClient } from '@/lib/sync-client';

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('');
  
  const syncClient = new SyncClient(process.env.NEXT_PUBLIC_SYNC_URL || 'http://localhost:3001');
  
  const handleSync = async () => {
    setSyncing(true);
    setStatus('Syncing...');
    try {
      await syncClient.sync();
      setStatus('✓ Synced');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('✗ Error');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <button 
      onClick={handleSync} 
      disabled={syncing}
      className="sync-button"
    >
      {syncing ? '🔄' : '☁️'} Sync
      {status && <span>{status}</span>}
    </button>
  );
}
```

### 3. Add to settings page

Edit `modern-quiz-app/src/app/settings/page.tsx` and add the SyncButton component.

## Environment Variables

For production, set the sync backend URL:

### quiz-app
Create `.env`:
```
SYNC_BACKEND_URL=https://your-backend.azurewebsites.net
```

### modern-quiz-app
Create `.env.local`:
```
NEXT_PUBLIC_SYNC_URL=https://your-backend.azurewebsites.net
```

## Testing

1. Start the backend:
   ```bash
   cd sync-backend
   npm install
   npm start
   ```

2. Open quiz app in Browser 1
3. Answer some questions
4. Click "Upload to Cloud"
5. Open quiz app in Browser 2 (or incognito)
6. Click "Download from Cloud"
7. Verify progress is synced

## Production Deployment

See the backend README.md for deployment options to Azure.
