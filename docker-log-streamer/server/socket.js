'use strict';

/**
 * Socket.IO handling for streaming docker logs.
 *
 * Exported function:
 *   initSockets(server, docker)
 *
 * Behavior:
 *  - handles 'subscribe' and 'unsubscribe' per socket
 *  - inspects container TTY to decide whether to demux
 *  - sends initial tails for stdout/stderr separately (avoids mux headers)
 *  - demuxes live stream for non-TTY containers using docker.modem.demuxStream
 *  - emits 'log' events: { id, stream: 'stdout'|'stderr'|'meta', line }
 */

const { Server } = require('socket.io');
const stream = require('stream');

const { safeEmit, ensureSocketMap } = require('./utils');

function initSockets(server, docker) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
        },
        // optional tuning:
        // pingInterval: 25000,
        // pingTimeout: 60000,
    });

    // Active stream bookkeeping: { [socketId]: { [containerId]: entry } }
    const activeStreams = Object.create(null);

    io.on('connection', (socket) => {
        console.log('ws connected', socket.id);

        socket.on('subscribe', async ({ id }) => {
            if (!id) return;
            const sockMap = ensureSocketMap(activeStreams, socket.id);
            if (sockMap[id]) {
                // already subscribed for this socket
                return;
            }

            try {
                const container = docker.getContainer(id);

                // Inspect container to detect TTY
                let info = null;
                try {
                    info = await container.inspect();
                } catch (inspectErr) {
                    console.warn('container.inspect failed', inspectErr);
                }
                const isTty = !!(info && info.Config && info.Config.Tty);

                // Helper: emit lines split by newline, tagged with stream name
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

                // Send initial tails independently for stdout and stderr
                try {
                    container.logs(
                        { stdout: true, stderr: false, tail: 500 },
                        (err, stdoutBuf) => {
                            if (!err && stdoutBuf && stdoutBuf.length) {
                                emitLines('stdout', stdoutBuf.toString('utf8'));
                            }
                        }
                    );
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

                // Attach live stream (multiplexed for non-TTY)
                const attachedStream = await container.attach({
                    stream: true,
                    stdout: true,
                    stderr: true,
                });

                // Ensure flow
                if (typeof attachedStream.resume === 'function')
                    attachedStream.resume();

                if (isTty) {
                    // TTY: treat as raw stream (all stdout)
                    const buf = { stdout: '' };
                    const onData = (chunk) => {
                        try {
                            buf.stdout += chunk.toString('utf8');
                            const lines = buf.stdout.split(/\r?\n/);
                            buf.stdout = lines.pop() || '';
                            for (const l of lines) {
                                safeEmit(socket, 'log', {
                                    id,
                                    stream: 'stdout',
                                    line: l,
                                });
                            }
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
                    // Non-TTY: set up demux
                    const stdoutStream = new stream.PassThrough();
                    const stderrStream = new stream.PassThrough();

                    // demux into two streams
                    if (docker.modem && docker.modem.demuxStream) {
                        docker.modem.demuxStream(
                            attachedStream,
                            stdoutStream,
                            stderrStream
                        );
                    } else {
                        // fallback: if no demux available, pipe all to stdoutStream
                        attachedStream.pipe(stdoutStream);
                    }

                    // Buffers to assemble full lines per stream
                    const buf = { stdout: '', stderr: '' };

                    const onStdout = (chunk) => {
                        try {
                            buf.stdout += chunk.toString('utf8');
                            const lines = buf.stdout.split(/\r?\n/);
                            buf.stdout = lines.pop() || '';
                            for (const l of lines) {
                                safeEmit(socket, 'log', {
                                    id,
                                    stream: 'stdout',
                                    line: l,
                                });
                            }
                        } catch (e) {
                            console.warn('stdout onData error', e);
                        }
                    };

                    const onStderr = (chunk) => {
                        try {
                            buf.stderr += chunk.toString('utf8');
                            const lines = buf.stderr.split(/\r?\n/);
                            buf.stderr = lines.pop() || '';
                            for (const l of lines) {
                                safeEmit(socket, 'log', {
                                    id,
                                    stream: 'stderr',
                                    line: l,
                                });
                            }
                        } catch (e) {
                            console.warn('stderr onData error', e);
                        }
                    };

                    stdoutStream.on('data', onStdout);
                    stderrStream.on('data', onStderr);

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

                    // store bookkeeping for cleanup
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
                        entry.attachedStream.removeListener(
                            'data',
                            entry.onData
                        );
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
}

module.exports = { initSockets };
