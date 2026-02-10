/**
 * Simple Express server for syncing quiz progress across devices
 * 
 * This is a minimal backend that:
 * 1. Stores quiz progress data per device/user
 * 2. Provides REST API endpoints for sync operations
 * 3. Uses file system for simple persistent storage (can be upgraded to Azure Blob Storage)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, '../data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

/**
 * GET /api/sync/:deviceId
 * Retrieve synced data for a device
 */
app.get('/api/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId || deviceId.length < 10) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    const filePath = path.join(DATA_DIR, `${deviceId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const syncData = JSON.parse(data);
      
      res.json({
        success: true,
        data: syncData,
        lastSync: syncData.lastSync || null
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        // No data yet for this device
        res.json({
          success: true,
          data: null,
          lastSync: null
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error getting sync data:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

/**
 * POST /api/sync/:deviceId
 * Save/update synced data for a device
 */
app.post('/api/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { quizProgress, answeredQuestions, leitnerProgress, settings } = req.body;
    
    if (!deviceId || deviceId.length < 10) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    const syncData = {
      quizProgress: quizProgress || {},
      answeredQuestions: answeredQuestions || {},
      leitnerProgress: leitnerProgress || {},
      settings: settings || {},
      lastSync: new Date().toISOString(),
      deviceId
    };

    const filePath = path.join(DATA_DIR, `${deviceId}.json`);
    await fs.writeFile(filePath, JSON.stringify(syncData, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: 'Data synced successfully',
      lastSync: syncData.lastSync
    });
  } catch (error) {
    console.error('Error saving sync data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

/**
 * DELETE /api/sync/:deviceId
 * Clear synced data for a device
 */
app.delete('/api/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId || deviceId.length < 10) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    const filePath = path.join(DATA_DIR, `${deviceId}.json`);
    
    try {
      await fs.unlink(filePath);
      res.json({
        success: true,
        message: 'Data cleared successfully'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          message: 'No data to clear'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error clearing sync data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /
 * Basic info endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'AZ-204 Quiz Sync Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      getSync: 'GET /api/sync/:deviceId',
      saveSync: 'POST /api/sync/:deviceId',
      clearSync: 'DELETE /api/sync/:deviceId'
    }
  });
});

// Start server
async function start() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`🚀 Sync backend running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health                - Health check`);
    console.log(`  GET  /api/sync/:deviceId    - Get synced data`);
    console.log(`  POST /api/sync/:deviceId    - Save synced data`);
    console.log(`  DELETE /api/sync/:deviceId  - Clear synced data`);
  });
}

start();
