# Azure Functions Version

This directory contains an Azure Functions implementation of the sync backend, which is serverless and aligns with AZ-204 exam topics.

## Features

- HTTP-triggered Azure Functions
- Serverless architecture (pay-per-use)
- Integration with Azure Blob Storage for data persistence
- Scalable and highly available

## Structure

```
azure-functions/
├── host.json              # Function app configuration
├── GetSync/              # HTTP GET - Retrieve synced data
│   ├── function.json
│   └── index.js
├── SaveSync/             # HTTP POST - Save synced data
│   ├── function.json
│   └── index.js
└── package.json
```

## Local Development

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Install dependencies:
   ```bash
   cd azure-functions
   npm install
   ```

3. Run locally:
   ```bash
   func start
   ```

## Deployment to Azure

### Option 1: Using Azure CLI

```bash
# Login to Azure
az login

# Create a resource group
az group create --name az204-quiz-rg --location eastus

# Create a storage account
az storage account create \
  --name az204quizstorage \
  --resource-group az204-quiz-rg \
  --location eastus \
  --sku Standard_LRS

# Create a function app
az functionapp create \
  --resource-group az204-quiz-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name az204-quiz-sync \
  --storage-account az204quizstorage

# Deploy the functions
func azure functionapp publish az204-quiz-sync
```

### Option 2: Using VS Code

1. Install the Azure Functions extension
2. Sign in to Azure
3. Click "Deploy to Function App"
4. Follow the prompts

## Environment Variables

Set these in Azure Function App Configuration:

- `AZURE_STORAGE_CONNECTION_STRING` - Connection string for Azure Blob Storage
- `ALLOWED_ORIGINS` - CORS origins (your quiz app URLs)

## Using Azure Blob Storage

The functions use Azure Blob Storage to persist data instead of the file system.

Benefits:
- Persistent storage
- Highly available
- Scalable
- Cost-effective

## Endpoints

After deployment, your endpoints will be:

```
GET  https://<app-name>.azurewebsites.net/api/GetSync?deviceId={deviceId}
POST https://<app-name>.azurewebsites.net/api/SaveSync?deviceId={deviceId}
```

## Monitoring

Use Azure Application Insights to monitor:
- Request rates
- Response times
- Errors
- Usage patterns

## Cost Estimation

Azure Functions Consumption Plan:
- First 1M executions: Free
- Additional executions: $0.20 per million
- Execution time: $0.000016 per GB-s

For personal use (< 10K syncs/month): **Essentially free**

## Security

For production:

1. Enable Azure AD authentication
2. Use Managed Identity for storage access
3. Configure CORS properly
4. Add rate limiting
5. Enable HTTPS only
6. Use Azure Key Vault for secrets

## Related AZ-204 Topics

This implementation covers these AZ-204 exam topics:

✅ **Azure Functions** (25-30%)
- Create and configure an Azure Function App
- Implement input and output bindings
- Implement function triggers using HTTP

✅ **Azure Blob Storage** (15-20%)
- Perform operations on data using the SDK
- Set and retrieve properties and metadata

✅ **Implement Azure security** (15-20%)
- Secure app configuration data
- Implement Managed Identities

✅ **Monitor and troubleshoot** (5-10%)
- Implement Application Insights

## Next Steps

1. Implement Azure Blob Storage bindings
2. Add authentication with Azure AD
3. Set up Application Insights
4. Configure deployment slots
5. Add automated tests
