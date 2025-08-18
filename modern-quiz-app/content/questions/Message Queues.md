# Azure message queues

Question: Which of the following advanced features of Azure Service Bus creates a first-in, first-out (FIFO) guarantee?

- [ ] Transactions
- [ ] Scheduled delivery
- [x] Message sessions

Answer: To create a first-in, first-out (FIFO) guarantee in Service Bus, use sessions. Message sessions enable joint and ordered handling of unbounded sequences of related messages.  
Scheduled delivery: Messages can be submitted to a queue or topic for delayed processing, but that doesn't guarantee a FIFO.  
A transaction groups two or more operations together into an execution scope.

---

Question: In Azure Service Bus messages are durably stored which enables a load-leveling benefit. Which of the following correctly describes the load-leveling benefit relative to a consuming application's performance?

- [ ] Performance needs to handle peak load
- [x] Performance needs to handle average load
- [ ] Performance needs to handle low loads

Answer: Intermediating message producers and consumers with a queue means that the consuming application only has to be able to handle average load instead of peak load.

---

Question: What is a key consideration when choosing to use Service Bus queues over Storage queues?

- [x] Your solution requires the queue to provide a guaranteed first-in-first-out (FIFO) ordered delivery.
- [ ] Your application must store over 80 gigabytes of messages in a queue.
- [ ] You require server side logs of all of the transactions executed against your queues.

Answer: Service Bus queues provide a guaranteed first-in-first-out (FIFO) ordered delivery.

---

Question: What is the main difference between Service Bus queues and topics with subscriptions?

- [x] Queues allow processing of a message by a single consumer, while topics with subscriptions provide a one-to-many form of communication.
- [ ] Queues allow processing of a message by multiple consumers, while topics with subscriptions provide a one-to-one form of communication.
- [ ] Topics with subscriptions allow processing of a message by a single consumer, while queues provide a one-to-many form of communication.

Answer: A queue allows processing of a message by a single consumer. In contrast, topics and subscriptions provide a one-to-many form of communication.

---

Question: What is the role of the `ContentType` property in Service Bus message payloads?

- [ ] It encrypts the payload for secure transmission.
- [ ] It determines the size of the payload.
- [x] It enables applications to describe the payload, with the suggested format for the property values being a MIME content-type description.

Answer: The `ContentType` property describes the payload, suggesting a MIME content-type format.

---

Question: What is the purpose of the 'QueueClient' class in Azure Queue Storage when using .NET?

- [ ] It manages the configuration files for client applications.
- [x] It retrieves and manipulates queues stored in Azure Queue Storage.
- [ ] It creates and manage messages within a specific queue.

Answer: The 'QueueClient' class is used to interact with queues in Azure Queue Storage, including creating, retrieving, and deleting queues.

---

Question: You are building a logging system for a large-scale manufacturing automation system. You want to send a message to a centralized monitoring system whenever a specific machine error occurs. Once the error has been logged and the necessary maintenance team has been alerted, the message must be removed so that the monitoring system will not attempt to log it again. Which service should you use?

- [ ] Azure Event Hubs
- [ ] Azure Queue Storage
- [x] Azure Service Bus

Answer: Azure Service Bus supports "Receive and Delete" mode, where messages are immediately consumed and removed from the queue.  
Messages in Event Hubs are retained for a configured retention period, and consumers are responsible for tracking their position in the stream.  
In Queue Storage messages are hidden for a specified visibility timeout period, and if not deleted within that time, they become visible again.

---

Question: For which cases `param` could be of type `string`?

- [x] `ServiceBusSender.SendMessagesAsync(new ServiceBusMessage(param)`
- [ ] `QueueClient.SendAsync(new Message(param))`
- [x] `EventHubProducerClient.SendAsync(new EventData(param))`
- [ ] None of the listed

Answer: `EventData` and `ServiceBusMessage` support both `string` and `byte[]`, `Message` is for `byte[]` only. Prefer `byte[]` for `EventData`.

---

Question: For which cases `param` could be of type `byte[]`?

- [x] `ServiceBusSender.SendMessagesAsync(new ServiceBusMessage(param)`
- [x] `QueueClient.SendAsync(new Message(param))`
- [x] `EventHubProducerClient.SendAsync(new EventData(param))`
- [ ] None of the listed

Answer: All work with `byte[]`.

---

Question: You are developing an application that requires message storage of 50 GB and real-time messaging without polling the queue. Additionally, the solution must support ordered delivery (FIFO). Which Azure messaging service would best fit these requirements?

- [x] Service Bus
- [ ] Storage Queue
- [ ] Event Hub
- [ ] Event Grid

Answer: Storage Queue can handle large message storage (up to 500 TB), but it lacks real-time messaging and FIFO. Service Bus, on the other hand, supports all these requirements, making it the suitable choice.

---

Question: Your application requires an event-based architecture that can handle millions of events per second with low latency. Additionally, the solution must provide support for custom topics and a maximum queue size of 30 GB. Which Azure messaging service would you choose?

- [ ] Service Bus
- [ ] Storage Queue
- [ ] Event Hub
- [x] Event Grid

Answer: Both Event Grid and Event Hub can handle millions of events per second. However, only Event Grid provides support for custom topics (the equivalent would be a namespace - a scoping container in which you can have multiple Event Hubs - but this does not allows advanced filtering and fine-grained control over the events that are published and subscribed to), and the maximum queue size requirement does not apply to Event Grid, making it the ideal choice.

---

Question: Your application needs to process large-scale data streams, retain messages for a 1-day retention period, and support a maximum message size of 1 MB. Which Azure messaging service would you choose?

- [ ] Service Bus
- [ ] Storage Queue
- [x] Event Hub
- [ ] Event Grid

Answer: Both Event Hub and Event Grid are suitable for event-based architectures and support message size of 1 MB. However, only Event Hub provides configurable message retention (up to 7 days).

---

Question: You are developing a real-time analytics system in Azure for a global e-commerce platform. You need to separate the order processing system from the analytics engine to enhance the scalability and robustness of the system. You must select an Azure service that allows one-to-one data communication, monitors the status of data manipulation, and adheres to the HTTPS protocol. The data transfer is anticipated to peak at 100 GB. Which Azure service would be the most suitable for this scenario?

- [ ] Azure Blob Storage
- [ ] Azure Service Bus
- [ ] Azure Event Hub
- [x] Azure Queue Storage

Answer: Azure Queue Storage enables point-to-point data exchange via HTTPS and can handle large volumes (up to 500 TB), and tracking data processing.  
Azure Service Bus supports HTTPS and point-to-point connections (queues) or one-to-many scenarios (topics), it is limited to 80 GB of message storage.

---

Question: Which of the following queues supports automatic dead-lettering?

- [x] Service Bus Queues
- [ ] Storage Queues
- [ ] Both has automatic dead-lettering enabled by default
- [ ] None has automatic dead-lettering enabled by default

---

Question: Your company's financial analytics team has created a FraudDetectionService that scans incoming transactions for potential fraudulent activity. Any transaction with a risk score above a certain level must be manually verified by a company employee. You are tasked with securely storing these high-risk transaction records, which are expected to number in the millions every hour, for subsequent scrutiny. Which Azure service would be most appropriate for storing these records for later evaluation?

- [ ] Azure Storage Queue
- [ ] Azure Service Bus Topic
- [ ] Azure Event Grid Topic
- [x] Azure Event Hub

Answer: Azure Event Hub is ideal for storing high-volume data like high-risk transaction records for future scrutiny.

---

Question: You are tasked with designing an Azure-based solution to collect data from 10,000 IoT devices located globally. Each device will send up to 1 MB of data every 24 hours. The data must be stored in Azure Blob Storage and should be easily correlated based on the device identifier. Which Azure service would be the most appropriate to receive and route this device data?

- [ ] Azure Event Grid
- [ ] Azure IoT Hub
- [ ] Azure Data Lake Storage with Azure Databricks
- [x] Azure Event Hubs
- [ ] Azure Queue Storage

Answer: Designed for high-throughput, real-time data ingestion and processing. It can handle the data volume and allows for easy correlation based on sensor identifiers. It also integrates well with Azure Blob Storage for long-term data retention. Note: Another option would be _Azure IoT Hub_.  
Azure Event Grid: While it can route events effectively, it's not designed for high-throughput data ingestion. The payload size is also limited to 64 KB.  
Azure Data Lake Storage with Azure Databricks: This combination is more suitable for big data analytics and could be an overkill for simple storage requirements. It's also more expensive.  
Azure Queue Storage: Useful for message queuing but not optimized for the IoT data ingestion scenario described.

---

Question: Create a sequence of actions in Azure Logic App service with these objectives:

- Activate the sequence when a virtual machine undergoes deallocation.
- Forward an email to the IT Administrator outlining the event's particulars.

Which Azure service would you enlist to kickstart your sequence?

- [ ] Azure Event Hubs
- [x] Azure Event Grid
- [ ] Azure Service Bus
- [ ] Azure Functions

Answer: Azure Event Grid is specialized for event-driven architecture and can be seamlessly coupled with Azure Logic Apps. It's the optimal choice for being alerted about VM deallocation events within a specific resource group.

---

Question: Your organization is tasked with building a solution requiring a messaging service in Azure. The messaging framework must:

- Enable transactional operations
- Detect duplicate messages
- Ensure messages have an indefinite lifespan

Which two of the following options meet these criteria?

- [ ] Azure Event Hubs
- [x] Azure Service Bus Queue
- [x] Azure Service Bus Topic
- [ ] Azure Storage Queues

Answer: Both Azure Service Bus Queue and Azure Service Bus Topic can be configured to support transactions, detect duplicate messages, and allow messages to remain indefinitely. You can specify an extremely long time-to-live (TTL) for messages in both the queue and topic.  
Azure Event Hubs is designed for high-throughput data streaming and doesn't offer transactional support or duplicate detection.  
Azure Storage Queues lack features like transactional support and duplicate detection, making them unsuitable for these requirements.

---
