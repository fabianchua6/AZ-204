/**
 * Azure Function: SaveSync
 * HTTP POST endpoint to save synced quiz data
 * 
 * Trigger: HTTP POST /api/sync/{deviceId}
 * Body: Quiz progress data
 * Returns: Success status
 */

module.exports = async function (context, req) {
  const deviceId = context.bindingData.deviceId;
  const { quizProgress, answeredQuestions, leitnerProgress, settings } = req.body || {};

  // Validate device ID
  if (!deviceId || deviceId.length < 10) {
    context.res = {
      status: 400,
      body: { error: 'Invalid device ID' }
    };
    return;
  }

  try {
    const syncData = {
      quizProgress: quizProgress || {},
      answeredQuestions: answeredQuestions || {},
      leitnerProgress: leitnerProgress || {},
      settings: settings || {},
      lastSync: new Date().toISOString(),
      deviceId
    };

    // For demo purposes
    // In production, use Azure Blob Storage SDK:
    
    /*
    const { BlobServiceClient } = require('@azure/storage-blob');
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('quiz-sync-data');
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'private'
    });
    
    const blobClient = containerClient.getBlockBlobClient(`${deviceId}.json`);
    const content = JSON.stringify(syncData, null, 2);
    
    await blobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json'
      }
    });
    */

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        message: 'Data synced successfully',
        lastSync: syncData.lastSync,
        note: 'Implement Azure Blob Storage for production use'
      }
    };

  } catch (error) {
    context.log.error('Error in SaveSync:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to save data' }
    };
  }
};
