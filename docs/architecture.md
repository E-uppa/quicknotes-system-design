# QuickNotes System Architecture

## 1. Functional Requirements

- Users can register and authenticate securely.
- Authenticated users can create, read, update and delete their own notes.
- Users can organize notes with tags.
- Users can search and paginate through their notes.
- Users cannot access notes belonging to other users unless explicitly authorized.
- The application provides clear loading, success, empty and error feedback.

## 2. Non-Functional Requirements

- **Availability:** The service should remain available during individual server failures.
- **Performance:** Common note-list requests should respond quickly under normal load.
- **Scalability:** The architecture should support growth in users and traffic by adding capacity.
- **Security:** Authentication, authorization, input validation, encrypted connections and safe password hashing are required.
- **Reliability:** Database backups, health checks, monitoring and tested recovery procedures are required.
- **Consistency:** Note creation and updates must be persisted reliably; reads requiring the latest changes should use an appropriate consistency path.
- **Maintainability:** Components should have clear responsibilities and be observable through logs, metrics and alerts.

## 3. Load Estimates for One Million Users

### Assumptions

- Registered users: 1,000,000.
- Daily active users: 10% of registered users.
- Each active user reads 50 notes or note-list pages per day.
- Each active user creates 2 notes per day.
- Average stored note size, including basic metadata: 2 KB.
- One day has 86,400 seconds and one year has 365 days.
- Peak traffic is estimated at five times the average.
- Reads and writes are averaged across 24 hours.
- Storage calculations exclude backups, replicas, indexes, logs and other overhead.

### Daily Active Users

1,000,000 × 10% = 100,000 daily active users.

### Reads per Second

Daily reads = 100,000 × 50 = 5,000,000 reads per day.

Average reads per second = 5,000,000 ÷ 86,400 = 57.87.

Average read load is approximately 58 reads per second.

Estimated peak reads per second = 57.87 × 5 = 289.35, or approximately 290 reads per second.

### Writes per Second

Daily note creations = 100,000 × 2 = 200,000 writes per day.

Average writes per second = 200,000 ÷ 86,400 = 2.31.

Average note-creation load is approximately 2.3 writes per second.

Estimated peak writes per second = 2.31 × 5 = 11.57, or approximately 12 writes per second.

These estimates count note creations as writes. Real traffic also includes updates, deletes, authentication and tag operations.

### Storage per Year

Daily storage growth = 200,000 notes × 2 KB = 400,000 KB, or approximately 400 MB per day.

Annual storage growth = 400 MB × 365 = 146,000 MB, or approximately 146 GB per year.

This is an estimate for the note records and their assumed basic metadata. Actual database storage will be higher because of indexes, tags, replicas, backups, logs and other fields.

## 4. Architecture Diagram

```text
                      +-----------------------+
                      | Browser / Mobile App  |
                      +-----------+-----------+
                                  |
                                  v
                      +-----------------------+
                      |          DNS          |
                      | Resolves service name |
                      +-----------+-----------+
                                  |
                                  v
                      +-----------------------+
                      |          CDN          |
                      | Static assets / cache |
                      +-----------+-----------+
                                  |
                                  v
                      +-----------------------+
                      |     Load Balancer     |
                      +-----------+-----------+
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
              +-----------+ +-----------+ +-----------+
              | App       | | App       | | App       |
              | Server 1  | | Server 2  | | Server 3  |
              +-----+-----+ +-----+-----+ +-----+-----+
                    |             |             |
                    +-------------+-------------+
                                  |
             +--------------------+--------------------+
             |                    |                    |
             v                    v                    v
       +-----------+       +-------------+      +-------------+
       | Cache     |       | Primary DB  |----->| Read Replica|
       | Note lists|       | Notes/users |      | Read queries|
       +-----------+       +------+------+      +-------------+
                                  |
                                  v
                          +---------------+
                          | Message Queue |
                          +-------+-------+
                                  |
                                  v
                          +---------------+
                          | Background    |
                          | Worker        |
                          +---------------+
```

The CDN primarily serves cached static assets; API requests that require application logic continue to the load balancer. The cache and database are accessed by application servers as appropriate. The queue and worker handle background tasks such as notifications, exports or other work that should not delay a normal API response.

## 5. Component Responsibilities

- **Browser / Mobile App:** Provides the user interface for managing notes and sends API requests.
- **DNS:** Resolves the service's domain name to the appropriate network destination.
- **CDN:** Caches and serves static assets from distributed locations, reducing latency and load on the origin.
- **Load balancer:** Distributes API traffic across healthy application servers and routes requests away from unhealthy instances.
- **Application servers:** Run business logic, validate requests, authenticate users, enforce ownership, and coordinate cache and database operations.
- **Cache:** Stores frequently requested note-list results or other reusable data to reduce repeated database reads.
- **Primary database:** Stores authoritative user, note and tag data and handles writes.
- **Read replica:** Serves suitable read queries to reduce primary database load; replication lag can make its data temporarily stale.
- **Message queue:** Buffers background jobs so they can be processed asynchronously and retried if necessary.
- **Background worker:** Processes queued work such as notifications or exports outside the main request path.

## 6. GET /notes Request Flow

1. The client resolves the service domain through DNS and sends an HTTPS request.
2. The load balancer routes the API request to a healthy application server. The CDN can serve static assets, but authenticated note data must follow the API's authorization rules.
3. The application server validates the access token and identifies the user.
4. The application checks the cache for a suitable result keyed by the user and query parameters.
5. If the cache contains valid data, the application returns it after enforcing the relevant access rules.
6. If the cache misses, the application reads the user's notes from the read replica when its consistency is suitable, or from the primary when the latest data is required.
7. The application returns a paginated JSON response and may cache the result for a suitable period.
8. Monitoring records latency, error rates and relevant operational metrics.

## 7. POST /notes Request Flow

1. The client sends `POST /notes` over HTTPS with a JSON body containing the title and optional body.
2. The load balancer forwards the request to a healthy application server.
3. The application validates the access token, identifies the user, validates the request body, and checks the title length.
4. The application inserts the note into the primary database with the authenticated user's ID. It does not trust an arbitrary owner ID supplied by the client.
5. After the database transaction succeeds, the application invalidates or updates affected cache entries.
6. If background work is required, such as sending a notification, the application enqueues a job for a worker.
7. The API returns `201 Created` with the created note and its ID.
8. Logs, metrics and alerts help the team identify failed writes, high latency and queue backlogs.

## 8. Trade-Offs

### Caching vs. Freshness

Caching improves read performance and reduces database work, but cached note lists can become stale after a note is created, updated or deleted. The service should use expiration policies and invalidate affected cache entries when changes occur.

### Read Replicas vs. Consistency

Read replicas improve read capacity, but replication lag may cause a recently updated note to appear outdated. Requests requiring the latest value should use the primary or another consistency mechanism.

### Asynchronous Jobs vs. Immediate Completion

Queues allow slow tasks to run outside the main request path, improving API responsiveness. However, jobs may be delayed or retried, so workers must handle failures and avoid harmful duplicate processing.

### Redundancy vs. Cost and Complexity

Multiple application servers and redundant infrastructure improve resilience, but they increase operational cost and require health checks, deployment coordination and monitoring.

## 9. Avoiding Single Points of Failure

- Run multiple application server instances across separate failure domains and use health checks with the load balancer.
- Use redundant load-balancing and DNS arrangements supported by the hosting platform.
- Deploy cache and queue services with appropriate replication or managed high-availability options, and define behavior when they are unavailable.
- Configure database backups and recovery procedures; use a supported primary failover strategy and monitor replication health.
- Avoid making background workers a single instance; run multiple workers where the job system supports safe parallel processing.
- Test recovery procedures and monitor service health rather than assuming redundancy alone guarantees availability.

## 10. Conclusion

QuickNotes is read-heavy under the stated workload assumptions, with approximately 58 reads per second on average and 2.3 note-creation writes per second. Peak estimates are approximately 290 reads per second and 12 note-creation writes per second. Note data growth is estimated at 146 GB per year before operational overhead.

Multiple application servers, a load balancer, caching and a read replica help support read traffic. A primary database remains the authoritative store for writes, while a queue and workers move suitable background work off the request path. Redundancy, monitoring, backups and tested recovery procedures reduce the risk of individual component failures. The design balances performance and availability against cost, consistency and operational complexity.
