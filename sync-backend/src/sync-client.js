/**
 * Sync Client Library
 * 
 * A simple client library for syncing quiz data across devices.
 * Can be integrated into both quiz-app and modern-quiz-app.
 * 
 * Usage:
 * ```javascript
 * import { SyncClient } from './sync-client';
 * 
 * const sync = new SyncClient('http://localhost:3001');
 * 
 * // Upload local data to server
 * await sync.push();
 * 
 * // Download data from server
 * await sync.pull();
 * 
 * // Two-way sync (merge strategy)
 * await sync.sync();
 * ```
 */

export class SyncClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Get or create a unique device ID
   */
  getOrCreateDeviceId() {
    const storageKey = 'quiz_device_id';
    
    if (typeof window === 'undefined') {
      return null; // SSR safety
    }

    try {
      let deviceId = localStorage.getItem(storageKey);
      
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = this.generateDeviceId();
        localStorage.setItem(storageKey, deviceId);
      }
      
      return deviceId;
    } catch {
      console.warn('Could not access localStorage for device ID');
      return this.generateDeviceId(); // Use session-only ID
    }
  }

  /**
   * Generate a unique device ID
   */
  generateDeviceId() {
    // Use crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback to timestamp + random
    return `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Collect all local data from localStorage
   */
  collectLocalData() {
    if (typeof window === 'undefined') return null;

    try {
      const data = {
        quizProgress: {},
        answeredQuestions: {},
        leitnerProgress: {},
        settings: {}
      };

      // Collect all quiz-related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const value = localStorage.getItem(key);
          if (!value) continue;

          // Categorize by key prefix
          if (key.startsWith('quiz_progress_')) {
            data.quizProgress[key] = JSON.parse(value);
          } else if (key === 'quiz_answered_global') {
            data.answeredQuestions = JSON.parse(value);
          } else if (key === 'leitner_progress' || key.startsWith('leitner_')) {
            data.leitnerProgress[key] = JSON.parse(value);
          } else if (key.startsWith('quiz_settings') || key.startsWith('leitner_settings')) {
            data.settings[key] = JSON.parse(value);
          }
        } catch (error) {
          console.warn(`Failed to parse localStorage item: ${key}`, error);
        }
      }

      return data;
    } catch (error) {
      console.error('Error collecting local data:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  saveLocalData(data) {
    if (typeof window === 'undefined' || !data) return;

    try {
      // Save quiz progress
      if (data.quizProgress) {
        Object.entries(data.quizProgress).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
          }
        });
      }

      // Save answered questions
      if (data.answeredQuestions) {
        try {
          localStorage.setItem('quiz_answered_global', JSON.stringify(data.answeredQuestions));
        } catch (error) {
          console.warn('Failed to save answered questions:', error);
        }
      }

      // Save Leitner progress
      if (data.leitnerProgress) {
        Object.entries(data.leitnerProgress).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
          }
        });
      }

      // Save settings
      if (data.settings) {
        Object.entries(data.settings).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error saving local data:', error);
    }
  }

  /**
   * Push local data to server
   */
  async push() {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    const localData = this.collectLocalData();
    if (!localData) {
      throw new Error('Failed to collect local data');
    }

    const response = await fetch(`${this.baseUrl}/api/sync/${this.deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(localData),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Pull data from server and save locally
   */
  async pull() {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    const response = await fetch(`${this.baseUrl}/api/sync/${this.deviceId}`);

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      this.saveLocalData(result.data);
      return result;
    }

    return result;
  }

  /**
   * Two-way sync: merge local and remote data
   * Strategy: Keep most recent data based on timestamps
   */
  async sync() {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    // Get remote data
    const pullResult = await this.pull();
    const remoteData = pullResult.data;

    // Get local data
    const localData = this.collectLocalData();

    // If no remote data, just push
    if (!remoteData) {
      return await this.push();
    }

    // Merge strategy: combine data intelligently
    const mergedData = this.mergeData(localData, remoteData);

    // Save merged data locally
    this.saveLocalData(mergedData);

    // Push merged data to server
    const pushResult = await this.push();

    return {
      success: true,
      merged: true,
      lastSync: pushResult.lastSync
    };
  }

  /**
   * Merge local and remote data
   * Strategy: Union of all data (keep all progress from both sources)
   */
  mergeData(local, remote) {
    const merged = {
      quizProgress: { ...remote.quizProgress, ...local.quizProgress },
      answeredQuestions: this.mergeAnsweredQuestions(
        local.answeredQuestions,
        remote.answeredQuestions
      ),
      leitnerProgress: { ...remote.leitnerProgress, ...local.leitnerProgress },
      settings: { ...remote.settings, ...local.settings }
    };

    return merged;
  }

  /**
   * Merge answered questions (union of question IDs per topic)
   */
  mergeAnsweredQuestions(local, remote) {
    const merged = { ...remote };

    Object.entries(local).forEach(([topic, questionIds]) => {
      if (merged[topic]) {
        // Combine and deduplicate
        merged[topic] = [...new Set([...merged[topic], ...questionIds])];
      } else {
        merged[topic] = questionIds;
      }
    });

    return merged;
  }

  /**
   * Clear all synced data from server
   */
  async clearRemote() {
    if (!this.deviceId) {
      throw new Error('No device ID available');
    }

    const response = await fetch(`${this.baseUrl}/api/sync/${this.deviceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Clear failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check server health
   */
  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }
}

/**
 * Get the global sync client instance
 */
let syncClientInstance = null;

export function getSyncClient(baseUrl) {
  if (!syncClientInstance) {
    syncClientInstance = new SyncClient(baseUrl);
  }
  return syncClientInstance;
}

export default SyncClient;
