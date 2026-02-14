import React, { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';

// shadcn components (adjust paths if your alias differs)
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const ContainersSidebar = React.lazy(
    () => import('./components/ContainersSidebar')
);
const ContainerDetails = React.lazy(
    () => import('./components/ContainerDetails')
);

import './App.css';
import { ModeToggle } from './components/mode-toggle';

export type Container = {
    Id: string;
    Names?: string[];
    Image: string;
    State: string;
    Status: string;
};

export default function App() {
    const [selectedContainer, setSelectedContainer] =
        useState<Container | null>(null);
    const [serverUrl, setServerUrl] = useState<string>(
        import.meta.env.VITE_SERVER_URL || 'http://localhost:5010'
    );
    const [globalQuery, setGlobalQuery] = useState<string>('');

    return (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <div className='max-h-screen max-w-[100%]'>
                <header className='flex items-center justify-between px-4 h-[6vh]  border-b  '>
                    <div className='flex items-center gap-4'>
                        <h1 className='text-lg font-semibold'>
                            Docker Monitor
                        </h1>
                        <Badge variant='secondary'>Local</Badge>
                        <Input
                            value={serverUrl}
                            onChange={(e) =>
                                setServerUrl(
                                    (e.target as HTMLInputElement).value
                                )
                            }
                            placeholder='Backend URL (VITE_SERVER_URL)'
                            className='w-72'
                        />
                    </div>

                    <div className='flex items-center gap-4'>
                        <ModeToggle />
                        <Input
                            placeholder='Global search containers...'
                            value={globalQuery}
                            onChange={(e) =>
                                setGlobalQuery(
                                    (e.target as HTMLInputElement).value
                                )
                            }
                            className='w-64'
                        />
                    </div>
                </header>

                <div className='flex flex-1 overflow-hidden'>
                    <aside className='w-[20rem] h-[94vh] border-r '>
                        <ContainersSidebar
                            serverUrl={serverUrl}
                            onSelect={setSelectedContainer}
                            selectedId={selectedContainer?.Id}
                            globalQuery={globalQuery}
                        />
                    </aside>

                    <main className='max-w-[calc(100vw-20rem)] h-[94vh] flex-1 relative'>
                        {selectedContainer ? (
                            <ContainerDetails
                                container={selectedContainer}
                                serverUrl={serverUrl}
                            />
                        ) : (
                            <div className='h-full flex items-center justify-center text-slate-500'>
                                Select a container to view details & logs
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
