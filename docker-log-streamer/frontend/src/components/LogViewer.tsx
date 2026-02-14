import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

type StreamType = 'stdout' | 'stderr' | 'meta';

type LogLine = {
    text: string;
    ts: number;
    stream: StreamType;
};

type ServerLogPayload = {
    id: string;
    stream: StreamType;
    line: string;
};

export default function LogViewerSimple({
    serverUrl,
    containerId,
}: {
    serverUrl?: string;
    containerId: string;
}) {
    const [lines, setLines] = useState<LogLine[]>([]);
    const [follow, setFollow] = useState<boolean>(true);
    const [paused, setPaused] = useState<boolean>(false);

    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // refs to avoid re-attaching socket when paused/follow toggles
    const pausedRef = useRef(paused);
    const followRef = useRef(follow);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        followRef.current = follow;
    }, [follow]);

    // append chunk with stream info and cap total lines
    const appendChunk = useCallback(
        (chunk: string, stream: StreamType = 'stdout') => {
            if (!chunk) return;
            const parts = String(chunk).split(/\r?\n/).filter(Boolean);
            if (!parts.length) return;
            const now = Date.now();
            setLines((prev) => {
                const appended = parts.map((p, i) => ({
                    text: p,
                    ts: now + i,
                    stream,
                }));
                const merged = prev.concat(appended);
                const MAX = 5000;
                return merged.length > MAX
                    ? merged.slice(merged.length - MAX)
                    : merged;
            });
        },
        []
    );

    // create / manage socket per containerId
    useEffect(() => {
        if (!containerId) return;

        const url =
            serverUrl ||
            (import.meta.env.VITE_SERVER_URL as string) ||
            'http://localhost:5010';
        const socket = io(url, { transports: ['websocket'] });
        socketRef.current = socket;

        const onConnect = () => {
            try {
                socket.emit('subscribe', { id: containerId });
            } catch (e) {
                /* ignore */
            }
        };

        const onLog = (payload: ServerLogPayload | any) => {
            // payload may not be strongly typed if other servers/versions emit different shape
            if (!payload || payload.id !== containerId) return;
            // do not append when paused
            if (pausedRef.current) return;
            const line = payload.line ?? payload; // fallback
            const stream: StreamType = payload.stream ?? 'stdout';
            appendChunk(line, stream);
        };

        const onConnectError = (err: any) => {
            console.warn('socket connect_error', err);
        };

        socket.on('connect', onConnect);
        socket.on('log', onLog);
        socket.on('connect_error', onConnectError);

        // cleanup when containerId changes or component unmounts
        return () => {
            try {
                socket.emit('unsubscribe', { id: containerId });
            } catch (e) {
                // ignore
            }
            socket.off('connect', onConnect);
            socket.off('log', onLog);
            socket.off('connect_error', onConnectError);
            try {
                socket.disconnect();
            } catch (e) {
                /* ignore */
            }
            socketRef.current = null;
            // clear lines when switching containers
            setLines([]);
        };
        // intentionally exclude appendChunk/paused/follow refs - we want socket only to re-create when containerId or serverUrl changes
    }, [containerId, serverUrl]);

    // scroll to bottom when new lines arrive if follow is on
    useEffect(() => {
        if (!followRef.current) return;
        const el = scrollerRef.current;
        if (!el) return;
        // small timeout to ensure DOM updated
        const t = setTimeout(() => {
            try {
                el.scrollTop = el.scrollHeight;
            } catch (e) {
                // ignore
            }
        }, 30);
        return () => clearTimeout(t);
    }, [lines.length]);

    function downloadLogs() {
        const text = lines
            .map(
                (l) =>
                    `[${dayjs(l.ts).format('HH:mm:ss')}] ${
                        l.stream === 'stderr' ? '[ERR] ' : ''
                    }${l.text}`
            )
            .join('\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `container-${containerId.slice(0, 12)}-logs.txt`);
    }
    const isValidJSON = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    };

    const formatText = (t: string) => {
        const text = t?.replace(/[\x00-\x1F\x7F]+/g, ' ');
        // if (isValidJSON(text)) {
        //     try {
        //         const obj = JSON.parse(text);
        //         return JSON.stringify(obj, null, 4);
        //     } catch {
        //         return text;
        //     }
        // }
        return text;
    };

    // small helper to render a line with color based on stream
    const renderLine = (l: LogLine, idx: number, inverseIndex: number) => {
        const time = dayjs(l.ts).format('HH:mm:ss');
        const textClass =
            l.stream === 'stderr'
                ? 'text-rose-400'
                : l.stream === 'meta'
                ? 'text-amber-400'
                : '';

        return (
            <div
                key={`${l.ts}-${idx}`}
                className='whitespace-pre-wrap mb-4 break-words bg-gradient-to-r from-white to-white/10 dark:from-foreground/5 dark:to-gray-950/10 p-2 rounded'>
                <span className=' font-bold mr-4'>[{time}]</span>
                <span
                    className={cn(textClass, {
                        'text-foreground/80': inverseIndex >= 3,
                        'text-foreground/90': inverseIndex == 2,
                        'font-semibold': inverseIndex < 2,
                    })}>
                    {formatText(l.text)}
                </span>
            </div>
        );
    };

    return (
        <div className='flex flex-col h-full bg-background'>
            <div className='flex items-center gap-4 p-4 border-b'>
                <div className='flex gap-4'>
                    <Button size='sm' onClick={() => setFollow((s) => !s)}>
                        {follow ? 'Following' : 'Follow'}
                    </Button>
                    <Button size='sm' onClick={() => setPaused((p) => !p)}>
                        {paused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button size='sm' onClick={() => setLines([])}>
                        Clear
                    </Button>
                    <Button size='sm' onClick={downloadLogs}>
                        Download
                    </Button>
                </div>
                <div className='ml-auto text-xs text-slate-600'>
                    {lines.length} lines
                </div>
            </div>

            <div
                ref={scrollerRef}
                className='flex-1 overflow-y-auto p-4 font-mono text-sm leading-6 bg-gray-950/10 dark:bg-black'
                role='log'
                aria-live='polite'>
                {lines.length === 0 ? (
                    <div className='text-slate-400 p-4'>
                        Waiting for logs...
                    </div>
                ) : (
                    lines.map((l, i) => renderLine(l, i, lines.length - i - 1))
                )}
                <div className='py-4'></div>
            </div>
        </div>
    );
}
