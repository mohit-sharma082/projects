'use client';
import React, { memo } from 'react';
import type { SSDEntry } from '@/lib/ssd-utils';

const SSDCardInner = ({ item }: { item: SSDEntry }) => {
    return (
        <article
            className='
      group rounded-xl border bg-card p-4 shadow-sm
      transition-all duration-200
      hover:shadow-md hover:-translate-y-0.5
    '>
            <div className='space-y-2'>
                {/* Title */}
                <div>
                    <h3 className='group-hover:text-primary text-2xl font-bold leading-tight'>
                        {item.brand} {item.model}
                    </h3>

                    <p className='text-sm font-medium text-muted-foreground'>
                        {item.form_factor} • {item.interface}
                    </p>
                </div>

                {/* Key Specs */}
                <div className='flex items-center justify-between pt-2 border-t'>
                    <div>
                        <div className='text-lg font-semibold'>
                            {item.capacities || '—'}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                            Capacity
                        </div>
                    </div>

                    <div className='text-right'>
                        <div className='text-sm font-medium'>
                            {item.rw_speed || '—'}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                            RW Speed
                        </div>
                    </div>
                </div>

                {/* Extra chips */}
                <div className='flex flex-wrap gap-1 pt-2'>
                    {item.nand_type && (
                        <span className='px-2 py-0.5 rounded-md bg-muted text-xs'>
                            {item.nand_type}
                        </span>
                    )}
                    {item.dram && item.dram !== 'None' && (
                        <span className='px-2 py-0.5 rounded-md bg-muted text-xs'>
                            DRAM
                        </span>
                    )}
                    {item.hmb && item.hmb !== 'None' && (
                        <span className='px-2 py-0.5 rounded-md bg-muted text-xs'>
                            HMB
                        </span>
                    )}
                </div>

                {/* Notes */}
                {item.notes && (
                    <p className='text-xs text-muted-foreground line-clamp-3 pt-1'>
                        {item.notes}
                    </p>
                )}
                <div className='flex-1 h-full'></div>

                {/* Actions */}
                <div className='flex gap-2 pt-2'>
                    {item.product_page && (
                        <a
                            href={item.product_page}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs px-3 py-1 rounded-md border hover:bg-muted transition'>
                            Product
                        </a>
                    )}

                    {item.affiliate_link && (
                        <a
                            href={item.affiliate_link}
                            target='_blank'
                            rel='noreferrer'
                            className='text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition'>
                            Buy
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
};

export default memo(SSDCardInner);
