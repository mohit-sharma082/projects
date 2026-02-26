# Docker Log Streamer - Architecture Documentation

## System Overview

Docker Log Streamer is a full-stack web application designed for real-time Docker container monitoring. It follows a client-server architecture with real-time WebSocket communication for log streaming.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Browser                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            React Frontend (Vite)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ ContainerList│  │  LogViewer   │  │ StatsPanel   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│        HTTP REST + WebSocket (Socket.io)                         │
│                           │                                      │
└─────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼────────────┐    ┌────────────▼──────────┐
│   Backend Server       │    │   Docker Daemon       │
│   (Node.js + Express)  │    │   (dockerd)           │
│                        │    │                       │
│  ┌────────────────┐    │    │  ┌────────────────┐   │
│  │  Express App   │    │    │  │  Containers    │   │
│  │  ├─ Routes     │    │    │  │  Logs/Stats    │   │
│  │  ├─ Socket.io  │    │    │  │  Lifecycle     │   │
│  │  └─ Docker API │────┼────┤  │                │   │
│  └────────────────┘    │    │  └────────────────┘   │
│                        │    │                       │
└────────────────────────┘    └───────────────────────┘
         Port 5010              /var/run/docker.sock
```

## High-Level Data Flow

### 1. Container Discovery
```
User loads app
    ↓
Frontend makes REST request
    ↓
GET /api/containers
    ↓
Backend queries Docker API
    ↓
Returns list of running containers
    ↓
Frontend renders container list
```

### 2. Real-time Log Streaming
```
User selects container
    ↓
Frontend subscribes via WebSocket
    ↓
'subscribe' event → Backend
    ↓
Backend attaches to container stream
    ↓
Container outputs logs
    ↓
Backend receives chunks
    ↓
Demultiplexes stdout/stderr (if non-TTY)
    ↓
Emits 'log' events to frontend
    ↓
Frontend appends lines to UI
    ↓
User sees real-time logs
```

### 3. Statistics Polling
```
StatsPanel component mounts
    ↓
useContainerStats hook starts polling
    ↓
Interval: every 3 seconds
    ↓
GET /api/containers/:id/stats
    ↓
Backend calls docker.stats()
    ↓
Calculates CPU%, memory%, network, I/O
    ↓
Returns stats object
    ↓
Frontend updates UI graphs
```

## Component Architecture

### Frontend Layer

#### Main Application Structure
```
src/
├── App.tsx                          # Root component
│   ├── ContainersSidebar           # Container list
│   └── ContainerDetails            # Selected container view
│       ├── LogViewer               # Real-time log display
│       └── StatsPanel              # Metrics dashboard
│
├── components/                     # React components
│   ├── ContainersSidebar.tsx       # Sorted, searchable container list
│   ├── ContainerDetails.tsx        # Tab-based container info
│   ├── LogViewer.tsx               # Syntax-highlighted log viewer
│   ├── StatsPanel.tsx              # Metrics visualization
│   ├── mode-toggle.tsx             # Dark/light theme
│   ├── theme-provider.tsx          # Theme context
│   └── ui/                         # Radix UI components
│       ├── button.tsx, card.tsx, etc.
│
├── hooks/
│   ├── useContainerLogs.ts         # Log streaming hook
│   ├── useContainerStats.ts        # Stats polling hook
│   └── use-mobile.ts               # Mobile detection
│
├── lib/
│   ├── api.ts                      # REST API calls
│   ├── socket.ts                   # Socket.io manager
│   └── utils.ts                    # Helper functions
│
└── main.tsx                        # Entry point
```

#### Key Components

**App.tsx**
- Global layout (header + sidebar + main)
- State management: `selectedContainer`, `serverUrl`, `globalQuery`
- Passes state to child components

**ContainersSidebar.tsx**
- Fetches container list from REST API
- Filters by `globalQuery` search
- Displays running containers with status badges
- Handles container selection

**ContainerDetails.tsx**
- Tabbed interface for detailed container info
- Renders LogViewer and StatsPanel
- Displays container metadata (ID, image, status)

**LogViewer.tsx**
- WebSocket subscriber to container logs
- Manages local line buffer (max 5000 lines)
- Features: pause/resume, auto-scroll, export, syntax highlighting
- Stream color coding (stdout, stderr, meta)

**StatsPanel.tsx**
- Uses `useContainerStats` hook
- Displays metrics in card format
- CPU sparkline chart
- Byte-formatted network/disk I/O

#### Custom Hooks

**useContainerLogs(containerId)**
```typescript
Returns: {
  lines: LogLine[]           // Array of log entries
  clear()                    // Clear line buffer
  pause()                    // Pause streaming
  resume()                   // Resume streaming
}

Subscribes to container on mount
Unsubscribes on unmount
Respects pause state
```

**useContainerStats(containerId, pollMs)**
```typescript
Returns: {
  stats: Stats               // Latest stats object
  loading: boolean
  error: Error | null
}

Polls REST API at interval
Returns CPU, memory, network, blkio
```

### Backend Layer

#### Express Server Structure
```
server/
├── index.js                        # Entry point, creates HTTP server
├── app.js                          # Express app setup
├── server.js                       # (Legacy/commented example)
├── socket.js                       # Socket.io initialization
├── docker.js                       # Docker client instance
├── utils.js                        # Helper functions
│
└── routes/
    ├── containers.js               # GET /api/containers
    ├── actions.js                  # POST .../:id/start|stop|restart
    ├── stats.js                    # GET /api/containers/:id/stats
```

#### Server Lifecycle

**initialization (index.js)**
```javascript
1. Require app (Express setup)
2. Require docker (Dockerode instance)
3. Initialize Socket.io with server
4. Listen on PORT (default 5010)
```

**Express App (app.js)**
- CORS middleware enabled
- JSON body parser
- Mount route handlers:
  - `/api/containers` → containers.js
  - `/api/containers` → actions.js
  - `/api/containers` → stats.js
  - `/healthz` → health check

#### REST API Endpoints

**GET /api/containers**
- Returns array of running containers
- Fields: Id, Names, Image, State, Status
- Error handling: 500 on Docker API failure

**GET /api/containers/:id/stats**
- Requests single stats snapshot from Docker
- Calculates derived metrics:
  - CPU % = (cpuDelta / systemDelta) × cpuCount × 100
  - Memory % = (usage / limit) × 100
- Aggregates network bytes across interfaces
- Aggregates block I/O bytes
- Returns: { cpu, memory, network, blkio, raw }

**POST /api/containers/:id/start**
- Calls Docker API start() method
- Returns: { ok: true } or error

**POST /api/containers/:id/stop**
- Calls Docker API stop() method
- Returns: { ok: true } or error

**POST /api/containers/:id/restart**
- Calls Docker API restart() method
- Returns: { ok: true } or error

#### Socket.io Events

**Server → Client Events**
```
'log' { id, stream, line }
  - id: Container ID
  - stream: 'stdout' | 'stderr' | 'meta'
  - line: Single log line (newlines stripped)
  
'error' { message, detail }
  - message: Error type
  - detail: Error details
```

**Client → Server Events**
```
'subscribe' { id }
  - Subscribes socket to container logs
  - Triggers initial tail (500 lines)
  - Starts live stream
  
'unsubscribe' { id }
  - Stops log streaming
  - Cleans up resources
```

#### Log Streaming Implementation

**TTY Containers**
- Stream is plain text (no multiplexing)
- Treated as stdout
- Data event handler buffers and splits by newline
- Emits one 'log' event per line

**Non-TTY Containers**
- Stream is multiplexed (Docker format with headers)
- Uses `docker.modem.demuxStream()` to separate stdout/stderr
- Creates two PassThrough streams
- Independent handlers for stdout/stderr
- Buffers and splits by newline for each stream

**Initial Tail**
- Fetches 500 lines separately for stdout and stderr
- Called immediately on subscribe
- Avoids multiplex headers in tail

**Resource Cleanup**
- On unsubscribe: removes event listeners, destroys streams
- On disconnect: cleans up all container subscriptions for that socket
- Prevents memory leaks

### Docker Integration

#### Dockerode Library
```javascript
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});
```

#### Key Methods Used
```javascript
docker.listContainers({ all: false })
  // Returns array of running containers

docker.getContainer(id)
  // Returns container instance

container.inspect()
  // Returns full container config
  // Used to detect TTY setting

container.logs({ stdout, stderr, tail })
  // Returns log buffer synchronously
  // Used for initial history

container.attach({ stream, stdout, stderr })
  // Returns readable stream
  // Used for live log streaming

container.stats({ stream: false })
  // Returns stats snapshot object
  // Contains CPU, memory, network, blkio data

container.start(), stop(), restart()
  // Lifecycle management
```

## Data Structures

### Log Line (Frontend)
```typescript
type LogLine = {
  text: string              // Content
  ts: number                // Timestamp (Date.now())
  stream: StreamType        // 'stdout' | 'stderr' | 'meta'
}
```

### Container (Shared)
```typescript
type Container = {
  Id: string                // Full container ID
  Names: string[]           // Container names (with /)
  Image: string             // Image name:tag
  State: string             // 'running', 'exited', etc.
  Status: string            // Human-readable status
}
```

### Container Stats
```typescript
type Stats = {
  cpu: {
    percent: number         // 0-100%
    cores: number           // CPU count
  }
  memory: {
    usage: number           // Bytes used
    limit: number           // Total limit
    percent: number         // 0-100%
  }
  network: {
    rx_bytes: number        // Bytes received
    tx_bytes: number        // Bytes transmitted
  }
  blkio: {
    read: number            // Bytes read
    write: number           // Bytes written
  }
  raw: object               // Full Docker stats object
}
```

## Communication Protocols

### HTTP/REST
- **Method**: HTTP/1.1
- **Format**: JSON
- **Purpose**: Stateless operations (list, stats, actions)
- **Port**: 5010 (backend)

### WebSocket (Socket.io)
- **Protocol**: Socket.io (fallback to HTTP polling if needed)
- **Format**: JSON events
- **Purpose**: Real-time log streaming
- **Connection**: Persistent
- **Reconnection**: Automatic with exponential backoff

### Docker Socket
- **Path**: `/var/run/docker.sock`
- **Protocol**: Unix socket (local only)
- **Access**: Requires Docker group membership or root
- **Format**: Docker API (protobuf-based)

## Scalability Considerations

### Current Limitations
1. **Single Backend Instance**: No load balancing
2. **In-Memory Streams**: All live containers kept in memory
3. **No Persistence**: Logs and stats not persisted
4. **8GB+ Docker Socket**: Handles ~50-100 containers comfortably

### Performance Optimizations Made
- **Log Buffering**: Cap 5000 lines per container (LRU eviction)
- **Stats Polling**: 3-second minimum interval (configurable)
- **Stream Demuxing**: Efficient demultiplexing of Docker output
- **Socket Resource Cleanup**: Proper unsubscribe/disconnect handling
- **Selective Subscription**: Only stream subscribed containers

### Future Scaling Options
1. **Multiple Backends**: Use load balancer with shared state
2. **Message Queue**: Use Redis to broadcast logs across instances
3. **Log Aggregation**: Store in Elasticsearch/Splunk
4. **Metrics Database**: Time-series DB (InfluxDB/Prometheus)
5. **Worker Threads**: Offload heavy computation
6. **Container Grouping**: Reduce memory usage for large fleets

## Security Model

### Current State
- **No Authentication**: Assumes local/trusted network
- **No Authorization**: All users have full control
- **CORS**: Wide open (`*` by default, configurable)
- **Docker Socket**: Read-write access (default)

### Security Concerns
⚠️ **Docker Socket Access**: Equivalent to `sudo` on the host
- Can stop critical containers
- Can inspect sensitive data
- Can mount arbitrary paths

### Recommended Security Measures
1. **Network Isolation**
   - Run in private Docker network
   - Restrict port 5010/5173 to trusted IPs
   - Use reverse proxy (nginx) with auth

2. **Container Restrictions**
   - Mount socket read-only (affects start/stop/restart)
   - Run backend as non-root user
   - Use AppArmor/SELinux profiles

3. **Application Logic**
   - Add user authentication layer
   - Implement role-based access control
   - Audit logging for all actions
   - Rate limiting on API endpoints

4. **Deployment**
   - Use private Docker registry
   - Sign images
   - Run in isolated environment
   - Monitor resource usage

## Error Handling

### Frontend Error Handling
- **WebSocket Errors**: Emit 'error' event from server
- **REST Errors**: HTTP status codes (500)
- **Connection Loss**: Socket.io auto-reconnect
- **User Feedback**: Error messages in UI

### Backend Error Handling
```javascript
// Try-catch on async operations
try {
  const container = docker.getContainer(id)
  await container.start()
  res.json({ ok: true })
} catch (err) {
  console.error('start error', err)
  res.status(500).json({ error: String(err) })
}

// Safe socket emission
function safeEmit(socket, ev, payload) {
  try {
    socket.emit(ev, payload)
  } catch (e) {
    console.warn('emit failed', e)
  }
}
```

### Common Errors
1. **Docker Socket Not Found**: No Docker installed
2. **Permission Denied**: User not in docker group
3. **Cannot Connect to Docker**: Docker daemon not running
4. **Container Not Found**: ID invalid or container removed
5. **Stream Already Subscribed**: Duplicate subscription
6. **WebSocket Connection Failed**: Network/firewall issue

## Future Architecture Improvements

1. **Microservices**
   - Separate log aggregator service
   - Separate stats collector service
   - Separate auth/authorization service

2. **Event-Driven**
   - Use message queue (RabbitMQ, Redis)
   - Event sourcing for audit trail
   - Real-time notifications

3. **Caching**
   - Redis caching for container list
   - Stats aggregation and caching

4. **Monitoring**
   - Prometheus metrics export
   - Health checks and alerts
   - Application performance monitoring

5. **Testing**
   - Unit tests for utilities
   - Integration tests for API
   - E2E tests for UI workflows

---

**Last Updated**: February 2026
