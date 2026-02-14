import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Container } from '../App';
import { RefreshCw } from 'lucide-react';

type Props = {
    serverUrl: string;
    onSelect: (c: Container) => void;
    selectedId?: string;
    globalQuery?: string;
};

export default function ContainersSidebar({
    serverUrl,
    onSelect,
    selectedId,
    globalQuery = '',
}: Props) {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [filterRunning, setFilterRunning] = useState<boolean>(true);

    useEffect(() => {
        fetchList();
        const id = setInterval(fetchList, 10000);
        return () => clearInterval(id);
    }, [serverUrl]);

    async function fetchList() {
        setLoading(true);
        try {
            const res = await fetch(`${serverUrl}/api/containers`);
            const data = await res.json();
            setContainers(data);
        } catch (err) {
            console.error('fetch containers', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = containers.filter((c) => {
        const name =
            c.Names && c.Names[0]
                ? c.Names[0].replace(/^\//, '')
                : c.Id.slice(0, 12);
        const queryMatch =
            !globalQuery ||
            name.toLowerCase().includes(globalQuery.toLowerCase()) ||
            c.Image.toLowerCase().includes(globalQuery.toLowerCase());
        const runningMatch = !filterRunning || c.State === 'running';
        return queryMatch && runningMatch;
    });

    return (
        <div className=' h-full flex flex-col'>
            <h3 className='font-medium p-6 pb-0'>Containers</h3>
            <div className='flex items-center justify-between p-4'>
                <div className='flex items-center gap-4'>
                    <Button size='sm' onClick={fetchList} variant='ghost'>
                        <RefreshCw />
                        Refresh
                    </Button>
                    <Button
                        size='sm'
                        onClick={() => setFilterRunning((s) => !s)}
                        variant={filterRunning ? 'default' : 'ghost'}>
                        {filterRunning ? 'Running' : 'All'}
                    </Button>
                </div>
            </div>

            <ScrollArea className='flex-1'>
                <div className='space-y-4 p-4'>
                    {loading && (
                        <div className='text-sm text-slate-500'>Loading...</div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className='text-sm text-slate-500'>
                            No containers match.
                        </div>
                    )}

                    {filtered.map((c) => {
                        const id = c.Id;
                        const name =
                            c.Names && c.Names[0]
                                ? c.Names[0].replace(/^\//, '')
                                : id.slice(0, 12);
                        const isSelected = selectedId === id;
                        return (
                            <Card
                                key={id}
                                onClick={() => onSelect(c)}
                                className={`p-4 cursor-pointer ${
                                    isSelected ? 'ring-4 ring-primary' : ''
                                }`}>
                                <div className='flex items-start justify-between'>
                                    <div>
                                        <div className='font-medium text-sm'>
                                            {name}
                                        </div>
                                        <div className='text-xs text-slate-500'>
                                            {c.Image}
                                        </div>
                                    </div>
                                    <div className='text-right'>
                                        <Badge
                                            variant={
                                                c.State === 'running'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }>
                                            {c.State}
                                        </Badge>
                                        <div className='text-xs text-slate-400 mt-1'>
                                            {c.Status}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
