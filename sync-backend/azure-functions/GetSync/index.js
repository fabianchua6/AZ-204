/**
 * Azure Function: GetSync
 * HTTP GET endpoint to retrieve synced quiz data
 * 
 * Trigger: HTTP GET /api/sync/{deviceId}
 * Returns: Synced quiz data for the device
 */

module.exports = async function (context, req) {
  const deviceId = context.bindingData.deviceId;

  // Validate device ID
  if (!deviceId || deviceId.length < 10) {
    context.res = {
      status: 400,
      body: { error: 'Invalid device ID' }
    };
    return;
  }

  try {
    // For demo purposes, using context.bindings
    // In production, use Azure Blob Storage SDK
    
    // Example with Azure Blob Storage (requires @azure/storage-blob package):
    /*
    const { BlobServiceClient } = require('@azure/storage-blob');
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('quiz-sync-data');
    const blobClient = containerClient.getBlobClient(`${deviceId}.json`);
    
    if (await blobClient.exists()) {
      const downloadResponse = await blobClient.download();
      const downloaded = await streamToString(downloadResponse.readableStreamBody);
      const data = JSON.parse(downloaded);
      
      context.res = {
        status: 200,
        body: {
          success: true,
          data: data,
          lastSync: data.lastSync || null
        }
      };
    } else {
      context.res = {
        status: 200,
        body: {
          success: true,
          data: null,
          lastSync: null
        }
      };
    }
    */

    // Simple in-memory implementation for demo
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        data: null,
        lastSync: null,
        message: 'Implement Azure Blob Storage for production use'
      }
    };

  } catch (error) {
    context.log.error('Error in GetSync:', error);
    context.res = {
      status: 500,
      body: { error: 'Failed to retrieve data' }
    };
  }
};

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
