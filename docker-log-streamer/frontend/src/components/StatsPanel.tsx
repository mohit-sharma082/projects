import { useContainerStats } from '@/hooks/useContainerStats';
import React, { useEffect, useMemo, useRef } from 'react';

function formatBytes(n?: number) {
    if (n == null) return '-';
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
}

type Props = {
    containerId: string;
    pollMs?: number;
};

export default function StatsPanel({ containerId, pollMs = 3000 }: Props) {
    const { stats, loading, error } = useContainerStats(containerId, pollMs);
    const cpuHistoryRef = useRef<number[]>([]);

    // push cpu percent into history when new stats arrive
    useEffect(() => {
        if (!stats || !stats.cpu || typeof stats.cpu.percent !== 'number')
            return;
        cpuHistoryRef.current.push(
            Math.max(0, Math.min(100, stats.cpu.percent))
        );
        if (cpuHistoryRef.current.length > 40) cpuHistoryRef.current.shift();
    }, [stats?.cpu?.percent]);

    const cpuHistory = cpuHistoryRef.current;

    const sparkline = useMemo(() => {
        if (!cpuHistory.length) return null;
        const w = 140;
        const h = 40;
        const max = Math.max(100, ...cpuHistory);
        const min = 0;
        const points = cpuHistory.map((v, i) => {
            const x = (i / (cpuHistory.length - 1 || 1)) * w;
            const y = h - ((v - min) / (max - min || 1)) * h;
            return `${x},${y}`;
        });
        return { w, h, points: points.join(' ') };
    }, [cpuHistory.join(',')]);

    const memUsage = stats?.memory?.usage;
    const memLimit = stats?.memory?.limit;
    const memPercent = stats?.memory?.percent;

    return (
        <div className='p-4 border rounded-md bg-background'>
            <div className='flex flex-col items-start gap-6'>
                <div className='min-w-[160px]'>
                    <div className='text-xs text-slate-500 mb-1'>CPU</div>
                    <div className='text-lg font-medium'>
                        {stats?.cpu?.percent != null
                            ? `${stats.cpu.percent.toFixed(1)}%`
                            : loading
                            ? 'loading…'
                            : '-'}
                    </div>
                    <div className='text-xs text-slate-400 mt-1'>
                        Cores: {stats?.cpu?.cores ?? '-'}
                    </div>
                </div>

                <div className='min-w-[220px]'>
                    <div className='text-xs text-slate-500 mb-1'>Memory</div>
                    <div className='text-base font-medium'>
                        {memUsage != null
                            ? `${formatBytes(memUsage)} / ${formatBytes(
                                  memLimit
                              )}`
                            : '-'}
                    </div>
                    <div className='text-xs text-slate-400 mt-1'>
                        {memPercent != null ? `${memPercent.toFixed(1)}%` : ''}
                    </div>
                </div>

                <div className='min-w-[160px]'>
                    <div className='text-xs text-slate-500 mb-1'>Network</div>
                    <div className='text-sm font-medium'>
                        RX {formatBytes(stats?.network?.rx_bytes)} • TX{' '}
                        {formatBytes(stats?.network?.tx_bytes)}
                    </div>
                </div>

                <div className='flex-1'>
                    <div className='text-xs text-slate-500 mb-1'>Block I/O</div>
                    <div className='text-sm'>
                        {formatBytes(stats?.blkio?.read)} read •{' '}
                        {formatBytes(stats?.blkio?.write)} write
                    </div>
                </div>

                {/* <div className='border border-destructive bg-primary/30'>
                    {sparkline ? (
                        <svg
                            width={sparkline.w}
                            height={sparkline.h}
                            viewBox={`0 0 ${sparkline.w} ${sparkline.h}`}
                            className='block'>
                            <polyline
                                fill='none'
                                stroke='currentColor'
                                strokeWidth={1.5}
                                points={sparkline.points}
                                strokeOpacity={0.75}
                                strokeLinejoin='round'
                                strokeLinecap='round'
                            />
                        </svg>
                    ) : (
                        <div className='text-xs text-slate-400'>no data</div>
                    )}
                </div> */}
            </div>

            {error ? (
                <div className='mt-3 text-sm text-rose-400'>
                    Stats error: {String(error)}
                </div>
            ) : null}
        </div>
    );
}
