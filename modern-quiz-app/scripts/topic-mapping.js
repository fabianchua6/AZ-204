// Topic mapping for PDF questions to existing categories
const TOPIC_MAPPING = {
  // Virtual Machines
  'Virtual Machines / Azure Infrastructure': 'Compute Solutions',
  'Azure Virtual Machines / Availability Sets': 'Compute Solutions',

  // Kubernetes/Containers
  'Azure Kubernetes Service (AKS)': 'Containers',
  'Azure Container Apps / Scaling': 'Containers',

  // App Service
  'Azure App Service / Managed Identity': 'App Service',
  'Azure App Service / Auto Scaling': 'App Service',
  'Azure App Service / Deployment Slots': 'App Service',
  'Azure WebJobs / Background Processing': 'App Service',

  // Functions
  'Azure Functions / Event-Driven Architecture': 'Functions',
  'Azure Functions / Custom Handlers': 'Functions',
  'Azure Functions / Timeout Issues': 'Functions',
  'Azure Durable Functions / Orchestration': 'Functions',

  // Storage
  'Azure Storage / Blob Events': 'Blob Storage',
  'Azure Storage / Change Feed': 'Blob Storage',
  'Blob Storage Lifecycle Management': 'Blob Storage',
  'Storage Account Data Movement': 'Blob Storage',

  // Cosmos DB
  'Azure Cosmos DB / MongoDB Migration': 'Cosmos DB',
  'Cosmos DB Client': 'Cosmos DB',
  'Cosmos DB Partition Key Selection': 'Cosmos DB',
  'Azure Cosmos DB RBAC': 'Cosmos DB',

  // API Management
  'Azure API Management / Authentication': 'API Management',
  'API Management Authentication': 'API Management',
  'API Authentication Mechanisms': 'API Management',

  // Azure AD / Identity
  'Azure Active Directory / OAuth': 'Entra ID',
  'Azure SQL Database / Authentication': 'Entra ID',
  'Azure AD B2C / Authentication': 'Entra ID',
  'Azure AD B2C / MFA': 'Entra ID',

  // Key Vault
  'Azure Key Vault': 'Key Vault',
  'Azure Key Vault / Application Security': 'Key Vault',
  'Key Vault vs Managed Identity': 'Key Vault',
  'Azure Functions / Key Vault': 'Key Vault',

  // Managed Identity (could be its own or Key Vault)
  'Managed Identity': 'Managed Identities',
  'App Service / Managed Identity': 'Managed Identities',

  // Monitoring
  'Azure Monitor / Alerts': 'Monitor',

  // Search (maps to a new category or could be part of existing)
  'Azure Search / Query Configuration': 'Azure', // Generic Azure services
  'Azure Search / Filtering': 'Azure',

  // Logic Apps (could be Functions or new category)
  'Azure Logic Apps / Development': 'Functions', // Similar workflow concept
  'Azure Logic Apps / Enterprise Integration': 'Functions',

  // CDN
  'Azure CDN / Content Delivery': 'Azure', // Generic Azure services

  // Event Grid
  'Azure Event Grid / Event Processing': 'Event Grid',

  // Message Queues
  'Message Queues vs Topics': 'Message Queues',
  'Queue Storage / Service Bus': 'Service Bus',

  // Security & Storage
  'Shared Access Signatures': 'Shared Access Signatures',
  'Container Instances / Security': 'Containers',

  // Graph & Database
  'Microsoft Graph': 'Graph',
  'Cosmos DB / Always Encrypted': 'Cosmos DB',

  // API Management Policies
  'API Management / Policy': 'API Management',
};

module.exports = { TOPIC_MAPPING };
