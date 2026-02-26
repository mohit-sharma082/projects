// components/Pagination.tsx
'use client';
import React from 'react';

type Props = {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: Props) {
    const prev = () => onPageChange(Math.max(1, currentPage - 1));
    const next = () => onPageChange(Math.min(totalPages, currentPage + 1));
    return (
        <div className='flex items-center justify-between'>
            <div>
                <button
                    onClick={prev}
                    disabled={currentPage === 1}
                    className='px-3 py-1 rounded-md border text-sm mr-2'>
                    Prev
                </button>
                <button
                    onClick={next}
                    disabled={currentPage === totalPages}
                    className='px-3 py-1 rounded-md border text-sm'>
                    Next
                </button>
            </div>
            <div className='text-sm'>
                Page <strong>{currentPage}</strong> of{' '}
                <strong>{totalPages}</strong>
            </div>
        </div>
    );
}
