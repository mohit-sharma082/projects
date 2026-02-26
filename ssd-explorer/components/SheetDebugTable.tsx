// components/SheetDebugTable.tsx
'use client';
import React from 'react';

export default function SheetDebugTable({ rows }: { rows: any[] }) {
    // rows is array of arrays; first row likely header — adjust depending on your sheet
    const header = rows?.[0] ?? [];
    const body = rows?.slice(1) ?? [];

    return (
        <div className='p-4 text-xs'>
            <table className='w-full border rounded'>
                <thead>
                    <tr>
                        {header.map((h: any, i: number) => (
                            <th
                                key={i}
                                className='border-b border-l p-2 text-left'>
                                {String(h)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {body.map((row: any[], i: number) => (
                        <tr
                            key={i}
                            className={i % 2 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, j) => (
                                <td key={j} className='p-2 border-r'>
                                    {String(cell ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
