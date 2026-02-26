// components/FiltersPanel.tsx
'use client';
import React, { useMemo } from 'react';

type Props = {
    brands: string[];
    interfaces: string[];
    nandTypes: string[];
    selectedBrands: string[];
    selectedInterfaces: string[];
    selectedNandTypes: string[];
    onToggleBrand: (b: string) => void;
    onToggleInterface: (i: string) => void;
    onToggleNandType: (n: string) => void;
    selectedCapacity: string | null;
    onSelectCapacity: (cap: string | null) => void;
};

const CAPACITY_PRESETS = [
    { id: '0-128', label: '≤ 128GB' },
    { id: '129-512', label: '129–512GB' },
    { id: '513-2048', label: '512GB–2TB' },
    { id: '2049-999999', label: '≥ 2TB' },
];

export default function FiltersPanel({
    brands,
    interfaces,
    nandTypes,
    selectedBrands,
    selectedInterfaces,
    selectedNandTypes,
    onToggleBrand,
    onToggleInterface,
    onToggleNandType,
    selectedCapacity,
    onSelectCapacity,
}: Props) {
    const brandsMapByLetter = useMemo(() => {
        return brands.reduce(
            (acc, brand) => {
                const letter = brand[0].toUpperCase();
                if (!acc[letter]) {
                    acc[letter] = [];
                }
                acc[letter].push(brand);
                return acc;
            },
            {} as Record<string, string[]>,
        );
    }, [brands]);
    return (
        <div className='space-y-4'>
            <div className='rounded-xl border bg-card p-4 space-y-3'>
                <h4 className='font-medium'>Capacity</h4>
                <div className='flex flex-col gap-2'>
                    <button
                        onClick={() => onSelectCapacity(null)}
                        className={`text-left px-3 py-1.5 rounded-md ${selectedCapacity === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                        All
                    </button>
                    {CAPACITY_PRESETS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onSelectCapacity(c.id)}
                            className={` text-left px-3 py-1.5 cursor-pointer rounded-md ${selectedCapacity === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='rounded-xl border bg-card p-4 space-y-4'>
                <h4 className='text font-medium'>Brands</h4>
                {brandsMapByLetter &&
                    Object.keys(brandsMapByLetter)
                        .sort()
                        .map((letter, li) => (
                            <div key={letter + li}>
                                <h5 className='text-sm font-bold pl-1 mt-2 text-muted-foreground/80'>
                                    {letter}
                                </h5>
                                <div className='flex flex-wrap gap-2 mb-3'>
                                    {brandsMapByLetter[letter].map((b) => {
                                        const active =
                                            selectedBrands.includes(b);
                                        return (
                                            <button
                                                key={b}
                                                onClick={() => onToggleBrand(b)}
                                                className={`px-3 py-1.5 cursor-pointer text-sm rounded-md border-2 lg:min-w-[40%] transition-all ${active ? 'bg-primary text-primary-foreground border-primary-foreground font-bold' : 'hover:bg-muted'}`}>
                                                {b}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
            </div>

            <div className='rounded-xl border bg-card p-4 space-y-3'>
                <h4 className='text font-medium'>Interface</h4>
                <div className='flex flex-wrap gap-2'>
                    {interfaces.map((i) => {
                        const active = selectedInterfaces.includes(i);
                        return (
                            <button
                                key={i}
                                onClick={() => onToggleInterface(i)}
                                className={`px-3 py-1.5 cursor-pointer text-sm rounded-md border-2 lg:min-w-[40%] transition-all ${active ? 'bg-primary text-primary-foreground border-primary-foreground font-bold' : 'hover:bg-muted'}`}>
                                {i}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className='rounded-xl border bg-card p-4 space-y-3'>
                <h4 className=' font-medium'>NAND</h4>
                <div className='flex flex-wrap gap-2'>
                    {nandTypes.map((n) => {
                        const active = selectedNandTypes.includes(n);
                        return (
                            <button
                                key={n}
                                onClick={() => onToggleNandType(n)}
                                className={`px-3 py-1.5 cursor-pointer text-sm rounded-md border-2 lg:min-w-[40%] transition-all ${active ? 'bg-primary text-primary-foreground border-primary-foreground font-bold' : 'hover:bg-muted'}`}>
                                {n}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
