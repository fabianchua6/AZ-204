# 🚀 Quick Start Guide

Get your quiz data syncing across devices in 5 minutes!

## Step 1: Start the Backend

```bash
cd sync-backend
npm install
npm start
```

You should see:
```
🚀 Sync backend running on http://localhost:3001
📁 Data directory: /home/runner/work/AZ-204/AZ-204/sync-backend/data

Endpoints:
  GET  /health                - Health check
  GET  /api/sync/:deviceId    - Get synced data
  POST /api/sync/:deviceId    - Save synced data
  DELETE /api/sync/:deviceId  - Clear synced data
```

## Step 2: Test with Demo Page

1. Open `sync-backend/demo.html` in your browser
2. The page will automatically generate a device ID
3. Click "Add Sample Data" to create some quiz progress
4. Click "Upload to Cloud" to save to the backend
5. Open the same page in another browser (or incognito mode)
6. Click "Download from Cloud" to retrieve your data
7. Verify the data synced successfully!

## Step 3: Use in Your Quiz App

### Quick Integration

Add this to your settings page:

```javascript
import { SyncClient } from './sync-client.js';

const syncClient = new SyncClient('http://localhost:3001');

// Upload current progress
async function uploadProgress() {
  try {
    await syncClient.push();
    alert('Data uploaded successfully!');
  } catch (error) {
    alert('Upload failed: ' + error.message);
  }
}

// Download and merge progress
async function downloadProgress() {
  try {
    await syncClient.pull();
    alert('Data downloaded successfully!');
    location.reload(); // Reload to show synced data
  } catch (error) {
    alert('Download failed: ' + error.message);
  }
}

// Two-way sync (recommended)
async function syncProgress() {
  try {
    await syncClient.sync();
    alert('Sync complete!');
    location.reload();
  } catch (error) {
    alert('Sync failed: ' + error.message);
  }
}
```

## API Usage Examples

### Using curl

```bash
# Save data
curl -X POST http://localhost:3001/api/sync/my-device-123 \
  -H "Content-Type: application/json" \
  -d '{
    "quizProgress": {
      "quiz_progress_topic1": {
        "index": 5,
        "questionIds": ["q1", "q2", "q3"],
        "timestamp": 1234567890
      }
    }
  }'

# Retrieve data
curl http://localhost:3001/api/sync/my-device-123

# Clear data
curl -X DELETE http://localhost:3001/api/sync/my-device-123
```

### Using JavaScript Fetch

```javascript
// Save data
await fetch('http://localhost:3001/api/sync/my-device-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quizProgress: { /* your data */ },
    answeredQuestions: { /* your data */ }
  })
});

// Get data
const response = await fetch('http://localhost:3001/api/sync/my-device-123');
const result = await response.json();
console.log(result.data);
```

## What Gets Synced?

The backend syncs these localStorage items:

- ✅ Quiz progress (current question index, question order)
- ✅ Answered questions (which questions you've seen)
- ✅ Leitner system progress (spaced repetition data)
- ✅ Settings and preferences

## Device ID

Each device gets a unique ID stored in `localStorage` under key `quiz_device_id`. 

This ID is used to:
- Identify which data belongs to which device
- Allow multiple devices to sync the same data
- Keep data separate between different users

To sync across devices, use the same device ID, or use the Two-Way Sync feature to merge data.

## Tips

### ✅ Best Practices

1. **Use Two-Way Sync**: The `sync()` method intelligently merges local and remote data
2. **Auto-sync on Load**: Add a check on app startup to pull latest data
3. **Manual Sync Button**: Give users control with a sync button in settings
4. **Show Last Sync Time**: Display when data was last synced

### ⚠️ Important Notes

1. **Device ID is Important**: Don't lose your device ID or you won't be able to retrieve your data
2. **Data is Not Encrypted**: This is a simple backend - don't store sensitive data
3. **No Authentication**: Anyone with your device ID can access your data
4. **File-Based Storage**: Current implementation uses files - upgrade to Azure Blob Storage for production

## Next Steps

1. ✅ Test the backend locally
2. ✅ Integrate into your quiz app
3. 📦 Deploy to Azure (see [DEPLOYMENT.md](DEPLOYMENT.md))
4. 🔒 Add authentication (see [README.md](README.md#security-considerations))
5. ☁️ Upgrade to Azure Blob Storage (see [azure-functions/README.md](azure-functions/README.md))

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Try: `lsof -i :3001` to see what's using the port
- Or change the port: `PORT=3002 npm start`

### CORS errors
- Make sure you're accessing from an allowed origin
- For development, the backend allows all origins
- For production, configure CORS properly

### Data not persisting
- Check the `data/` directory is created
- Ensure the backend has write permissions
- Check backend logs for errors

### Can't retrieve data
- Verify you're using the correct device ID
- Check the backend is running
- Look at browser console for errors

## Need Help?

See the full documentation:
- [README.md](README.md) - API documentation
- [INTEGRATION.md](INTEGRATION.md) - Integration examples
- [DEPLOYMENT.md](DEPLOYMENT.md) - Azure deployment guide
- [azure-functions/README.md](azure-functions/README.md) - Serverless version

Enjoy syncing! 🎉
