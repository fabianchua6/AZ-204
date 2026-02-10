# AZ-204 Quiz Sync Backend

A simple backend service to sync quiz progress across devices. This allows you to continue your AZ-204 certification study seamlessly on any device.

## Features

- 🔄 Sync quiz progress across devices
- 📊 Store Leitner system progress
- ⚙️ Sync quiz settings and preferences
- 🔒 Simple device ID-based authentication
- 💾 File-based storage (easily upgradeable to Azure Blob Storage)

## Quick Start

### Running Locally

1. **Install dependencies:**
   ```bash
   cd sync-backend
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3001`

### API Endpoints

#### Get Synced Data
```
GET /api/sync/:deviceId
```
Retrieves synced data for a device.

**Response:**
```json
{
  "success": true,
  "data": {
    "quizProgress": {},
    "answeredQuestions": {},
    "leitnerProgress": {},
    "settings": {},
    "lastSync": "2024-01-01T12:00:00.000Z"
  },
  "lastSync": "2024-01-01T12:00:00.000Z"
}
```

#### Save Synced Data
```
POST /api/sync/:deviceId
Content-Type: application/json
```

**Request Body:**
```json
{
  "quizProgress": {},
  "answeredQuestions": {},
  "leitnerProgress": {},
  "settings": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data synced successfully",
  "lastSync": "2024-01-01T12:00:00.000Z"
}
```

#### Clear Synced Data
```
DELETE /api/sync/:deviceId
```
Clears all synced data for a device.

#### Health Check
```
GET /health
```
Returns server health status.

## Device ID

The device ID should be a unique identifier for each device. You can generate one using:

```javascript
// Generate a device ID (store this in localStorage)
const deviceId = crypto.randomUUID();
```

Or use a combination of browser fingerprint + user choice.

## Deploying to Azure

### Option 1: Azure App Service

1. Create an Azure App Service
2. Deploy this backend
3. Set environment variable: `PORT=80`

### Option 2: Azure Functions (Recommended for AZ-204 learning)

Convert this to Azure Functions for serverless deployment:

1. Use Azure Functions HTTP triggers
2. Store data in Azure Blob Storage or Cosmos DB
3. Add Azure AD authentication for better security

Example Azure Function structure:
```
sync-backend-functions/
├── GetSync/
│   └── function.json
│   └── index.js
├── SaveSync/
│   └── function.json
│   └── index.js
└── host.json
```

### Option 3: Azure Container Apps

1. Create a Dockerfile
2. Build and push to Azure Container Registry
3. Deploy to Azure Container Apps

## Data Storage

Currently uses file system (`./data/*.json`). For production:

- **Azure Blob Storage**: Store each device's data as a blob
- **Azure Cosmos DB**: NoSQL database for better querying
- **Azure Table Storage**: Simple key-value storage

## Security Considerations

This is a **simple** backend for personal use. For production:

### Current Implementation
- ⚠️ No rate limiting (CodeQL finding - acceptable for personal use)
- ⚠️ No authentication
- ⚠️ Device ID-based access only
- ⚠️ Data stored in plain text
- ⚠️ CORS enabled for all origins

### Production Recommendations

1. **Add Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

2. **Add Authentication**
   - Use Azure AD authentication
   - Implement OAuth2
   - Add JWT tokens

3. **Implement Input Validation**
   - Validate device IDs
   - Sanitize input data
   - Set size limits

4. **Security Headers**
   - Use helmet.js
   - Configure HTTPS only
   - Set proper CORS policies

5. **Data Protection**
   - Encrypt data at rest
   - Use Azure Key Vault for secrets
   - Implement data retention policies

6. **Access Logs**
   - Log all API calls
   - Monitor for suspicious activity
   - Set up Azure Application Insights

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guides.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `DATA_DIR` - Data storage directory (optional)

## Integration with Quiz Apps

See `sync-client.js` for a ready-to-use client library that can be integrated into the quiz apps.

## License

MIT
