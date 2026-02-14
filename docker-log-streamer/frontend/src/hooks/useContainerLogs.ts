import { useEffect, useRef, useState, useCallback } from 'react';
import { socketManager } from '@/lib/socket';

export type LogLine = { line: string; stream: 'stdout' | 'stderr' | 'meta'; ts: number };

export function useContainerLogs(containerId?: string) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const pausedRef = useRef(false);

  const append = useCallback((payload: any) => {
    if (!payload) return;
    const ts = Date.now();
    setLines(prev => {
      const added = Array.isArray(payload.line)
        ? payload.line.map((l: string) => ({ line: l, stream: payload.stream || 'stdout', ts }))
        : [{ line: payload.line, stream: payload.stream || 'stdout', ts }];
      const merged = prev.concat(added);
      return merged.length > 5000 ? merged.slice(merged.length - 5000) : merged;
    });
  }, []);

  useEffect(() => {
    if (!containerId) return;
    const unsubscribe = socketManager.subscribe(containerId, (payload: any) => {
      if (pausedRef.current) return;
      append(payload);
    });
    return () => {
      unsubscribe();
      setLines([]);
    };
  }, [containerId, append]);

  return {
    lines,
    clear: () => setLines([]),
    pause: () => { pausedRef.current = true; },
    resume: () => { pausedRef.current = false; },
  };
}
