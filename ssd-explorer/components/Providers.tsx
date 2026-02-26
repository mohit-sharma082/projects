// components/Providers.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    const [persister, setPersister] = useState<any | null>(null);
    useEffect(() => {
        setPersister(
            createSyncStoragePersister({
                storage:
                    typeof window !== 'undefined'
                        ? window.localStorage
                        : undefined,
            }),
        );
    }, []);

    if (!persister) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister }}>
            {children}
        </PersistQueryClientProvider>
    );
}
