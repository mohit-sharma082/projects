import { useEffect, useState, useCallback } from 'react';
import { getContainerStats } from '@/lib/api';

export type StatsSnapshot = {
    cpu: { percent: number; cores: number };
    memory: { usage: number; limit: number; percent: number };
    network: { rx_bytes: number; tx_bytes: number };
    blkio: { read: number; write: number };
    raw?: any;
};

export function useContainerStats(containerId?: string, pollMs = 3000) {
    const [stats, setStats] = useState<StatsSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!containerId) return;
        setLoading(true);
        setError(null);
        try {
            const data: any = await getContainerStats(containerId);
            setStats(data);
        } catch (e: any) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [containerId]);

    useEffect(() => {
        if (!containerId) {
            setStats(null);
            return;
        }
        fetch();
        const t = setInterval(fetch, pollMs);
        return () => clearInterval(t);
    }, [containerId, fetch, pollMs]);

    return { stats, loading, error, refresh: fetch };
}
