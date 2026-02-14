// // Minimal Docker log streamer using dockerode + socket.io
// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const Docker = require('dockerode');
// const { Server } = require('socket.io');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: '*' }
// });

// // Connect to docker socket on host
// const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// // REST endpoint: list containers (running)
// app.get('/api/containers', async (req, res) => {
//   try {
//     const containers = await docker.listContainers({ all: false });
//     const simplified = containers.map(c => ({
//       Id: c.Id,
//       Names: c.Names,
//       Image: c.Image,
//       State: c.State,
//       Status: c.Status
//     }));
//     res.json(simplified);
//   } catch (err) {
//     console.error('listContainers error', err);
//     res.status(500).json({ error: err.message || String(err) });
//   }
// });

// // Track active streams: { socketId: { containerId: stream } }
// const activeStreams = {};

// io.on('connection', (socket) => {
//   console.log('ws connected', socket.id);

//   socket.on('subscribe', async ({ id }) => {
//     if (!id) return;
//     activeStreams[socket.id] = activeStreams[socket.id] || {};
//     if (activeStreams[socket.id][id]) return;

//     try {
//       const container = docker.getContainer(id);
//       const stream = await container.attach({ stream: true, stdout: true, stderr: true });

//       // send recent logs (tail)
//       container.logs({ stdout: true, stderr: true, tail: 500 }, (err, initial) => {
//         if (!err && initial) {
//           socket.emit('log', { id, line: initial.toString('utf8') });
//         }
//       });

//       const onData = (chunk) => {
//         socket.emit('log', { id, line: chunk.toString('utf8') });
//       };
//       stream.on('data', onData);

//       stream.on('end', () => {
//         socket.emit('log', { id, line: '\\n--- log stream ended ---\\n' });
//       });
//       stream.on('error', (er) => {
//         console.warn('stream error', er);
//       });

//       activeStreams[socket.id][id] = { stream, onData };
//       console.log(`socket ${socket.id} subscribed to ${id}`);
//     } catch (err) {
//       console.error('subscribe error', err);
//       socket.emit('error', { message: 'subscribe failed', detail: String(err) });
//     }
//   });

//   socket.on('unsubscribe', ({ id }) => {
//     const entry = activeStreams[socket.id] && activeStreams[socket.id][id];
//     if (entry) {
//       try {
//         entry.stream.removeAllListeners('data');
//         entry.stream.destroy();
//       } catch (e) {}
//       delete activeStreams[socket.id][id];
//     }
//   });

//   socket.on('disconnect', () => {
//     const subs = activeStreams[socket.id] || {};
//     Object.values(subs).forEach(({ stream }) => {
//       try { stream.destroy(); } catch (e) {}
//     });
//     delete activeStreams[socket.id];
//     console.log('ws disconnected', socket.id);
//   });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Docker log streamer running on port ${PORT}`);
// });

// server/server.js
'use strict';

/**
 * Docker log streamer (complete)
 *
 * - GET /api/containers
 * - Socket.IO events:
 *   - client -> 'subscribe' { id }   : subscribe to a container's logs
 *   - client -> 'unsubscribe' { id } : stop streaming that container for this socket
 *   - server -> 'log' { id, stream, line } : emitted for every complete line
 *
 * Implementation notes:
 * - For non-TTY containers Docker multiplexes stdout/stderr. We demux with docker.modem.demuxStream.
 * - For TTY containers the attach stream is raw (no multiplex); treat as stdout.
 * - For initial tail we request stdout and stderr independently to avoid multiplex headers.
 *
 * Security reminder: mounting /var/run/docker.sock grants powerful host access.
 * Do not expose this service publicly without authentication or network controls.
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const Docker = require('dockerode');
const { Server } = require('socket.io');
const stream = require('stream');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
    },
    // pingTimeout/pingInterval can be tuned if needed
});

// Connect to Docker socket
const docker = new Docker({
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
});

// Simple endpoint to list running containers
app.get('/api/containers', async (req, res) => {
    try {
        // list only running containers by default
        const containers = await docker.listContainers({ all: false });
        const simplified = containers.map((c) => ({
            Id: c.Id,
            Names: c.Names,
            Image: c.Image,
            State: c.State,
            Status: c.Status,
        }));
        res.json(simplified);
    } catch (err) {
        console.error('listContainers error', err);
        res.status(500).json({ error: String(err) });
    }
});

// Active stream bookkeeping: { [socketId]: { [containerId]: entry } }
const activeStreams = Object.create(null);

/**
 * Helper: ensure per-socket map exists
 */
function ensureSocketMap(socketId) {
    if (!activeStreams[socketId]) activeStreams[socketId] = Object.create(null);
    return activeStreams[socketId];
}

/**
 * Helper: safe emit to socket (catches errors)
 */
function safeEmit(socket, ev, payload) {
    try {
        socket.emit(ev, payload);
    } catch (e) {
        // ignore
        console.warn('emit failed', e);
    }
}

/**
 * Subscribe handler: attaches to container and streams demuxed lines.
 *
 * Behavior:
 * - Inspects container to detect TTY.
 * - Sends initial tail for stdout and stderr separately (tail: 500 lines).
 * - Attaches live stream and either demuxes (non-tty) or treats as plain stream (tty).
 * - Buffers partial lines per stream and only emits complete lines to client with stream tag.
 */
io.on('connection', (socket) => {
    console.log('ws connected', socket.id);

    socket.on('subscribe', async ({ id }) => {
        if (!id) return;
        const sockMap = ensureSocketMap(socket.id);
        if (sockMap[id]) {
            // already subscribed from this socket
            return;
        }

        try {
            const container = docker.getContainer(id);

            // inspect container to detect TTY (if TTY true => raw stream, not multiplexed)
            let info = null;
            try {
                info = await container.inspect();
            } catch (inspectErr) {
                console.warn('container.inspect failed', inspectErr);
            }
            const isTty = !!(info && info.Config && info.Config.Tty);

            // Helper to emit multiple lines safely
            const emitLines = (streamName, text) => {
                if (!text) return;
                const parts = String(text).split(/\r?\n/).filter(Boolean);
                for (const p of parts) {
                    safeEmit(socket, 'log', {
                        id,
                        stream: streamName,
                        line: p,
                    });
                }
            };

            // 1) Send initial tail for stdout and stderr separately
            try {
                // stdout tail
                container.logs(
                    { stdout: true, stderr: false, tail: 500 },
                    (err, stdoutBuf) => {
                        if (!err && stdoutBuf && stdoutBuf.length) {
                            emitLines('stdout', stdoutBuf.toString('utf8'));
                        }
                    }
                );
                // stderr tail
                container.logs(
                    { stdout: false, stderr: true, tail: 500 },
                    (err, stderrBuf) => {
                        if (!err && stderrBuf && stderrBuf.length) {
                            emitLines('stderr', stderrBuf.toString('utf8'));
                        }
                    }
                );
            } catch (tailErr) {
                console.warn('initial tail failed', tailErr);
            }

            // 2) Attach to live stream
            const attachedStream = await container.attach({
                stream: true,
                stdout: true,
                stderr: true,
            });

            // Ensure the stream is flowing
            if (typeof attachedStream.resume === 'function')
                attachedStream.resume();

            if (isTty) {
                // TTY containers: stream is raw, treat all as stdout
                const buf = { stdout: '' };
                const onData = (chunk) => {
                    try {
                        buf.stdout += chunk.toString('utf8');
                        const lines = buf.stdout.split(/\r?\n/);
                        buf.stdout = lines.pop() || '';
                        for (const l of lines)
                            safeEmit(socket, 'log', {
                                id,
                                stream: 'stdout',
                                line: l,
                            });
                    } catch (e) {
                        console.warn('tty onData error', e);
                    }
                };

                attachedStream.on('data', onData);
                attachedStream.on('end', () =>
                    safeEmit(socket, 'log', {
                        id,
                        stream: 'meta',
                        line: '--- log stream ended ---',
                    })
                );
                attachedStream.on('error', (er) =>
                    console.warn('attach error', er)
                );

                // store bookkeeping
                sockMap[id] = { attachedStream, isTty: true, onData };
                console.log(
                    `socket ${socket.id} subscribed to ${id} (tty=true)`
                );
            } else {
                // Non-TTY: demux the multiplexed stream into stdout/stderr
                const stdoutStream = new stream.PassThrough();
                const stderrStream = new stream.PassThrough();

                // demux the attached stream into the two pass-through streams
                docker.modem.demuxStream(
                    attachedStream,
                    stdoutStream,
                    stderrStream
                );

                // per-stream buffers to assemble complete lines
                const buf = { stdout: '', stderr: '' };

                const onStdout = (chunk) => {
                    try {
                        buf.stdout += chunk.toString('utf8');
                        const lines = buf.stdout.split(/\r?\n/);
                        buf.stdout = lines.pop() || '';
                        for (const l of lines)
                            safeEmit(socket, 'log', {
                                id,
                                stream: 'stdout',
                                line: l,
                            });
                    } catch (e) {
                        console.warn('stdout onData error', e);
                    }
                };

                const onStderr = (chunk) => {
                    try {
                        buf.stderr += chunk.toString('utf8');
                        const lines = buf.stderr.split(/\r?\n/);
                        buf.stderr = lines.pop() || '';
                        for (const l of lines)
                            safeEmit(socket, 'log', {
                                id,
                                stream: 'stderr',
                                line: l,
                            });
                    } catch (e) {
                        console.warn('stderr onData error', e);
                    }
                };

                stdoutStream.on('data', onStdout);
                stderrStream.on('data', onStderr);

                // handle end / errors
                attachedStream.on('end', () =>
                    safeEmit(socket, 'log', {
                        id,
                        stream: 'meta',
                        line: '--- log stream ended ---',
                    })
                );
                attachedStream.on('error', (er) =>
                    console.warn('attach error', er)
                );

                // store bookkeeping so we can clean up later
                sockMap[id] = {
                    attachedStream,
                    stdoutStream,
                    stderrStream,
                    isTty: false,
                    handlers: { onStdout, onStderr },
                };

                console.log(
                    `socket ${socket.id} subscribed to ${id} (tty=false, demuxing)`
                );
            }
        } catch (err) {
            console.error('subscribe error', err);
            safeEmit(socket, 'error', {
                message: 'subscribe failed',
                detail: String(err),
            });
        }
        
    });

    socket.on('unsubscribe', ({ id }) => {
        const sockMap = activeStreams[socket.id];
        if (!sockMap) return;
        const entry = sockMap[id];
        if (!entry) return;

        try {
            if (entry.isTty) {
                if (entry.onData && entry.attachedStream) {
                    entry.attachedStream.removeListener('data', entry.onData);
                }
                if (
                    entry.attachedStream &&
                    typeof entry.attachedStream.destroy === 'function'
                ) {
                    try {
                        entry.attachedStream.destroy();
                    } catch (e) {}
                }
            } else {
                // non-tty: cleanup stdout/stderr passThroughs and attached stream
                if (entry.stdoutStream) {
                    if (entry.handlers && entry.handlers.onStdout)
                        entry.stdoutStream.removeListener(
                            'data',
                            entry.handlers.onStdout
                        );
                    try {
                        entry.stdoutStream.destroy();
                    } catch (e) {}
                }
                if (entry.stderrStream) {
                    if (entry.handlers && entry.handlers.onStderr)
                        entry.stderrStream.removeListener(
                            'data',
                            entry.handlers.onStderr
                        );
                    try {
                        entry.stderrStream.destroy();
                    } catch (e) {}
                }
                if (
                    entry.attachedStream &&
                    typeof entry.attachedStream.destroy === 'function'
                ) {
                    try {
                        entry.attachedStream.destroy();
                    } catch (e) {}
                }
            }
        } catch (cleanupErr) {
            console.warn('unsubscribe cleanup err', cleanupErr);
        } finally {
            delete sockMap[id];
        }
    });

    socket.on('disconnect', () => {
        // cleanup all streams for this socket
        const sockMap = activeStreams[socket.id] || {};
        for (const id of Object.keys(sockMap)) {
            const entry = sockMap[id];
            try {
                if (entry.isTty) {
                    if (entry.onData && entry.attachedStream)
                        entry.attachedStream.removeListener(
                            'data',
                            entry.onData
                        );
                    if (
                        entry.attachedStream &&
                        typeof entry.attachedStream.destroy === 'function'
                    )
                        entry.attachedStream.destroy();
                } else {
                    if (entry.stdoutStream) {
                        if (entry.handlers && entry.handlers.onStdout)
                            entry.stdoutStream.removeListener(
                                'data',
                                entry.handlers.onStdout
                            );
                        try {
                            entry.stdoutStream.destroy();
                        } catch (e) {}
                    }
                    if (entry.stderrStream) {
                        if (entry.handlers && entry.handlers.onStderr)
                            entry.stderrStream.removeListener(
                                'data',
                                entry.handlers.onStderr
                            );
                        try {
                            entry.stderrStream.destroy();
                        } catch (e) {}
                    }
                    if (
                        entry.attachedStream &&
                        typeof entry.attachedStream.destroy === 'function'
                    ) {
                        try {
                            entry.attachedStream.destroy();
                        } catch (e) {}
                    }
                }
            } catch (e) {
                // ignore cleanup errors
            }
            delete sockMap[id];
        }
        delete activeStreams[socket.id];
        console.log('ws disconnected', socket.id);
    });
});

const PORT = parseInt(process.env.PORT || '5010', 10);
server.listen(PORT, () => {
    console.log(`Docker log streamer running on port ${PORT}`);
});
