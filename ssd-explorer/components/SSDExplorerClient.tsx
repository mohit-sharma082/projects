// components/SSDExplorerClient.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSheetFromApi } from '@/lib/fetcher';
import {
    transformRowsToData,
    type SSDEntry,
    matchesCapacityRange,
    parseCapacityRangeString,
    getUniqueValues,
} from '@/lib/ssd-utils';
import SearchBar from './SearchBar';
import FiltersPanel from './FiltersPanel';
import SSDCard from './SSDCard';
import Pagination from './Pagination';
import FiltersLeft from './FiltersLeft';
import FiltersRight from './FiltersRight';
type Props = {
    initialRows: any[]; // parsed gviz rows (array of arrays)
};

export default function SSDExplorerClient({ initialRows }: Props) {
    // Transform server-provided rows into structured { arr, excluded } once (memo)
    const initialStructured = useMemo(
        () => transformRowsToData(initialRows),
        [initialRows],
    );

    // React Query: keep a canonical source for background updates.
    // The API returns the same structured shape (arr & excluded) or we map it after fetch.
    const { data: fetchedData } = useQuery({
        queryKey: ['sheetData'],
        queryFn: async () => {
            const apiData = await fetchSheetFromApi();
            // normalize shape: allow either { rows } or { arr, excluded }
            if (apiData?.arr && Array.isArray(apiData.arr)) return apiData;
            if (apiData?.rows) return transformRowsToData(apiData.rows);
            return initialStructured;
        },
        initialData: initialStructured,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 15 * 60 * 1000,
        refetchIntervalInBackground: false,
    });

    const data = fetchedData ?? initialStructured;
    const allEntries = data.arr as SSDEntry[];

    // --- UI state (minimal)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>([]);
    const [selectedNandTypes, setSelectedNandTypes] = useState<string[]>([]);
    const [capacityFilter, setCapacityFilter] = useState<string | null>(null); // e.g., "0-256", "512-1024" or null
    const [sortBy, setSortBy] = useState<'relevance' | 'rw' | 'capacity'>(
        'relevance',
    );
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(24);

    // --- Derived filter options (memoized)
    const brands = useMemo(
        () => getUniqueValues(allEntries, 'brand'),
        [allEntries],
    );
    const interfaces = useMemo(
        () =>
            getUniqueValues(allEntries, 'interface').sort(
                (a, b) => a.length - b.length,
            ),
        [allEntries],
    );
    const nandTypes = useMemo(
        () => getUniqueValues(allEntries, 'nand_type'),
        [allEntries],
    );

    // --- Handlers (useCallback to keep child props stable)
    const toggleBrand = useCallback((brand: string) => {
        setPage(1);
        setSelectedBrands((prev) =>
            prev.includes(brand)
                ? prev.filter((b) => b !== brand)
                : [...prev, brand],
        );
    }, []);

    const toggleInterface = useCallback((itf: string) => {
        setPage(1);
        setSelectedInterfaces((prev) =>
            prev.includes(itf) ? prev.filter((i) => i !== itf) : [...prev, itf],
        );
    }, []);

    const toggleNandType = useCallback((n: string) => {
        setPage(1);
        setSelectedNandTypes((prev) =>
            prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
        );
    }, []);

    const onCapacityFilter = useCallback((cap: string | null) => {
        setPage(1);
        setCapacityFilter(cap);
    }, []);

    const onSearch = useCallback((s: string) => {
        setPage(1);
        setSearchTerm(s);
    }, []);

    const onSort = useCallback((s: typeof sortBy) => setSortBy(s), []);
    const onPageChange = useCallback((p: number) => setPage(p), []);
    const onPageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPage(1);
    }, []);

    // --- Filtering + sorting (heavy work memoized)
    const filteredSorted = useMemo(() => {
        let list = allEntries;

        // 1) text search (brand, model, notes, controller)
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            const tokens = q.split(/\s+/).filter(Boolean);
            list = list.filter((item) => {
                const hay =
                    `${item.brand} ${item.model} ${item.controller ?? ''} ${item.notes ?? ''}`.toLowerCase();
                return tokens.every((t) => hay.includes(t));
            });
        }

        // 2) brand filter
        if (selectedBrands.length) {
            const set = new Set(selectedBrands.map((s) => s.toLowerCase()));
            list = list.filter((it) =>
                set.has(String(it.brand ?? '').toLowerCase()),
            );
        }

        // 3) interface filter
        if (selectedInterfaces.length) {
            const set = new Set(selectedInterfaces.map((s) => s.toLowerCase()));
            list = list.filter((it) =>
                set.has(String(it.interface ?? '').toLowerCase()),
            );
        }

        // 4) nand type filter
        if (selectedNandTypes.length) {
            const set = new Set(selectedNandTypes.map((s) => s.toLowerCase()));
            list = list.filter((it) =>
                set.has(String(it.nand_type ?? '').toLowerCase()),
            );
        }

        // 5) capacity filter
        if (capacityFilter) {
            const range = parseCapacityRangeString(capacityFilter); // {min, max}
            list = list.filter((it) =>
                matchesCapacityRange(it.capacities, range),
            );
        }

        // 6) sorting
        if (sortBy === 'rw') {
            list = [...list].sort((a, b) => {
                // parse rw_speed rough numeric priority; put undefined at end
                const pa =
                    parseFloat(
                        String(a.rw_speed ?? '').replace(/[^\d.]/g, ''),
                    ) || 0;
                const pb =
                    parseFloat(
                        String(b.rw_speed ?? '').replace(/[^\d.]/g, ''),
                    ) || 0;
                return pb - pa;
            });
        } else if (sortBy === 'capacity') {
            list = [...list].sort((a, b) => {
                const ca =
                    parseFloat(
                        String(a.capacities ?? '').replace(/[^\d.]/g, ''),
                    ) || 0;
                const cb =
                    parseFloat(
                        String(b.capacities ?? '').replace(/[^\d.]/g, ''),
                    ) || 0;
                return cb - ca;
            });
        } else {
            // relevance - keep original order (sheet order) but we can prioritize brand/model hits
            // For simplicity, keep stable original order
            // nothing to do
        }

        return list;
    }, [
        allEntries,
        searchTerm,
        selectedBrands,
        selectedInterfaces,
        selectedNandTypes,
        capacityFilter,
        sortBy,
    ]);

    // --- Pagination
    const total = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = filteredSorted.slice(pageStart, pageStart + pageSize);

    return (
        <div>
            <div className='grid grid-cols-1 xl:grid-cols-[260px_1fr_260px] gap-6'>
                {/* LEFT */}
                <aside className='xl:sticky xl:top-4 h-fit'>
                    <FiltersLeft
                        brands={brands}
                        selectedBrands={selectedBrands}
                        onToggleBrand={toggleBrand}
                    />
                </aside>

                {/* CENTER */}
                <section className='space-y-4'>
                    {/* ===== Header ===== */}
                    <header className='space-y-1'>
                        <h1 className='text-2xl font-semibold tracking-tight text-primary'>
                            SSD Explorer
                        </h1>
                        <p className='text-sm text-muted-foreground'>
                            Browse controllers, NAND, speeds, and specs across
                            SSD models
                        </p>
                    </header>

                    {/* ===== Controls Bar ===== */}
                    <div className='flex flex-col gap-3 md:flex-row md:items-center'>
                        <div className='flex-1'>
                            <SearchBar
                                initialValue={searchTerm}
                                onSearch={onSearch}
                                placeholder='Search model, controller, notes…'
                            />
                        </div>

                        <div className='flex items-center gap-2'>
                            <select
                                value={sortBy}
                                onChange={(e) => onSort(e.target.value as any)}
                                className='h-9 rounded-md border bg-background px-3 text-sm'>
                                <option value='relevance'>Relevance</option>
                                <option value='rw'>RW Speed</option>
                                <option value='capacity'>Capacity</option>
                            </select>

                            <select
                                value={pageSize}
                                onChange={(e) =>
                                    onPageSizeChange(Number(e.target.value))
                                }
                                className='h-9 rounded-md border bg-background px-3 text-sm'>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                            </select>
                        </div>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        Showing{' '}
                        <span className='font-medium text-foreground'>
                            {pageItems.length}
                        </span>{' '}
                        of{' '}
                        <span className='font-medium text-foreground'>
                            {total}
                        </span>
                    </div>

                    {/* Card Grid */}
                    <div className='grid gap-4 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))]'>
                        {pageItems.map((item, index) => (
                            <SSDCard
                                key={`${item.brand}-${item.model}-${index}`}
                                item={item}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </section>

                {/* RIGHT */}
                <aside className='xl:sticky xl:top-4 h-fit'>
                    <FiltersRight
                        interfaces={interfaces}
                        nandTypes={nandTypes}
                        selectedInterfaces={selectedInterfaces}
                        selectedNandTypes={selectedNandTypes}
                        onToggleInterface={toggleInterface}
                        onToggleNandType={toggleNandType}
                        selectedCapacity={capacityFilter}
                        onSelectCapacity={onCapacityFilter}
                    />
                </aside>
            </div>
        </div>
    );

    return (
        <div className='w-full md:p-4'>
            {/* ===== Main Content ===== */}
            <div className='grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6'>
                {/* ===== Sidebar ===== */}
                <aside className='lg:sticky lg:top-4 h-fit'>
                    <FiltersPanel
                        brands={brands}
                        interfaces={interfaces}
                        nandTypes={nandTypes}
                        selectedBrands={selectedBrands}
                        selectedInterfaces={selectedInterfaces}
                        selectedNandTypes={selectedNandTypes}
                        onToggleBrand={toggleBrand}
                        onToggleInterface={toggleInterface}
                        onToggleNandType={toggleNandType}
                        selectedCapacity={capacityFilter}
                        onSelectCapacity={onCapacityFilter}
                    />
                </aside>

                {/* ===== Results ===== */}
                <section className='space-y-4'>
                    {/* ===== Header ===== */}
                    <header className='space-y-1'>
                        <h1 className='text-2xl font-semibold tracking-tight text-primary'>
                            SSD Explorer
                        </h1>
                        <p className='text-sm text-muted-foreground'>
                            Browse controllers, NAND, speeds, and specs across
                            SSD models
                        </p>
                    </header>

                    {/* ===== Controls Bar ===== */}
                    <div className='flex flex-col gap-3 md:flex-row md:items-center'>
                        <div className='flex-1'>
                            <SearchBar
                                initialValue={searchTerm}
                                onSearch={onSearch}
                                placeholder='Search model, controller, notes…'
                            />
                        </div>

                        <div className='flex items-center gap-2'>
                            <select
                                value={sortBy}
                                onChange={(e) => onSort(e.target.value as any)}
                                className='h-9 rounded-md border bg-background px-3 text-sm'>
                                <option value='relevance'>Relevance</option>
                                <option value='rw'>RW Speed</option>
                                <option value='capacity'>Capacity</option>
                            </select>

                            <select
                                value={pageSize}
                                onChange={(e) =>
                                    onPageSizeChange(Number(e.target.value))
                                }
                                className='h-9 rounded-md border bg-background px-3 text-sm'>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                            </select>
                        </div>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        Showing{' '}
                        <span className='font-medium text-foreground'>
                            {pageItems.length}
                        </span>{' '}
                        of{' '}
                        <span className='font-medium text-foreground'>
                            {total}
                        </span>
                    </div>

                    {/* Card Grid */}
                    <div className='grid gap-4 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))]'>
                        {pageItems.map((item, index) => (
                            <SSDCard
                                key={`${item.brand}-${item.model}-${index}`}
                                item={item}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </section>
            </div>
        </div>
    );
}
