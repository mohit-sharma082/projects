import React from 'react';
import LogViewer from './LogViewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Container } from '../App';
const StatsPanel = React.lazy(() => import('./StatsPanel'));

type Props = {
    container: Container;
    serverUrl: string;
};

export default function ContainerDetails({ container, serverUrl }: Props) {
    const idShort = container.Id.slice(0, 12);
    const name =
        container.Names && container.Names[0]
            ? container.Names[0].replace(/^\//, '')
            : idShort;

    return (
        <div className='h-full flex w-full'>
            <div className='min-h-90vh max-w-[2/3]'>
                <div className='w-[calc(100vw-40rem)] h-[94vh] overflow-hidden '>
                    <LogViewer
                        serverUrl={serverUrl}
                        containerId={container.Id}
                    />
                </div>
            </div>
            <div className='h-fit min-w-[20rem] p-4 border-l space-y-6'>
                <div>
                    <h2 className='text-xl font-semibold'>
                        {name}{' '}
                        <span className='text-sm text-slate-500'>
                            ({idShort})
                        </span>
                    </h2>
                    <div className='text-sm text-slate-600 mt-1'>
                        {container.Image} • {container.Status}
                    </div>
                </div>

                <div className='flex items-center flex-wrap gap-2'>
                    <Button size='sm' variant='ghost' disabled>
                        Start
                    </Button>
                    <Button size='sm' variant='ghost' disabled>
                        Stop
                    </Button>
                    <Button size='sm' variant='ghost' disabled>
                        Restart
                    </Button>
                    <Badge>{container.State}</Badge>
                </div>

                <StatsPanel containerId={container.Id} />
            </div>
        </div>
    );
}
