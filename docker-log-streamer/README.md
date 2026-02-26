# Docker Log Streamer

A real-time Docker container monitoring dashboard with live log streaming, container management, and performance metrics visualization.

## Overview

Docker Log Streamer is a web-based application that provides a unified interface for monitoring Docker containers. It streams container logs in real-time, displays live performance metrics (CPU, memory, network I/O), and allows quick container lifecycle management—all without needing to access the command line.

## Problems It Solves

- **Real-time Log Monitoring**: Stream logs from multiple Docker containers simultaneously in a clean web interface
- **Performance Visibility**: View CPU usage, memory consumption, network I/O, and block I/O stats at a glance
- **Container Management**: Start, stop, and restart containers directly from the UI
- **Developer Experience**: Eliminates the need to remember Docker CLI commands like `docker logs`, `docker stats`, etc.
- **Multi-container Tracking**: Monitor multiple containers in parallel without terminal tab switching
- **Search & Filter**: Quickly find containers by name or image
- **Local Development**: Perfect for development environments where you need quick visibility into container behavior

## Features

✨ **Real-time Log Streaming**
- Live log updates via WebSocket for minimal latency
- Support for both TTY and non-TTY containers
- Automatic stdout/stderr demultiplexing for cleaner log separation
- Tail history on initial connection (500 lines)
- Pause/resume capability for log inspection

📊 **Container Statistics**
- CPU usage percentage and core count
- Memory usage and limit with percentage
- Network I/O (receive/transmit bytes)
- Block I/O (read/write bytes)
- Auto-refreshing stats every 3 seconds

🎮 **Container Management**
- List all running containers with status
- Start, stop, and restart containers from UI
- View container details (ID, names, image, status)
- Search and filter containers globally

🎨 **User Interface**
- Modern React-based frontend with Tailwind CSS
- Dark/light theme toggle
- Responsive design
- Real-time metrics dashboard
- Syntax highlighting for logs
- Export logs to file

🐳 **Docker Integration**
- Uses Dockerode library for Docker API interaction
- Supports Docker Socket mounting for container access
- Secure socket communication

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Headless components
- **Socket.io Client** - Real-time WebSocket communication
- **Lucide React** - Icons
- **React Syntax Highlighter** - Code formatting

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **Socket.io** - WebSocket server
- **Dockerode** - Docker API client
- **CORS** - Cross-origin support

## Architecture

See [Architecture.md](./Architecture.md) for detailed architecture documentation.

## Prerequisites

- Docker and Docker Daemon running
- Node.js 16+ (for local development)
- pnpm (optional, npm also works)

## Installation & Setup

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts the Docker Log Streamer service on port 3001. Access it at `http://localhost:3001`.

**Note**: The Docker socket is mounted as read-only, so the service can monitor but not modify containers (unless you change permissions).

### Option 2: Local Development

#### Backend Setup
```bash
cd server
npm install
npm start
```
The backend server runs on port 5010 (configurable via `PORT` env var).

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs on port 5173 (default Vite port).

**Environment Variables:**
- `PORT` (server): Server port (default: 5010)
- `DOCKER_SOCKET` (server): Docker socket path (default: `/var/run/docker.sock`)
- `CORS_ORIGIN` (server): CORS origin (default: `*`)
- `VITE_SERVER_URL` (frontend): Backend URL (default: `http://localhost:5010`)

## Usage

1. **Access the Dashboard**: Navigate to `http://localhost:3001` (or `http://localhost:5173` during dev)

2. **Select a Container**: Click on a container name in the left sidebar to view its details

3. **View Logs**: Logs stream in real-time. Use the pause/resume buttons to freeze the stream for inspection

4. **Monitor Stats**: Check CPU, memory, network, and block I/O metrics on the right panel

5. **Manage Containers**: Use the action buttons (Start/Stop/Restart) to control containers

6. **Search**: Use the global search bar at the top to filter containers

7. **Export Logs**: Click the export button to download logs as a file

## API Endpoints

### REST API
- `GET /api/containers` - List all running containers
- `GET /api/containers/:id/stats` - Get container stats snapshot
- `POST /api/containers/:id/start` - Start a container
- `POST /api/containers/:id/stop` - Stop a container
- `POST /api/containers/:id/restart` - Restart a container
- `GET /healthz` - Health check

### WebSocket Events
- `subscribe { id }` - Subscribe to container logs
- `unsubscribe { id }` - Unsubscribe from container logs
- `log { id, stream, line }` - Stream log event (server → client)
- `error { message, detail }` - Error event (server → client)

## Security Considerations

⚠️ **Important**: Mounting `/var/run/docker.sock` grants powerful host access equivalent to root privileges. 

**Security Best Practices**:
- Only run in trusted, local development environments
- Do not expose publicly without authentication
- Consider network isolation (use private Docker networks)
- Limit access to the application port (e.g., localhost only)
- Use read-only socket mount if only monitoring is needed
- Implement reverse proxy authentication for multi-user access
- Never expose the Docker socket directly over the internet

## Troubleshooting

**Issue**: Cannot connect to Docker daemon
- **Solution**: Ensure Docker daemon is running and socket path is correct
- Check: `ls -la /var/run/docker.sock`

**Issue**: "Permission denied" when accessing Docker socket
- **Solution**: Add user to docker group or run with appropriate permissions
- Note: This grants powerful access equivalent to sudo

**Issue**: Frontend cannot connect to backend
- **Solution**: Check `VITE_SERVER_URL` environment variable
- Ensure backend server is running on the specified port
- Check CORS settings

**Issue**: Logs not appearing
- **Solution**: Verify container is running and has active logs
- Check container is not in TTY-only mode
- Ensure container stdout/stderr is not disabled

## Performance Considerations

- **Log Buffering**: Frontend maintains max 5000 lines per container (older lines are automatically pruned)
- **Stats Polling**: Default 3-second refresh interval for performance metrics
- **WebSocket**: Automatically resumes after disconnect/reconnect
- **CPU**: Real-time log streaming scales efficiently with number of containers

## Development

### Project Structure
```
docker-log-streamer/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities
│   └── vite.config.ts
├── server/               # Node.js + Express backend
│   ├── routes/          # API route handlers
│   ├── socket.js        # WebSocket setup
│   └── docker.js        # Docker client
└── docker-compose.yml
```

### Building Frontend
```bash
cd frontend
npm run build
# Output: dist/
```

### Running Tests
Currently, there are no automated tests. Consider contributing test coverage!

## Contributing

Contributions are welcome! Areas for improvement:
- Add unit/integration tests
- Implement container filtering by label
- Add log search/highlighting
- Container health check display
- Metrics history/graphing
- Multi-host Docker monitoring
- User authentication
- Persistent log storage

## License

MIT (or add appropriate license)

## Future Enhancements

- 📈 Historical metrics graphing
- 📁 Log persistence and search
- 🏷️ Container tagging and grouping
- 🔐 Multi-user authentication
- 🌍 Remote Docker host support
- 🎯 Custom alerts and monitoring rules
- 🔌 Webhooks and integrations
- 📱 Mobile-responsive improvements

## Support

For issues, feature requests, or questions:
1. Check existing issues
2. Create a new issue with detailed description
3. Include error logs and environment details

---

**Happy monitoring!** 🐳✨
