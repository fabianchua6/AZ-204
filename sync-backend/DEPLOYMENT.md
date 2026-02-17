# Deployment Guide

This guide provides step-by-step instructions for deploying the sync backend to different Azure services.

## Prerequisites

- Azure account ([Create free account](https://azure.microsoft.com/free/))
- Azure CLI installed ([Install guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Node.js 18+ installed

## Option 1: Azure App Service (Simplest)

Perfect for: Quick deployment, traditional web hosting

### Steps:

1. **Login to Azure:**
   ```bash
   az login
   ```

2. **Create a resource group:**
   ```bash
   az group create --name az204-quiz-rg --location eastus
   ```

3. **Create an App Service plan:**
   ```bash
   az appservice plan create \
     --name az204-quiz-plan \
     --resource-group az204-quiz-rg \
     --sku F1 \
     --is-linux
   ```

4. **Create a web app:**
   ```bash
   az webapp create \
     --name az204-quiz-sync \
     --resource-group az204-quiz-rg \
     --plan az204-quiz-plan \
     --runtime "NODE:18-lts"
   ```

5. **Deploy the code:**
   ```bash
   cd sync-backend
   zip -r deploy.zip . -x "node_modules/*" -x "data/*"
   
   az webapp deployment source config-zip \
     --resource-group az204-quiz-rg \
     --name az204-quiz-sync \
     --src deploy.zip
   ```

6. **Configure CORS:**
   ```bash
   az webapp cors add \
     --resource-group az204-quiz-rg \
     --name az204-quiz-sync \
     --allowed-origins https://az-204.vercel.app
   ```

7. **Your endpoint:**
   ```
   https://az204-quiz-sync.azurewebsites.net/api/sync/{deviceId}
   ```

### Estimated Cost:
- F1 (Free) tier: **$0/month**
- B1 (Basic) tier: **~$13/month**

## Option 2: Azure Functions (Recommended for AZ-204)

Perfect for: Serverless, pay-per-use, exam alignment

### Steps:

1. **Login to Azure:**
   ```bash
   az login
   ```

2. **Create a resource group:**
   ```bash
   az group create --name az204-quiz-rg --location eastus
   ```

3. **Create a storage account:**
   ```bash
   az storage account create \
     --name az204quizstorage \
     --resource-group az204-quiz-rg \
     --location eastus \
     --sku Standard_LRS
   ```

4. **Create a function app:**
   ```bash
   az functionapp create \
     --resource-group az204-quiz-rg \
     --consumption-plan-location eastus \
     --runtime node \
     --runtime-version 18 \
     --functions-version 4 \
     --name az204-quiz-sync-func \
     --storage-account az204quizstorage
   ```

5. **Get storage connection string:**
   ```bash
   az storage account show-connection-string \
     --name az204quizstorage \
     --resource-group az204-quiz-rg \
     --query connectionString \
     --output tsv
   ```

6. **Configure the function app:**
   ```bash
   az functionapp config appsettings set \
     --name az204-quiz-sync-func \
     --resource-group az204-quiz-rg \
     --settings "AZURE_STORAGE_CONNECTION_STRING=<connection-string-from-step-5>"
   ```

7. **Deploy the functions:**
   ```bash
   cd sync-backend/azure-functions
   npm install
   func azure functionapp publish az204-quiz-sync-func
   ```

8. **Configure CORS:**
   ```bash
   az functionapp cors add \
     --name az204-quiz-sync-func \
     --resource-group az204-quiz-rg \
     --allowed-origins https://az-204.vercel.app
   ```

9. **Your endpoints:**
   ```
   GET  https://az204-quiz-sync-func.azurewebsites.net/api/sync/{deviceId}
   POST https://az204-quiz-sync-func.azurewebsites.net/api/sync/{deviceId}
   ```

### Estimated Cost:
- First 1M executions: **Free**
- For personal use: **~$0/month**

## Option 3: Azure Container Apps

Perfect for: Container-based deployment, modern cloud-native apps

### Steps:

1. **Create a Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. **Build and push to Azure Container Registry:**
   ```bash
   az acr create \
     --resource-group az204-quiz-rg \
     --name az204quizacr \
     --sku Basic

   az acr build \
     --registry az204quizacr \
     --image quiz-sync:latest \
     --file Dockerfile .
   ```

3. **Create Container Apps environment:**
   ```bash
   az containerapp env create \
     --name az204-quiz-env \
     --resource-group az204-quiz-rg \
     --location eastus
   ```

4. **Deploy the container app:**
   ```bash
   az containerapp create \
     --name quiz-sync \
     --resource-group az204-quiz-rg \
     --environment az204-quiz-env \
     --image az204quizacr.azurecr.io/quiz-sync:latest \
     --target-port 3001 \
     --ingress external \
     --registry-server az204quizacr.azurecr.io
   ```

### Estimated Cost:
- ~$10-20/month (depending on usage)

## Option 4: Local/Self-Hosted

Perfect for: Development, testing, self-hosting

### Steps:

1. **Clone and setup:**
   ```bash
   cd sync-backend
   npm install
   ```

2. **Run:**
   ```bash
   npm start
   ```

3. **Run with PM2 (for production):**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name quiz-sync
   pm2 save
   pm2 startup
   ```

4. **Use ngrok for public access (testing):**
   ```bash
   ngrok http 3001
   ```

### Estimated Cost:
- **$0** (your own server)

## Configuration

### Environment Variables

Set these after deployment:

```bash
# For App Service or Container Apps
az webapp config appsettings set \
  --name <app-name> \
  --resource-group az204-quiz-rg \
  --settings \
    PORT=80 \
    NODE_ENV=production

# For Functions
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group az204-quiz-rg \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="<connection-string>"
```

### CORS Configuration

Update allowed origins to match your quiz app URLs:

```bash
az webapp cors add \
  --resource-group az204-quiz-rg \
  --name <app-name> \
  --allowed-origins \
    https://az-204.vercel.app \
    https://your-custom-domain.com \
    http://localhost:3000
```

## Security Enhancements

### 1. Enable HTTPS Only

```bash
az webapp update \
  --resource-group az204-quiz-rg \
  --name <app-name> \
  --https-only true
```

### 2. Add Managed Identity

```bash
az webapp identity assign \
  --resource-group az204-quiz-rg \
  --name <app-name>
```

### 3. Use Azure Key Vault for Secrets

```bash
az keyvault create \
  --name az204-quiz-vault \
  --resource-group az204-quiz-rg \
  --location eastus

az keyvault secret set \
  --vault-name az204-quiz-vault \
  --name storage-connection \
  --value "<connection-string>"
```

## Monitoring

### Enable Application Insights

```bash
az monitor app-insights component create \
  --app az204-quiz-insights \
  --location eastus \
  --resource-group az204-quiz-rg

# Link to your app
az webapp config appsettings set \
  --name <app-name> \
  --resource-group az204-quiz-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

## Testing After Deployment

1. **Health check:**
   ```bash
   curl https://<your-app>.azurewebsites.net/health
   ```

2. **Test sync:**
   ```bash
   # Upload data
   curl -X POST https://<your-app>.azurewebsites.net/api/sync/test-device-123 \
     -H "Content-Type: application/json" \
     -d '{"quizProgress": {"test": "data"}}'

   # Retrieve data
   curl https://<your-app>.azurewebsites.net/api/sync/test-device-123
   ```

## Troubleshooting

### View logs:
```bash
az webapp log tail \
  --resource-group az204-quiz-rg \
  --name <app-name>
```

### SSH into container:
```bash
az webapp ssh \
  --resource-group az204-quiz-rg \
  --name <app-name>
```

### Common issues:

1. **CORS errors**: Check CORS configuration
2. **500 errors**: Check application logs
3. **Data not persisting**: Verify storage configuration

## Clean Up Resources

When done testing:

```bash
az group delete --name az204-quiz-rg --yes --no-wait
```

## Recommendation

For this use case (personal quiz app):
1. **Start with:** Azure Functions (free tier, exam alignment)
2. **Upgrade to:** App Service if you need always-on availability
3. **Consider:** Container Apps for learning container deployment

All options align with AZ-204 exam topics! 🎯
