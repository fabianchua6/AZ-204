# AZ-204 PDF Processed Questions - Complete Collection

_Last updated: 2024-03-31_
_Source: ExamTopics AZ-204 Exam Questions_

## [PDF] Question 1

**Topic: Virtual Machines / Azure Infrastructure**

You have two Hyper-V hosts named Host1 and Host2. Host1 has an Azure virtual machine named VM1 that was deployed by using a custom Azure Resource Manager template.

You need to move VM1 to Host2.

What should you do?

A. From the Update management blade, click Enable.
B. From the Overview blade, move VM1 to a different subscription.
C. From the Redeploy blade, click Redeploy.
D. From the Profile blade, modify the usage location.

**Correct Answer: C**

**Explanation:**
When you redeploy a VM, it moves the VM to a new node within the Azure infrastructure and then powers it back on, retaining all your configuration options and associated resources.

**Reference:**
https://docs.microsoft.com/en-us/azure/virtual-machines/windows/redeploy-to-new-node

---

## [PDF] Question 2

**Topic: Azure Kubernetes Service (AKS)**

Your company has an Azure Kubernetes Service (AKS) cluster that you manage from an Azure AD-joined device. The cluster is located in a resource group.

Developers have created an application named MyApp. MyApp was packaged into a container image.

You need to deploy the YAML manifest file for the application.

**Solution:** You install the Azure CLI on the device and run the `kubectl apply -f myapp.yaml` command.

Does this meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
`kubectl apply -f myapp.yaml` applies a configuration change to a resource from a file or stdin. This is the correct approach for deploying YAML manifest files to AKS clusters.

**Reference:**
https://kubernetes.io/docs/reference/kubectl/overview/
https://docs.microsoft.com/en-us/cli/azure/aks

---

## [PDF] Question 3

**Topic: Azure Kubernetes Service (AKS)**

Your company has an Azure Kubernetes Service (AKS) cluster that you manage from an Azure AD-joined device. The cluster is located in a resource group.

Developers have created an application named MyApp. MyApp was packaged into a container image.

You need to deploy the YAML manifest file for the application.

**Solution:** You install the docker client on the device and run the `docker run -it microsoft/azure-cli:0.10.17` command.

Does this meet the goal?

A. Yes
B. No

**Correct Answer: B**

**Explanation:**
Running a Docker container with Azure CLI does not directly deploy a YAML manifest to AKS. You need to use `kubectl apply` command with the proper authentication to the AKS cluster.

---

## [PDF] Question 4

**Topic: Azure WebJobs / Background Processing**

Your company has a web app named WebApp1.

You use the WebJobs SDK to design a triggered App Service background task that automatically invokes a function in the code every time new data is received in a queue.

You are preparing to configure the service processes a queue data item.

Which of the following is the service you should use?

A. Logic Apps
B. WebJobs
C. Flow
D. Functions

**Correct Answer: B**

**Explanation:**
WebJobs is the correct service for creating background tasks in Azure App Service that can be triggered by queue messages. WebJobs SDK provides the framework for building these triggered applications.

**Reference:**
https://docs.microsoft.com/en-us/azure/azure-functions/functions-compare-logic-apps-ms-flow-webjobs

---

## [PDF] Question 5

**Topic: Azure Virtual Machines / Availability Sets**

Your company has an Azure subscription.

You need to deploy a number of Azure virtual machines to the subscription by using Azure Resource Manager (ARM) templates. The virtual machines will be included in a single availability set.

You need to ensure that the ARM template allows for as many virtual machines as possible to remain accessible in the event of fabric failure or maintenance.

Which of the following is the value that you should configure for the platformFaultDomainCount property?

A. 10
B. 30
C. Min Value
D. Max Value

**Correct Answer: D**

**Explanation:**
The number of fault domains for managed availability sets varies by region - either two or three per region. Setting this to the maximum value ensures the highest availability.

**Reference:**
https://docs.microsoft.com/en-us/azure/virtual-machines/windows/manage-availability

---

## [PDF] Question 6

**Topic: Azure Virtual Machines / Availability Sets**

Your company has an Azure subscription.

You need to deploy a number of Azure virtual machines to the subscription by using Azure Resource Manager (ARM) templates. The virtual machines will be included in a single availability set.

You need to ensure that the ARM template allows for as many virtual machines as possible to remain accessible in the event of fabric failure or maintenance.

Which of the following is the value that you should configure for the platformUpdateDomainCount property?

A. 10
B. 20
C. 30
D. 40

**Correct Answer: B**

**Explanation:**
Each virtual machine in your availability set is assigned an update domain and a fault domain by the underlying Azure platform. For a given availability set, five non-user-configurable update domains are assigned by default (Resource Manager deployments can then be increased to provide up to 20 update domains).

**Reference:**
https://docs.microsoft.com/en-us/azure/virtual-machines/windows/manage-availability

---

## [PDF] Question 7

**Topic: Azure Cosmos DB / Functions**

You are creating an Azure Cosmos DB account that makes use of the SQL API. Data will be added to the account every day by a web application.

You need to ensure that an email notification is sent when information is received from IoT devices, and that compute cost is reduced.

You decide to deploy a function app.

Which of the following should you configure the function app to use?

**This is a drag-drop question requiring:**

- Trigger type selection
- Hosting plan selection
- Runtime stack selection

**Correct Configuration:**

- **Trigger:** Cosmos DB trigger
- **Hosting plan:** Consumption plan (for cost reduction)
- **Runtime:** Appropriate runtime based on requirements

**Explanation:**
Cosmos DB trigger allows the function to respond to changes in the database. Consumption plan provides cost-effective scaling where you only pay for execution time.

---

## [PDF] Question 8

**Topic: Azure Active Directory / OAuth**

Your Azure Active Directory (Azure AD) tenant has an Azure subscription linked to it.

Your developer has created a mobile application that obtains Azure AD access tokens using the OAuth 2 implicit grant type.

The mobile application must be registered in Azure AD.

You require a redirect URI from the developer for registration purposes.

**Instructions:** Review the underlined text. If it makes the statement correct, select 'No change required.' If the statement is incorrect, select the answer choice that makes the statement correct.

A. No change required.
B. a secret
C. a login hint
D. a client ID

**Correct Answer: A**

**Explanation:**
For Native Applications you need to provide a Redirect URI, which Azure AD will use to return token responses.

**Reference:**
https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-oauth-code

---

## [PDF] Question 9

**Topic: Azure Key Vault**

You are creating an Azure key vault using PowerShell. Objects deleted from the key vault must be kept for a set period of 90 days.

Which two of the following parameters must be used in conjunction to meet the requirement? (Choose two.)

A. EnabledForDeployment
B. EnablePurgeProtection  
C. EnabledForTemplateDeployment
D. EnableSoftDelete

**Correct Answer: B, D**

**Explanation:**
Both EnableSoftDelete and EnablePurgeProtection must be configured together. Soft delete allows recovery of deleted objects within the retention period, while purge protection prevents permanent deletion during the retention period.

**Reference:**
https://docs.microsoft.com/en-us/powershell/module/azurerm.keyvault/new-azurermkeyvault
https://docs.microsoft.com/en-us/azure/key-vault/key-vault-ovw-soft-delete

---

## [PDF] Question 10

**Topic: Azure Active Directory / Conditional Access**

You have an Azure Active Directory (Azure AD) tenant.

You want to implement multi-factor authentication by making use of a conditional access policy. The conditional access policy must be applied to all users when they access the Azure portal.

Which three settings should you configure?

**This is a hotspot question requiring configuration of:**

1. **Users and Groups:** All users
2. **Cloud apps:** Microsoft Azure Management (Azure portal)
3. **Access controls:** Require multi-factor authentication

**Explanation:**
The conditional access policy must be applied to Users and Groups (All users), applied when accessing cloud apps (Microsoft Azure Management for Azure portal), and the access control must require multi-factor authentication when granting access.

**Reference:**
https://docs.microsoft.com/en-us/azure/active-directory/conditional-access/app-based-mfa

---

## [PDF] Question 11

**Topic: Azure SQL Database / Authentication**

You manage an Azure SQL database that allows for Azure AD authentication.

You need to make sure that database developers can connect to the SQL database via Microsoft SQL Server Management Studio (SSMS). You also need to make sure the developers use their on-premises Active Directory account for authentication. Your strategy should allow for authentication prompts to be kept to a minimum.

Which of the following should you implement?

A. Azure AD token.
B. Azure Multi-Factor authentication.
C. Active Directory integrated authentication.
D. OATH software tokens.

**Correct Answer: C**

**Explanation:**
Active Directory integrated authentication allows users to connect using their existing Windows credentials without additional prompts. This method works when logged in to Windows using Azure Active Directory credentials from a federated domain.

---

## [PDF] Question 12

**Topic: Azure Key Vault / Application Security**

You are developing an application to transfer data between on-premises file servers and Azure Blob storage. The application stores keys, secrets, and certificates in Azure Key Vault and makes use of the Azure Key Vault APIs.

You want to configure the application to allow recovery of an accidental deletion of the key vault or key vault objects for 90 days after deletion.

What should you do?

A. Run the Add-AzKeyVaultKey cmdlet.
B. Run the `az keyvault update --enable-soft-delete true --enable-purge-protection true` CLI.
C. Implement virtual network service endpoints for Azure Key Vault.
D. Run the `az keyvault update --enable-soft-delete false` CLI.

**Correct Answer: B**

**Explanation:**
When soft-delete is enabled, resources marked as deleted resources are retained for a specified period (90 days by default). Purge protection ensures that a vault or an object in the deleted state cannot be purged until the retention period has passed.

---

## [PDF] Question 13

**Topic: Azure App Service / Managed Identity**

You are developing an e-Commerce Web App.

You want to use Azure Key Vault to ensure that sign-ins to the e-Commerce Web App are secured by using Azure App Service authentication and Azure Active Directory (AAD).

What should you do on the e-Commerce Web App?

A. Run the az keyvault secret command.
B. Enable Azure AD Connect.
C. Enable Managed Service Identity (MSI).
D. Create an Azure AD service principal.

**Correct Answer: C**

**Explanation:**
A managed identity from Azure Active Directory allows your app to easily access other AAD-protected resources such as Azure Key Vault without managing credentials in code.

---

## [PDF] Question 14

**Topic: Azure Cosmos DB / MongoDB Migration**

You company has an on-premises deployment of MongoDB, and an Azure Cosmos DB account that makes use of the MongoDB API.

You need to devise a strategy to migrate MongoDB to the Azure Cosmos DB account.

You include the Data Management Gateway tool in your migration strategy.

**Instructions:** Review the underlined text. If it makes the statement correct, select 'No change required.' If the statement is incorrect, select the answer choice that makes the statement correct.

A. No change required
B. mongorestore
C. Azure Storage Explorer
D. AzCopy

**Correct Answer: B**

**Explanation:**
mongorestore is the correct tool for migrating MongoDB data to Azure Cosmos DB with MongoDB API. It can restore MongoDB data from backup files to the target database.

---

## [PDF] Question 15

**Topic: Azure Monitor / Alerts**

Your company's Azure subscription includes an Azure Log Analytics workspace.

Your company has a hundred on-premises servers that run either Windows Server 2012 R2 or Windows Server 2016, and is linked to the Azure Log Analytics workspace. The Azure Log Analytics workspace is set up to gather performance counters associated with security from these linked servers.

You must configure alerts based on the information gathered by the Azure Log Analytics workspace.

You have to make sure that alert rules allow for dimensions, and that alert creation time should be kept to a minimum. Furthermore, a single alert notification must be created when the alert is created and when the alert is resolved.

You need to make use of the necessary signal type when creating the alert rules.

Which of the following is the option you should use?

A. The Activity log signal type.
B. The Application Log signal type.
C. The Metric signal type.
D. The Audit Log signal type.

**Correct Answer: C**

**Explanation:**
Metric alerts in Azure Monitor provide a way to get notified when one of your metrics cross a threshold. Metric alerts work on a range of multi-dimensional platform metrics, custom metrics, Application Insights standard and custom metrics.

---

## [PDF] Question 16

**Topic: Azure Search / Query Configuration**

You are developing a .NET Core MVC application that allows customers to research independent holiday accommodation providers.

You want to implement Azure Search to allow the application to search the index by using various criteria to locate documents related to accommodation.

You want the application to allow customers to search the index by using regular expressions.

What should you do?

A. Configure the SearchMode property of the SearchParameters class.
B. Configure the QueryType property of the SearchParameters class.
C. Configure the Facets property of the SearchParameters class.
D. Configure the Filter property of the SearchParameters class.

**Correct Answer: B**

**Explanation:**
The SearchParameters.QueryType Property specifies the syntax of the search query. Use 'full' if your query uses the Lucene query syntax, which supports regular expressions, wildcard, fuzzy search, and proximity search.

---

## [PDF] Question 17

**Topic: Azure Logic Apps / Development**

You are a developer at your company.

You need to update the definitions for an existing Logic App.

What should you use?

A. the Enterprise Integration Pack (EIP)
B. the Logic App Code View
C. the API Connections
D. the Logic Apps Designer

**Correct Answer: B**

**Explanation:**
The Logic App Code View allows you to edit the JSON definition of your logic app directly. This is the appropriate tool for updating logic app definitions programmatically.

---

## [PDF] Question 18

**Topic: Azure API Management / Authentication**

You are developing a solution for a public facing API.

The API back end is hosted in an Azure App Service instance. You have implemented a RESTful service for the API back end.

You must configure back-end authentication for the API Management service instance.

**Solution:** You configure Client cert gateway credentials for the Azure resource.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
API Management allows securing access to the back-end service of an API using client certificates. Since the API back end is hosted in an Azure App Service instance (Azure resource), client certificate gateway credentials for the Azure resource is the correct approach.

---

## [PDF] Question 19

**Topic: Azure Search / Filtering**

You are developing a .NET Core MVC application that allows customers to research independent holiday accommodation providers.

You want to implement Azure Search to allow the application to search the index by using various criteria to locate documents related to accommodation venues.

You want the application to list holiday accommodation venues that fall within a specific price range and are within a specified distance to an airport.

What should you do?

A. Configure the SearchMode property of the SearchParameters class.
B. Configure the QueryType property of the SearchParameters class.
C. Configure the Facets property of the SearchParameters class.
D. Configure the Filter property of the SearchParameters class.

**Correct Answer: D**

**Explanation:**
The Filter property gets or sets the OData $filter expression to apply to the search query. Filters are ideal for range queries (price range) and geographic distance calculations.

---

## [PDF] Question 20

**Topic: Azure Logic Apps / Enterprise Integration**

You are a developer at your company.

You need to edit the workflows for an existing Logic App.

What should you use?

A. the Enterprise Integration Pack (EIP)
B. the Logic App Code View
C. the API Connections
D. the Logic Apps Designer

**Correct Answer: D**

**Explanation:**
The Logic Apps Designer provides a visual interface for editing workflows. While the Enterprise Integration Pack (EIP) is used for B2B solutions and enterprise integration workflows, the Designer is the primary tool for editing Logic App workflows.

---

## [PDF] Question 21

**Topic: Azure CDN / Content Delivery**

You are configuring a web app that delivers streaming video to users. The application makes use of continuous integration and deployment.

You need to ensure that the application is highly available and that the users' streaming experience is constant. You also want to configure the application to store data in a geographic location that is nearest to the user.

**Solution:** You include the use of an Azure Content Delivery Network (CDN) in your design.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
Azure CDN provides a global solution for rapidly delivering high-bandwidth content by caching content at strategically placed physical nodes across the world, ensuring content is delivered from locations nearest to users.

---

## [PDF] Question 22

**Topic: Azure App Service / Auto Scaling**

You develop a Web App on a tier D1 app service plan.

You notice that page load times increase during periods of peak traffic.

You want to implement automatic scaling when CPU load is above 80 percent. Your solution must minimize costs.

What should you do first?

A. Enable autoscaling on the Web App.
B. Switch to the Premium App Service tier plan.
C. Switch to the Standard App Service tier plan.
D. Switch to the Azure App Services consumption plan.

**Correct Answer: C**

**Explanation:**
Configure the web app to the Standard App Service Tier. The Standard tier supports auto-scaling, and we should minimize the cost. The D1 tier does not support auto-scaling.

---

## [PDF] Question 23

**Topic: Azure Event Grid / Event Processing**

You are developing an application that applies a set of governance policies for internal and external services, as well as for applications.

You develop a stateful ASP.NET Core 2.1 web application named PolicyApp and deploy it to an Azure App Service Web App. The PolicyApp reacts to events from Azure Event Grid and performs policy actions based on those events.

You have the following requirements:
• Authentication events must be used to monitor users when they sign in and sign out.
• All authentication events must be processed by PolicyApp.
• Sign outs must be processed as fast as possible.

What should you do?

A. Create a new Azure Event Grid subscription for all authentication events. Use the subscription to process sign-out events.
B. Create a separate Azure Event Grid handler for sign-in and sign-out events.
C. Create separate Azure Event Grid topics and subscriptions for sign-in and sign-out events.
D. Add a subject prefix to sign-out events. Create an Azure Event Grid subscription. Configure the subscription to use the subjectBeginsWith filter.

**Correct Answer: D**

**Explanation:**
Using subject prefix filtering with subjectBeginsWith allows you to prioritize and process specific event types (sign-out events) faster while still processing all authentication events through the same infrastructure.

---

## [PDF] Question 24

**Topic: Azure Functions / Custom Handlers**

You are developing a C++ application that compiles to a native application named process.exe. The application accepts images as input and returns images in one of the following image formats: GIF, PNG, or JPEG.

You must deploy the application as an Azure Function.

You need to configure the function and host.json files.

**Configuration required:**

1. **Type:** "http" (for HTTP trigger)
2. **Custom Handler section:** Define executable path and settings
3. **Enable Forwarding:** false (to handle custom request/response format)

**Explanation:**
Custom handlers allow you to run any executable in Azure Functions. The host.json file must be configured with the customHandler section pointing to your executable, and HTTP forwarding should be disabled for custom response handling.

---

## [PDF] Question 25

**Topic: Azure Static Web Apps / Authentication**

You are developing an Azure Static Web app that contains training materials for a tool company. Each tool's training material is contained in a static web page that is linked from the tool's publicly available description page.

A user must be authenticated using Azure AD prior to viewing training.

You need to ensure that the user can view training material pages after authentication.

**Configuration required:**

- Routes configuration for authentication
- Navigation fallback settings
- Role-based access control

**Explanation:**
Azure Static Web Apps support built-in authentication with Azure AD. Configure routes in the staticwebapp.config.json to require authentication for training material paths and set up proper navigation fallback for authenticated users.

---

## [PDF] Question 26

**Topic: Azure App Service / Deployment Slots**

You develop and deploy an Azure App Service API app to a Windows-hosted deployment slot named Development. You create additional deployment slots named Testing and Production. You enable auto swap on the Production deployment slot.

You need to ensure that scripts run and resources are available before a swap operation occurs.

**Solution:** Update the web.config file to include the applicationInitialization configuration element. Specify custom initialization actions to run the scripts.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
The applicationInitialization configuration element in web.config allows you to specify custom initialization actions. The swap operation waits for this custom warm-up to finish before swapping with the target slot.

---

## [PDF] Question 27

**Topic: Azure Storage / Blob Events**

You develop a software as a service (SaaS) offering to manage photographs. Users upload photos to a web service which then stores the photos in Azure Storage Blob storage. The storage account type is General-purpose V2.

When photos are uploaded, they must be processed to produce and save a mobile-friendly version of the image. The process to produce a mobile-friendly version of the image must start in less than one minute.

You need to design the process that starts the photo processing.

**Solution:** Trigger the photo processing from Blob storage events.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: B**

**Explanation:**
While Blob storage events can trigger processing, you need to catch the triggered event and move the photo processing to an Azure Function triggered from the blob upload. The processing must start in less than one minute, and only StorageV2 (general purpose v2) and BlobStorage support event integration.

---

## [PDF] Question 28

**Topic: Azure Functions / Event-Driven Architecture**

You develop a software as a service (SaaS) offering to manage photographs. Users upload photos to a web service which then stores the photos in Azure Storage Blob storage. The storage account type is General-purpose V2.

When photos are uploaded, they must be processed to produce and save a mobile-friendly version of the image. The process to produce a mobile-friendly version of the image must start in less than one minute.

**Solution:** Move photo processing to an Azure Function triggered from the blob upload.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
Azure Storage events allow applications to react to blob upload events. Azure Functions can be triggered by these events and will start processing within the required timeframe. This is the correct approach for event-driven photo processing.

---

## [PDF] Question 29

**Topic: Azure Container Instances / YAML Configuration**

You are developing an application that includes two Docker containers.

The application must meet the following requirements:
• The containers must not run as root.
• The containers must be deployed to Azure Container Instances using a YAML file.
• The containers must share a lifecycle, resources, local network, and storage volume.
• The storage volume must persist through container crashes.
• The storage volume must be deployed on stop or restart of the containers.

**Configuration values needed:**

- **Security Context:** Non-root user configuration
- **Volume Type:** Azure Files or Azure Disk for persistence
- **Container Group:** Single group for shared lifecycle and networking

**Explanation:**
Azure Container Instances supports multi-container groups that share lifecycle, networking, and storage. Use Azure Files for persistent storage that survives container restarts.

---

## [PDF] Question 30

**Topic: Azure Functions / Custom Handlers**

You are developing an Azure Function App that processes images that are uploaded to an Azure Blob container.

Images must be processed as quickly as possible after they are uploaded, and the solution must minimize latency. You create code to process images when the Function App is triggered.

You need to configure the Function App.

What should you do?

A. Use an App Service plan. Configure the Function App to use an Azure Blob Storage input trigger.
B. Use a Consumption plan. Configure the Function App to use an Azure Blob Storage trigger.
C. Use a Consumption plan. Configure the Function App to use a Timer trigger.
D. Use an App Service plan. Configure the Function App to use an Azure Blob Storage trigger.
E. Use a Consumption plan. Configure the Function App to use an Azure Blob Storage input trigger.

**Correct Answer: B**

**Explanation:**
The Blob storage trigger starts a function when a new or updated blob is detected. The Consumption plan provides automatic scaling and cost efficiency for event-driven scenarios. This combination minimizes latency and costs.

---

## [PDF] Question 31

**Topic: Azure Cosmos DB / Consistency Levels**

You are developing a solution for a hospital to support the following use cases:
• The most recent patient status details must be retrieved even if multiple users in different locations have updated the patient record.
• Patient health monitoring data retrieved must be the current version or the prior version.
• After a patient is discharged and all charges have been assessed, the patient billing record contains the final charges.

You need to minimize latency and any impact to the availability of the solution. You must override the default consistency level at the query level to meet the required consistency guarantees for the scenarios.

**Which consistency levels should you implement?**

1. **Patient Status (most recent):** Strong consistency
2. **Health Monitoring (current or prior):** Bounded staleness
3. **Final Billing (eventual consistency acceptable):** Eventual consistency

**Explanation:**

- Strong consistency ensures reads return the most recent committed version
- Bounded staleness allows reads to lag by a specified number of versions or time
- Eventual consistency provides the best performance for scenarios where immediate consistency isn't critical

---

## [PDF] Question 32

**Topic: Azure Resource Manager / Template Deployment**

You are authoring a set of nested Azure Resource Manager templates to deploy Azure resources. You author an Azure Resource Manager template named mainTemplate.json that contains the following linked templates: linkedTemplate1.json, linkedTemplate2.json.

You have the following requirements:
• Store the templates in Azure for later deployment.
• Enable versioning of the templates.
• Manage access to the templates by using Azure RBAC.
• Ensure that users have read-only access to the templates.
• Allow users to deploy the templates.

You need to store the templates in Azure.

**Solution:** Use Azure Storage Account with version management enabled and configure appropriate RBAC permissions.

**Explanation:**
Azure Storage provides versioning capabilities, RBAC integration, and secure access to ARM templates. Users can have read access to templates while maintaining deployment permissions through proper role assignments.

---

## [PDF] Question 33

**Topic: Azure Functions / Timeout Issues**

You develop an HTTP triggered Azure Function app to process Azure Storage blob data. The app is triggered using an output binding on the blob.

The app continues to time out after four minutes. The app must process the blob data.

You need to ensure the app does not time out and processes the blob data.

**Solution:** Pass the HTTP trigger payload into an Azure Service Bus queue to be processed by a queue trigger function and return an immediate HTTP success response.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
This is a best practice for long-running functions. By passing the payload to a queue for asynchronous processing, you can return an immediate response and avoid timeout issues while still ensuring the work gets done.

---

## [PDF] Question 34

**Topic: Azure Storage / Change Feed**

You are developing an application that uses Azure Blob storage.

The application must read the transaction logs of all the changes that occur to the blobs and the blob metadata in the storage account for auditing purposes. The changes must be in the order in which they occurred, include only create, update, delete, and copy operations and be retained for compliance reasons.

You need to process the transaction logs asynchronously.

What should you do?

A. Process all Azure Blob storage events by using Azure Event Grid with a subscriber Azure Function app.
B. Enable the change feed on the storage account and process all changes for available events.
C. Process all Azure Storage Analytics logs for successful blob events.
D. Use the Azure Monitor HTTP Data Collector API and scan the request body for successful blob events.

**Correct Answer: B**

**Explanation:**
Change feed support in Azure Blob Storage provides transaction logs of all changes to blobs and blob metadata. The change feed provides ordered, guaranteed, durable, immutable, read-only logs of these changes, which is perfect for auditing and compliance.

---

## [PDF] Question 35

**Topic: Azure Durable Functions / Orchestration**

You are developing an Azure Durable Function to manage an online ordering process.

The process must call an external API to gather product discount information.

You need to implement the Azure Durable Function.

Which Azure Durable Function types should you use? Each correct answer presents part of the solution.

A. Orchestrator
B. Entity
C. Client
D. Activity

**Correct Answer: A, D**

**Explanation:**

- **Orchestrator functions** coordinate the execution of multiple functions and manage the workflow
- **Activity functions** perform the actual work, such as calling external APIs
- The orchestrator calls activity functions to gather product discount information from external APIs

---

## [PDF] Question 36

**Topic: Azure Container Apps / Scaling**

You deploy an Azure Container Apps app and disable ingress on the container app.

Users report that they are unable to access the container app. You investigate and observe that the app has scaled to 0 instances.

You need to resolve the issue with the container app.

**Solution:** Enable ingress, create an HTTP scale rule, and apply the rule to the container app.

Does the solution meet the goal?

A. Yes
B. No

**Correct Answer: A**

**Explanation:**
Enabling ingress allows external access to the container app. Creating an HTTP scale rule ensures the app scales based on incoming HTTP requests, preventing it from scaling to 0 when there are requests to process.

---

## [PDF] Question 37

**Topic: Azure Functions / Python Applications**

You develop a Python application for image rendering. The application uses GPU resources to optimize rendering processes.

You have the following requirements:
• The application must be deployed to a Linux container.
• The container must be stopped when the image rendering is complete.
• The solution must minimize cost.

**Solution:** Deploy to Azure Container Instances with appropriate resource configuration and automatic shutdown after job completion.

**Explanation:**
Azure Container Instances provides the ability to run containerized applications on-demand with GPU support, automatic scaling to zero, and pay-per-use pricing model, making it cost-effective for batch processing scenarios.

---

## [PDF] Question 38

**Topic: Azure Managed Disks / Performance**

You are building a software-as-a-service (SaaS) application that analyzes DNA data that will run on Azure virtual machines (VMs) in an availability zone. The data is stored on managed disks attached to the VM. The performance of the analysis is determined by the speed of the disk attached to the VM.

You have the following requirements:
• The application must be able to quickly revert to the previous day's data if a systemic error is detected.
• The application must minimize downtime in the case of an Azure datacenter outage.

**Solution:** Use Premium SSD managed disks with zone-redundant storage (ZRS) and implement automated daily snapshots.

**Explanation:**
Premium SSD provides high performance, ZRS provides protection against datacenter outages, and automated snapshots enable quick restoration to previous day's data for error recovery.

---

## [PDF] Question 39

**Topic: Case Study - Munson's Pickles and Preserves Farm**

**Background:** Agricultural cooperative corporation migrating applications to Azure with specific requirements for corporate website, farms authentication, distributors API monitoring, and internal staff validation processes.

**Requirements Analysis:**

- Corporate website: Azure App Service with auto-scaling, Azure CDN for performance
- Queue-based load leveling: Azure Service Bus queues
- Authentication: Microsoft Entra ID for farmers and staff
- API monitoring: Custom telemetry tracking
- Security: TLS/HTTPS, geo-restrictions, managed identities

**Issues to Address:**

- HTTP 503 errors during high CPU/memory usage
- HTTP 502 errors during high response times and network traffic
- Large webpage load sizes
- Authentication errors to Service Bus during local debugging

**Solution Approach:** Implement Azure App Service with appropriate scaling policies, Azure CDN for content delivery, Service Bus with managed identity authentication, and Application Insights for comprehensive monitoring.

---

# Topic 3 - Additional Questions

## [PDF] Question 40

**Topic: Blob Storage / Azure Functions**

You are developing a solution that uses the Azure Storage Client library for .NET. You have the following code: (Line numbers are included for reference only.)

For each of the following statements, select Yes if the statement is true. Otherwise, select No.

**Question:** Does AcquireLeaseAsync acquire an infinite lease if leaseTime is not specified?

**Correct Answer: Yes**

**Explanation:**
AcquireLeaseAsync does not specify leaseTime. leaseTime is a TimeSpan representing the span of time for which to acquire the lease, which will be rounded down to seconds. If null, an infinite lease will be acquired. If not null, this must be 15 to 60 seconds.

**Question:** Does GetBlockBlobReference create a new blob?

**Correct Answer: No**

**Explanation:**
The GetBlockBlobReference method just gets a reference to a block blob in this container.

**Question:** Does BreakLeaseAsync break the current lease?

**Correct Answer: Yes**

**Explanation:**
The BreakLeaseAsync method initiates an asynchronous operation that breaks the current lease on this container.

**Reference:**

- https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.storage.blob.cloudblobcontainer.acquireleaseasync
- https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.storage.blob.cloudblobcontainer.getblockblobreference
- https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.storage.blob.cloudblobcontainer.breakleaseasync

---

## [PDF] Question 41

**Topic: Blob Storage Lifecycle Management**

You are building a website that uses Azure Blob storage for data storage. You configure Azure Blob storage lifecycle to move all blobs to the archive tier after 30 days.

Customers have requested a service-level agreement (SLA) for viewing data older than 30 days.

You need to document the minimum SLA for data recovery.

Which SLA should you use?

A. at least two days
B. between one and 15 hours
C. at least one day
D. between zero and 60 minutes

**Correct Answer: B**

**Explanation:**
The archive access tier has the lowest storage cost. But it has higher data retrieval costs compared to the hot and cool tiers. Data in the archive tier can take several hours to retrieve depending on the priority of the rehydration. For small objects, a high priority rehydrate may retrieve the object from archive in under 1 hour.

**Reference:**
https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-storage-tiers?tabs=azure-portal

---

## [PDF] Question 42

**Topic: Cosmos DB / SQL API**

You are developing a ticket reservation system for an airline. The storage solution for the application must meet the following requirements:

- Ensure at least 99.99% availability and provide low latency
- Accept reservations even when localized network outages or other unforeseen failures occur
- Process reservations in the exact sequence as reservations are submitted to minimize overbooking or selling the same seat to multiple travelers
- Allow simultaneous and out-of-order reservations with a maximum five-second tolerance window

You provision a resource group named airlineResourceGroup in the Azure South-Central US region.

You need to provision a SQL API Cosmos DB account to support the app.

How should you complete the Azure CLI commands?

**Correct Answer:**

**Box 1: BoundedStaleness**
Bounded staleness: The reads are guaranteed to honor the consistent-prefix guarantee. The reads might lag behind writes by at most "K" versions (that is, "updates") of an item or by "T" time interval. In other words, when you choose bounded staleness, the "staleness" can be configured in two ways: The number of versions (K) of the item, The time interval (T) by which the reads might lag behind the writes.

**Box 2: --enable-automatic-failover true**
For multi-region Cosmos accounts that are configured with a single-write region, enable automatic-failover by using Azure CLI or Azure portal. After you enable automatic failover, whenever there is a regional disaster, Cosmos DB will automatically failover your account.

**Box 3: --locations 'southcentralus=0 eastus=1 westus=2'**
Need multi-region for accepting reservations even when localized network outages occur.

**Reference:**

- https://docs.microsoft.com/en-us/azure/cosmos-db/consistency-levels
- https://github.com/MicrosoftDocs/azure-docs/blob/master/articles/cosmos-db/manage-with-cli.md

---

## [PDF] Question 43

**Topic: App Service / Container Deployment**

You are preparing to deploy a Python website to an Azure Web App using a container. The solution will use multiple containers in the same container group. The Docker file builds the container and the Azure Container Registry instance named images is a private registry.

You build a container by using the following command. The Azure Container Registry instance named images is a private registry.

The user name and password for the registry is admin.

The Web App must always run the same version of the website regardless of future builds.

You need to create an Azure Web App to run the website.

**Correct Answer:**

**Box 1: --SKU B1 --hyper-v**
--hyper-v: Host web app on Windows container.

**Box 2: --deployment-source-url images.azurecr.io/website:v1.0.0**
--deployment-source-url -u: Git repository URL to link with manual integration.
The Web App must always run the same version of the website regardless of future builds.

**Box 3: az webapp config container set -url https://images.azurecr.io -u admin -p admin**
az webapp config container set: Set a web app container's settings.
Parameter: --docker-registry-server-url -r: The container registry server url.
The Azure Container Registry instance named images is a private registry.

**Reference:**
https://docs.microsoft.com/en-us/cli/azure/appservice/plan

---

## [PDF] Question 44

**Topic: App Service Auto Scaling**

You are developing a back-end Azure App Service that scales based on the number of messages contained in a Service Bus queue.

A rule already exists to scale up the App Service when the average queue length of unprocessed and valid queue messages is greater than 1000.

You need to add a new rule that will continuously scale down the App Service as long as the scale up condition is not met.

**Correct Answer:**

**Box 1: Service bus queue**
You are developing a back-end Azure App Service that scales based on the number of messages contained in a Service Bus queue.

**Box 2: ActiveMessage Count**
ActiveMessageCount: Messages in the queue or subscription that are in the active state and ready for delivery.

**Box 3: Count**

**Box 4: Less than or equal to**
You need to add a new rule that will continuously scale down the App Service as long as the scale up condition is not met.

**Box 5: Decrease count by**

---

## [PDF] Question 45

**Topic: Blob Storage Metadata**

You have an application that uses Azure Blob storage.

You need to update the metadata of the blobs.

Which three methods should you use to develop the solution? To answer, move the appropriate methods from the list of methods to the answer area and arrange them in the correct order.

**Correct Answer:**

1. **Metadata.Add** - Add metadata to the dictionary by calling the Add method
2. **SetMetadataAsync** - Set the blob's metadata
3. **SetPropertiesAsync** - Set the blob's properties

**Example Code:**

```csharp
// Add metadata to the dictionary by calling the Add method
metadata.Add("docType", "textDocuments");

// Set the blob's metadata.
await blob.SetMetadataAsync(metadata);

// Set the blob's properties.
await blob.SetPropertiesAsync();
```

**Reference:**
https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-properties-metadata

---

## [PDF] Question 46

**Topic: Event Grid vs Event Hub**

You are developing an Azure solution to collect point-of-sale (POS) device data from 2,000 stores located throughout the world. A single device can produce 2 megabytes (MB) of data every 24 hours. Each store location has one to five devices that send data.

You must store the device data in Azure Blob storage. Device data must be correlated based on a device identifier. Additional stores are expected to open in the future.

You need to implement a solution to receive the device data.

**Solution:** Provision an Azure Event Grid. Configure the machine identifier as the partition key and enable capture.

Does the solution meet the goal?

**Correct Answer: B. No**

**Explanation:**
Event Grid is designed for event-driven architectures with discrete events, not for high-volume streaming data like POS device telemetry. For this scenario, Azure Event Hub would be more appropriate as it's designed for high-throughput data streaming scenarios.

**Reference:**
https://docs.microsoft.com/en-us/azure/event-grid/compare-messaging-services

---

## [PDF] Question 47

**Topic: Message Queues vs Topics**

You develop Azure solutions. A .NET application needs to receive a message each time an Azure virtual machine finishes processing data. The messages must NOT persist after being processed by the receiving application.

You need to implement the .NET object that will receive the messages.

Which object should you use?

A. QueueClient
B. SubscriptionClient
C. TopicClient
D. CloudQueueClient

**Correct Answer: D. CloudQueueClient**

**Explanation:**
A queue allows processing of a message by a single consumer. Need a CloudQueueClient to access the Azure VM. In contrast to queues, topics and subscriptions provide a one-to-many form of communication in a publish and subscribe pattern. It's useful for scaling to large numbers of recipients.

**Reference:**
https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions

---

## [PDF] Question 48

**Topic: Storage Account Lifecycle Management**

You are maintaining an existing application that uses an Azure Blob GPv1 Premium storage account. Data older than three months is rarely used. Data newer than three months must be available immediately. Data older than a year must be saved but does not need to be available immediately.

You need to configure the account to support a lifecycle management rule that moves blob data to archive storage for data not modified in the last year.

Which three actions should you perform in sequence?

**Correct Answer:**

1. **Upgrade the storage account to GPv2** - Object storage data tiering between hot, cool, and archive is supported in Blob Storage and General Purpose v2 (GPv2) accounts. General Purpose v1 (GPv1) accounts don't support tiering.

2. **Copy the data to be archived to a Standard GPv2 storage account and then delete the data from the original storage account**

3. **Change the storage account access tier from hot to cool** - Only the hot and cool access tiers can be set at the account level. The archive access tier can only be set at the blob level.

**Reference:**
https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-storage-tiers

---

## [PDF] Question 49

**Topic: Cosmos DB Client**

You develop Azure solutions. You must connect to a No-SQL globally-distributed database by using the .NET API.

You need to create an object to configure and execute requests in the database.

Which code segment should you use?

A. new Container(EndpointUri, PrimaryKey);
B. new Database(EndpointUri, PrimaryKey);
C. new CosmosClient(EndpointUri, PrimaryKey);

**Correct Answer: C**

**Explanation:**
Example:

```csharp
// Create a new instance of the Cosmos Client
this.cosmosClient = new CosmosClient(EndpointUri, PrimaryKey)
//ADD THIS PART TO YOUR CODE
await this.CreateDatabaseAsync();
```

**Reference:**
https://docs.microsoft.com/en-us/azure/cosmos-db/sql-api-get-started

---

## [PDF] Question 50

**Topic: Storage Account Data Movement**

You have an existing Azure storage account that stores large volumes of data across multiple containers.

You need to copy all data from the existing storage account to a new storage account. The copy process must meet the following requirements:

- Automate data movement
- Minimize user input required to perform the operation
- Ensure that the data movement process is recoverable

What should you use?

A. AzCopy
B. Azure Storage Explorer
C. Azure portal
D. .NET Storage Client Library

**Correct Answer: A**

**Explanation:**
You can copy blobs, directories, and containers between storage accounts by using the AzCopy v10 command-line utility. The copy operation is synchronous so when the command returns, that indicates that all files have been copied.

**Reference:**
https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-blobs-copy

---

## [PDF] Question 51

**Topic: Managed Identity for Azure Resources**

You are developing a web service that will run on Azure virtual machines that use Azure Storage. You configure all virtual machines to use managed identities.

You have the following requirements:

- Secret-based authentication mechanisms are not permitted for accessing an Azure Storage account
- Must use only Azure Instance Metadata Service endpoints

You need to write code to retrieve an access token to access Azure Storage.

**Correct Answer:**

**Box 1: http://169.254.169.254/metadata/identity/oauth2/token**
Sample request using the Azure Instance Metadata Service (IMDS) endpoint (recommended):

```
GET 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/' HTTP/1.1
Metadata: true
```

**Box 2: JsonConvert.DeserializeObject<Dictionary<string,string>>(payload);**
Deserialized token response; returning access code.

**Reference:**

- https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/how-to-use-vm-token
- https://docs.microsoft.com/en-us/azure/service-fabric/how-to-managed-identity-service-fabric-app-code

---

## [PDF] Question 52

**Topic: Cosmos DB Indexing Policy**

You are developing a new page for a website that uses Azure Cosmos DB for data storage. The feature uses documents that have a specific format.

You must display data for the new page in a specific order. You create a query for the page that orders by multiple properties.

You need to configure a Cosmos DB policy to support the query.

**Correct Answer:**

**Box 1: compositeIndexes**
You can order by multiple properties. A query that orders by multiple properties requires a composite index.

**Box 2: descending**
Example: Composite index defined for (name ASC, age ASC): It is optional to specify the order. If not specified, the order is ascending.

```json
{
	"automatic": true,
	"indexingMode": "Consistent",
	"includedPaths": [
		{
			"path": "/*"
		}
	],
	"excludedPaths": [],
	"compositeIndexes": [
		[
			{
				"path": "/name"
			},
			{
				"path": "/age"
			}
		]
	]
}
```

---

## [PDF] Question 53

**Topic: Event Hub Configuration**

You are building a traffic monitoring system that monitors traffic along six highways. The system produces time series analysis-based reports for each highway.

Data from traffic sensors are stored in Azure Event Hub. Traffic data is consumed by four departments. Each department has an Azure Web App that displays the time series-based reports and contains a WebJob that processes the incoming data from Event Hub. All Web Apps run on App Service Plans with three instances.

Data throughput must be maximized. Latency must be minimized.

You need to implement the Azure Event Hub.

**Correct Answer:**

**Box 1: 6**
The number of partitions is specified at creation and must be between 2 and 32. There are 6 highways.

**Box 2: Highway**
Use the highway identifier as the partition key to ensure data from the same highway goes to the same partition.

**Reference:**
https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-features

---

## [PDF] Question 54

**Topic: Azure Kubernetes Service / Ingress Controller**

You are developing a microservices solution. You plan to deploy the solution to a multinode Azure Kubernetes Service (AKS) cluster.

You need to deploy a solution that includes the following features:

- reverse proxy capabilities
- configurable traffic routing
- TLS termination with a custom certificate

Which components should you use?

**Correct Answer:**

**Box 1: Helm**
To create the ingress controller, use Helm to install nginx-ingress.

**Box 2: kubectl**
To find the cluster IP address of a Kubernetes pod, use the kubectl get pod command on your local machine, with the option -o wide.

**Box 3: Ingress Controller**
An ingress controller is a piece of software that provides reverse proxy, configurable traffic routing, and TLS termination for Kubernetes services. Kubernetes ingress resources are used to configure the ingress rules and routes for individual Kubernetes services.

**Reference:**
https://docs.microsoft.com/bs-cyrl-ba/azure/aks/ingress-basic

---

## [PDF] Question 55

**Topic: Service Bus Filtering**

You are implementing an order processing system. A point of sale application publishes orders to topics in an Azure Service Bus queue. The Label property for the topic includes specific data.

The system has specific requirements for subscriptions and you need to implement filtering and maximize throughput while evaluating filters.

**Correct Answer:**

**FutureOrders: SQLFilter** - Complex date/time comparisons require SQL Filter
**HighPriorityOrders: CorrelationFilter** - CorrelationID only, simple property matching
**InternationalOrders: SQLFilter** - Country NOT USA requires an SQL Filter  
**HighQuantityOrders: SQLFilter** - Need to use relational operators so an SQL Filter is needed
**AllOrders: No Filter** - No filtering needed

**Explanation:**

- **SQL Filter:** SQL Filters hold a SQL-like conditional expression that is evaluated in the broker against the arriving messages' user-defined properties and system properties. All system properties must be prefixed with sys. in the conditional expression.
- **Correlation Filters:** A CorrelationFilter holds a set of conditions that are matched against one or more of an arriving message's user and system properties. A common use is to match against the CorrelationId property.

**Reference:**
https://docs.microsoft.com/en-us/azure/service-bus-messaging/topic-filters

---

## [PDF] Question 56

**Topic: CDN Content Distribution**

Your company has several websites that use a company logo image. You use Azure Content Delivery Network (CDN) to store the static image.

You need to determine the correct process of how the CDN and the Point of Presence (POP) server will distribute the image and list the items in the correct order.

**Correct Answer:**

**Step 1:** A user requests the image using a URL with a special domain name, such as <endpoint name>.azureedge.net. The DNS routes the request to the best performing POP location, which is usually the POP that is geographically closest to the user.

**Step 2:** If no edge servers in the POP have the file in their cache, the POP requests the file from the origin server. The origin server can be an Azure Web App, Azure Cloud Service, Azure Storage account, or any publicly accessible web server.

**Step 3:** The origin server returns the file to an edge server in the POP.

**Step 4:** An edge server in the POP caches the file and returns the file to the original requestor. The file remains cached on the edge server in the POP until the time-to-live (TTL) specified by its HTTP headers expires. Subsequent requests for the same file can be served directly from the cache.

**Reference:**
https://docs.microsoft.com/en-us/azure/cdn/cdn-overview

---

## [PDF] Question 57

**Topic: Cosmos DB Partition Key Selection**

You are developing an Azure Cosmos DB solution by using the Azure Cosmos DB SQL API. The data includes millions of documents. Each document may contain hundreds of properties.

The properties of the documents do not contain distinct values for partitioning. Azure Cosmos DB must scale individual containers in the database to meet the performance needs of the application by spreading the workload evenly across all partitions over time.

You need to select a partition key.

Which two partition keys can you use? Each correct answer presents a complete solution.

A. a single property value that does not appear frequently in the documents
B. a value containing the collection name
C. a single property value that appears frequently in the documents  
D. a concatenation of multiple property values with a random suffix appended
E. a hash suffix appended to a property value

**Correct Answer: D, E**

**Explanation:**
You can form a partition key by concatenating multiple property values into a single artificial partitionKey property. These keys are referred to as synthetic keys. Another possible strategy to distribute the workload more evenly is to append a random number at the end of the partition key value. When you distribute items in this way, you can perform parallel write operations across partitions.

**Reference:**
https://docs.microsoft.com/en-us/azure/cosmos-db/synthetic-partition-keys

---

## [PDF] Question 58

**Topic: Cosmos DB Container Operations**

You are developing an Azure-hosted e-commerce web application. The application will use Azure Cosmos DB to store sales orders. You are using the latest SDK to manage the sales orders in the database.

You create a new Azure Cosmos DB instance. You include a valid endpoint and valid authorization key to an appSettings.json file in the code project.

You are evaluating the following application code:

For each of the following statements, select Yes if the statement is true. Otherwise, select No.

**Correct Answer:**

**Box 1: Yes** - The createDatabaseIfNotExistsAsync method checks if a database exists, and if it doesn't, create it. The Database.CreateContainerAsync method creates a container as an asynchronous operation in the Azure Cosmos service.

**Box 2: Yes** - The CosmosContainer.CreateItemAsync method creates an item as an asynchronous operation in the Azure Cosmos service.

**Box 3: Yes** - The code follows the correct pattern for Cosmos DB operations.

**Reference:**

- https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.cosmos.cosmosclient.createdatabaseifnotexistsasync
- https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.cosmos.database.createcontainerasync
- https://docs.microsoft.com/en-us/dotnet/api/azure.cosmos.cosmoscontainer.createitemasync

---

## [PDF] Question 59

**Topic: Cosmos DB Change Feed**

You develop an Azure solution that uses Cosmos DB. The current Cosmos DB container must be replicated and must use a partition key that is optimized for queries.

You need to implement a change feed processor solution.

Which change feed processor components should you use?

**Correct Answer:**

**Box 1: The monitored container** - The monitored container has the data from which the change feed is generated. Any inserts and updates to the monitored container are reflected in the change feed of the container.

**Box 2: The lease container** - The lease container acts as a state storage and coordinates processing the change feed across multiple workers. The lease container can be stored in the same account as the monitored container or in a separate account.

**Box 3: The host** - A host is an application instance that uses the change feed processor to listen for changes. Multiple instances with the same lease configuration can run in parallel, but each instance should have a different instance name.

**Box 4: The delegate** - The delegate is the code that defines what you, the developer, want to do with each batch of changes that the change feed processor reads.

**Reference:**
https://docs.microsoft.com/en-us/azure/cosmos-db/change-feed-processor

---

# Topic 4 - Additional Questions

## [PDF] Question 60

**Topic: Azure Cosmos DB RBAC**

You are developing a Java application that uses Cassandra to store key and value data. You plan to use a new Azure Cosmos DB resource and the Cassandra API in the application. You create an Azure Active Directory (Azure AD) group named Cosmos DB Creators to enable provisioning of Azure Cosmos accounts, databases, and containers.

The Azure AD group must not be able to access the keys that are required to access the data.

You need to restrict access to the Azure AD group.

Which role-based access control should you use?

A. DocumentDB Accounts Contributor
B. Cosmos Backup Operator
C. Cosmos DB Operator
D. Cosmos DB Account Reader

**Correct Answer: C**

**Explanation:**
Azure Cosmos DB now provides a new RBAC role, Cosmos DB Operator. This new role lets you provision Azure Cosmos accounts, databases, and containers, but can't access the keys that are required to access the data. This role is intended for use in scenarios where the ability to grant access to Azure Active Directory service principals to manage deployment operations for Cosmos DB is needed, including the account, database, and containers.

**Reference:**
https://azure.microsoft.com/en-us/updates/azure-cosmos-db-operator-role-for-role-based-access-control-rbac-is-now-available/

---

## [PDF] Question 61

**Topic: Azure AD Group Claims**

You are developing a website that will run as an Azure Web App. Users will authenticate by using their Azure Active Directory (Azure AD) credentials.

You plan to assign users one of the following permission levels for the website: admin, normal, and reader. A user's Azure AD group membership must be used to determine the permission level.

You need to configure authorization.

**Solution:** Configure the Azure Web App for the website to allow only authenticated requests and require Azure AD log on.

Does the solution meet the goal?

**Correct Answer: B. No**

**Explanation:**
Instead in the Azure AD application's manifest, set value of the groupMembershipClaims option to All.

**Reference:**
https://blogs.msdn.microsoft.com/waws/2017/03/13/azure-app-service-authentication-aad-groups/

---

## [PDF] Question 62

**Topic: Azure AD Group Claims - Correct Solution**

You are developing a website that will run as an Azure Web App. Users will authenticate by using their Azure Active Directory (Azure AD) credentials.

You plan to assign users one of the following permission levels for the website: admin, normal, and reader. A user's Azure AD group membership must be used to determine the permission level.

You need to configure authorization.

**Solution:**

- Create a new Azure AD application. In the application's manifest, set value of the groupMembershipClaims option to All.
- In the website, use the value of the groups claim from the JWT for the user to determine permissions.

Does the solution meet the goal?

**Correct Answer: A. Yes**

**Explanation:**
To configure Manifest to include Group Claims in Auth Token:

1. Go to Azure Active Directory to configure the Manifest
2. Click on your application and edit the Manifest
3. Locate the "groupMembershipClaims" setting. Set its value to either "SecurityGroup" or "All"
   - SecurityGroup: groups claim will contain the identifiers of all security groups of which the user is a member
   - All: groups claim will contain the identifiers of all security groups and all distribution lists of which the user is a member

**Reference:**
https://blogs.msdn.microsoft.com/waws/2017/03/13/azure-app-service-authentication-aad-groups/

---

## [PDF] Question 63

**Topic: Key Vault Protection Features**

You are developing an application to securely transfer data between on-premises file systems and Azure Blob storage. The application stores keys, secrets, and certificates in Azure Key Vault. The application uses the Azure Key Vault APIs.

The application must allow recovery of an accidental deletion of the key vault or key vault objects. Key vault objects must be retained for 90 days after deletion.

You need to protect the key vault and key vault objects.

Which Azure Key Vault feature should you use?

**Correct Answer:**

**Box 1: Soft delete** - When soft-delete is enabled, resources marked as deleted resources are retained for a specified period (90 days by default). The service further provides a mechanism for recovering the deleted object, essentially undoing the deletion.

**Box 2: Purge protection** - Purge protection is an optional Key Vault behavior and is not enabled by default. Purge protection can only be enabled once soft-delete is enabled. When purge protection is on, a vault or an object in the deleted state cannot be purged until the retention period has passed. Soft-deleted vaults and objects can still be recovered, ensuring that the retention policy will be followed.

**Reference:**
https://docs.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview

---

## [PDF] Question 64

**Topic: API Management Authentication**

You provide an Azure API Management managed web service to clients. The back-end web service implements HTTP Strict Transport Security (HSTS).

Every request to the backend service must include a valid HTTP authorization header.

You need to configure the Azure API Management instance with an authentication policy.

Which two policies can you use? Each correct answer presents a complete solution.

A. Basic Authentication
B. Digest Authentication  
C. Certificate Authentication
D. OAuth Client Credential Grant

**Correct Answer: C, D**

**Explanation:**
Certificate Authentication and OAuth Client Credential Grant are both valid authentication mechanisms that can provide the required HTTP authorization headers for API Management to communicate with backend services that require authentication.

---

## [PDF] Question 65

**Topic: Azure AD Application Configuration for Blob Storage**

You are developing an ASP.NET Core website that can be used to manage photographs which are stored in Azure Blob Storage containers.

Users of the website authenticate by using their Azure Active Directory (Azure AD) credentials.

You implement role-based access control (RBAC) role permissions on the containers that store photographs. You assign users to RBAC roles.

You need to configure the website's Azure AD Application so that user's permissions can be used with the Azure Blob containers.

**Correct Answer:**

**Box 1: user_impersonation** - This delegated permission allows the application to access Azure Storage on behalf of the signed-in user.

**Box 2: delegated** - Delegated permissions are used when an application needs to access an API as the signed-in user.

**Box 3: delegated** - For Microsoft Graph API access, delegated permissions are also used.

**Reference:**
https://docs.microsoft.com/en-us/samples/azure-samples/active-directory-dotnet-webapp-webapi-openidconnect-aspnetcore/calling-a-web-api-in-an-aspnet-core-web-application-using-azure-ad/

---

## [PDF] Question 66

**Topic: App Service Feature Flags**

You are developing an ASP.NET Core app that includes feature flags which are managed by Azure App Configuration. You create an Azure App Configuration store named AppFeatureFlagStore that contains a feature flag named Export.

You need to update the app to meet the following requirements:

- Use the Export feature in the app without requiring a restart of the app
- Validate users before users are allowed access to secure resources
- Permit users to access secure resources

How should you complete the code segment?

**Correct Answer:**

**Box 1: UseAuthentication** - Need to validate users before users are allowed access to secure resources. UseAuthentication adds the AuthenticationMiddleware to the specified IApplicationBuilder, which enables authentication capabilities.

**Box 2: UseAuthorization** - Need to permit users to access secure resources. UseAuthorization adds the AuthorizationMiddleware to the specified IApplicationBuilder, which enables authorization capabilities.

**Box 3: UseStaticFiles** - Need to use the Export feature in the app without requiring a restart of the app. UseStaticFiles enables static file serving for the current request path.

**Reference:**
https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.iapplicationbuilder?view=aspnetcore-5.0

---

## [PDF] Question 67

**Topic: Key Vault vs Managed Identity**

You have an application that includes an Azure Web app and several Azure Function apps. Application secrets including connection strings and certificates are stored in Azure Key Vault.

Secrets must not be stored in the application or application runtime environment. Changes to Azure Active Directory (Azure AD) must be minimized.

You need to design the approach to loading application secrets.

What should you do?

A. Create a single user-assigned Managed Identity with permission to access Key Vault and configure each App Service to use that Managed Identity.
B. Create a single Azure AD Service Principal with permission to access Key Vault and use a client secret from within the App Services to access Key Vault.
C. Create a system assigned Managed Identity in each App Service with permission to access Key Vault.
D. Create an Azure AD Service Principal with Permissions to access Key Vault for each App Service and use a certificate from within the App Services to access Key Vault.

**Correct Answer: C**

**Explanation:**
Use Key Vault references for App Service and Azure Functions. Key Vault references currently only support system-assigned managed identities. User-assigned identities cannot be used.

**Reference:**
https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references

---

## [PDF] Question 68

**Topic: Medical Records Encryption**

You are developing a medical records document management website. The website is used to store scanned copies of patient intake forms.

If the stored intake forms are downloaded from storage by a third party, the contents of the forms must not be compromised.

You need to store the intake forms according to the requirements.

**Solution:**

1. Create an Azure Key Vault key named skey.
2. Encrypt the intake forms using the public key portion of skey.
3. Store the encrypted data in Azure Blob storage.

Does the solution meet the goal?

**Correct Answer: A. Yes**

**Explanation:**
This solution properly encrypts the data using Azure Key Vault before storing it in Blob storage, ensuring that if the data is accessed by third parties, it remains protected.

---

## [PDF] Question 69

**Topic: Azure Disk Encryption**

You plan to deploy a new application to a Linux virtual machine (VM) that is hosted in Azure.

The entire VM must be secured at rest by using industry-standard encryption technology to address organizational security and compliance requirements.

You need to configure Azure Disk Encryption for the VM.

**Correct Answer:**

**Box 1: keyvault** - Create an Azure Key Vault with az keyvault create and enable the Key Vault for use with disk encryption.

**Box 2: keyvault key** - Create a cryptographic key in your Key Vault with az keyvault key create.

**Box 3: vm** - Create a VM with az vm create.

**Box 4: vm encryption** - Encrypt your VM with az vm encryption enable.

**Box 5: all** - Encrypt both data and operating system.

**Reference:**
https://docs.microsoft.com/en-us/azure/virtual-machines/linux/disk-encryption-cli-quickstart

---

## [PDF] Question 70

**Topic: API Authentication Mechanisms**

Your company is developing an Azure API hosted in Azure.

You need to implement authentication for the Azure API to access other Azure resources. You have the following requirements:

- All API calls must be authenticated
- Callers to the API must not send credentials to the API

Which authentication mechanism should you use?

A. Basic
B. Anonymous
C. Managed identity
D. Client certificate

**Correct Answer: C**

**Explanation:**
Azure Active Directory Managed Service Identity (MSI) gives your code an automatically managed identity for authenticating to Azure services, so that you can keep credentials out of your code. Use the authentication-managed-identity policy to authenticate with a backend service using the managed identity.

**Reference:**

- https://azure.microsoft.com/en-us/blog/keep-credentials-out-of-code-introducing-azure-ad-managed-service-identity/
- https://docs.microsoft.com/en-us/azure/api-management/api-management-authentication-policies

## [PDF] Question 71

**Topic: Azure AD B2C / Authentication**

You develop a web application.

You need to register the application with an active Azure Active Directory (Azure AD) tenant.

Which three actions should you perform in sequence?

A. Select New registration
B. Specify who can use the application
C. Under Redirect URI, select the type of app you're building and enter the redirect URI
D. Search for and select Azure Active Directory
E. Create a new Azure AD tenant

**Correct Answer: A, B, C**

**Explanation:** Register a new application using the Azure portal

1. Sign in to the Azure portal using either a work or school account or a personal Microsoft account.
2. If your account gives you access to more than one tenant, select your account in the upper right corner. Set your portal session to the Azure AD tenant that you want.
3. Search for and select Azure Active Directory. Under Manage, select App registrations.
4. Select New registration. (Step 1)
5. In Register an application, enter a meaningful application name to display to users.
6. Specify who can use the application. Select the Azure AD instance. (Step 2)
7. Under Redirect URI (optional), select the type of app you're building: Web or Public client (mobile & desktop). Then enter the redirect URI, or reply URL, for your application. (Step 3)
8. When finished, select Register.

## [PDF] Question 72

**Topic: Azure AD B2C / MFA**

You have a new Azure subscription. You are developing an internal website for employees to view sensitive data. The website uses Azure Active Directory (Azure AD) for authentication.

You need to implement multifactor authentication for the website.

Which two actions should you perform? Each correct answer presents part of the solution.

A. Configure the website to use Azure AD B2C.
B. In Azure AD, create a new conditional access policy.
C. Upgrade to Azure AD Premium.
D. In Azure AD, enable application proxy.
E. In Azure AD conditional access, enable the baseline policy.

**Correct Answer: B, C**

**Explanation:** B: MFA Enabled by conditional access policy. It is the most flexible means to enable two-step verification for your users. Enabling using conditional access policy only works for Azure MFA in the cloud and is a premium feature of Azure AD.
C: Multi-Factor Authentication comes as part of the following offerings:

- Azure Active Directory Premium licenses - Full featured use of Azure Multi-Factor Authentication Service (Cloud) or Azure Multi-Factor Authentication Server (On-premises).
- Multi-Factor Authentication for Office 365
- Azure Active Directory Global Administrators

## [PDF] Question 73

**Topic: Shared Access Signatures**

A development team is creating a new REST API. The API will store data in Azure Blob storage. You plan to deploy the API to Azure App Service.

Developers must access the Azure Blob storage account to develop the API for the next two months. The Azure Blob storage account must not be accessible by the developers after the two-month time period.

You need to grant developers access to the Azure Blob storage account.

What should you do?

A. Generate a shared access signature (SAS) for the Azure Blob storage account and provide the SAS to all developers.
B. Create and apply a new lifecycle management policy to include a last accessed date value. Apply the policy to the Azure Blob storage account.
C. Provide all developers with the access key for the Azure Blob storage account. Update the API to include the Coordinated Universal Time (UTC) timestamp for the request header.
D. Grant all developers access to the Azure Blob storage account by assigning role-based access control (RBAC) roles.

**Correct Answer: A**

**Explanation:** A shared access signature (SAS) provides secure delegated access to resources in your storage account without compromising the security of your data. With a SAS, you have granular control over how a client can access your data.

## [PDF] Question 74

**Topic: Queue Storage / Service Bus**

You manage a data processing application that receives requests from an Azure Storage queue.

You need to manage access to the queue. You have the following requirements:

- Provide other applications access to the Azure queue.
- Ensure that you can revoke access to the queue without having to regenerate the storage account keys.
- Specify access at the queue level and not at the storage account level.

Which type of shared access signature (SAS) should you use?

A. Service SAS with a stored access policy
B. Account SAS
C. User Delegation SAS
D. Service SAS with ad hoc SAS

**Correct Answer: A**

**Explanation:** A service SAS is secured with the storage account key. A service SAS delegates access to a resource in only one of the Azure Storage services: Blob storage, Queue storage, Table storage, or Azure Files.
Stored access policies give you the option to revoke permissions for a service SAS without having to regenerate the storage account keys.

## [PDF] Question 75

**Topic: Azure Functions / Key Vault**

You are developing an Azure Function that calls external APIs by providing an access token for the API. The access token is stored in a secret named token in an Azure Key Vault named mykeyvault.

You need to ensure the Azure Function can access to the token. Which value should you store in the Azure Function App configuration?

A. KeyVault:mykeyvault;Secret:token
B. App:Settings:Secret:mykeyvault:token
C. AZUREKVCONNSTR\_https://mykeyveult.vault.ezure.net/secrets/token/
D. @Microsoft.KeyVault(SecretUri=https://mykeyvault.vault.azure.net/secrets/token/)

**Correct Answer: D**

**Explanation:** Add Key Vault secrets reference in the Function App configuration.
Syntax: @Microsoft.KeyVault(SecretUri={copied identifier for the username secret})

## [PDF] Question 76

**Topic: Container Instances / Security**

You develop a Python application for image rendering that uses GPU resources to optimize rendering processes. You deploy the application to an Azure Container Instances (ACI) Linux container.

The application requires a secret value to be passed when the container is started. The value must only be accessed from within the container.

You need to pass the secret value.

What are two possible ways to achieve this goal? Each correct answer presents a complete solution.

A. Create an environment variable Set the secureValue property to the secret value.
B. Add the secret value to the container image. Use a managed identity.
C. Add the secret value to the application code Set the container startup command.
D. Add the secret value to an Azure Blob storage account. Generate a SAS token.
E. Mount a secret volume containing the secret value in a secrets file.

**Correct Answer: A, E**

**Explanation:** A: Secure environment variables - Another method (another than a secret volume) for providing sensitive information to containers (including Windows containers) is through the use of secure environment variables.
E: Use a secret volume to supply sensitive information to the containers in a container group. The secret volume stores your secrets in files within the volume, accessible by the containers in the container group. By storing secrets in a secret volume, you can avoid adding sensitive data like SSH keys or database credentials to your application code.

## [PDF] Question 77

**Topic: Microsoft Graph**

You are developing a user portal for a company.

You need to create a report for the portal that lists information about employees who are subject matter experts for a specific topic. You must ensure that administrators have full control and consent over the data.

Which technology should you use?

A. Microsoft Graph data connect
B. Microsoft Graph API
C. Microsoft Graph connectors

**Correct Answer: A**

**Explanation:** Data Connect grants a more granular control and consent model: you can manage data, see who is accessing it, and request specific properties of an entity. This enhances the Microsoft Graph model, which grants or denies applications access to entire entities.
Microsoft Graph Data Connect augments Microsoft Graph's transactional model with an intelligent way to access rich data at scale. The data covers how workers communicate, collaborate, and manage their time across all the applications and services in Microsoft 365.

## [PDF] Question 78

**Topic: Cosmos DB / Always Encrypted**

You are developing a Java application to be deployed in Azure. The application stores sensitive data in Azure Cosmos DB.

You need to configure Always Encrypted to encrypt the sensitive data inside the application.

What should you do first?

A. Create a new container to include an encryption policy with the JSON properties to be encrypted.
B. Create a customer-managed key (CMK) and store the key in a new Azure Key Vault instance.
C. Create a data encryption key (DEK) by using the Azure Cosmos DB SDK and store the key in Azure Cosmos DB.
D. Create an Azure AD managed identity and assign the identity to a new Azure Key Vault instance.

**Correct Answer: B**

**Explanation:** For Always Encrypted, you first need to create a customer-managed key (CMK) and store it in Azure Key Vault. This key is used to encrypt the data encryption keys (DEKs).

## [PDF] Question 79

**Topic: App Service / Managed Identity**

You develop and deploy an Azure App Service web app named App1. You create a new Azure Key Vault named Vault1. You import several API keys, passwords, certificates, and cryptographic keys into Vault1.

You need to grant App1 access to Vault1 and automatically rotate credentials. Credentials must not be stored in code.

What should you do?

A. Enable App Service authentication for App1. Assign a custom RBAC role to Vault1.
B. Add a TLS/SSL binding to App1.
C. Upload a self-signed client certificate to Vault1. Update App1 to use the client certificate.
D. Assign a managed identity to App1.

**Correct Answer: D**

**Explanation:** Managed identities for Azure resources provide Azure services with an automatically managed identity in Azure AD. This identity can be used to authenticate to any service that supports Azure AD authentication, including Key Vault, without having to store credentials in code.

## [PDF] Question 80

**Topic: API Management / Policy**

You are developing several Azure API Management (APIM) hosted APIs.

You must transform the APIs to hide private backend information and obscure the technology stack used to implement the backend processing.

You need to protect all APIs.

What should you do?

A. Configure and apply a new inbound policy scoped to a product.
B. Configure and apply a new outbound policy scoped to the operation.
C. Configure and apply a new outbound policy scoped to global.
D. Configure and apply a new backend policy scoped to global.

**Correct Answer: C**

**Explanation:** Outbound policies process the response before sending it back to the caller. To hide backend information and technology stack details globally across all APIs, you need to configure an outbound policy at the global scope.

```

```
