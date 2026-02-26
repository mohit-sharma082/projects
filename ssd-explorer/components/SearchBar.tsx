// components/SearchBar.tsx
'use client';
import React, { useEffect, useState } from 'react';

type Props = {
    initialValue?: string;
    placeholder?: string;
    onSearch: (q: string) => void;
};

export default function SearchBar({
    initialValue = '',
    placeholder = 'Search...',
    onSearch,
}: Props) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        const id = setTimeout(() => onSearch(value), 250);
        return () => clearTimeout(id);
    }, [value, onSearch]);

    return (
        <input
            aria-label='Search'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className='w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition'
        />
    );
}
