'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    LayoutGrid,
    List,
    SlidersHorizontal,
    ArrowUpDown,
    ChevronRight,
    Info,
    ArrowUpRightFromCircle,
    ExternalLink,
} from 'lucide-react';
import { ssdData } from '@/lib/ssd-data';

type SSD = {
    brand: string;
    model: string;
    interface: string;
    form_factor: string;
    capacities: string;
    controller: string;
    configuration: string;
    dram: string;
    hmb: string;
    nand_brand: string;
    nand_type: string;
    layers: string;
    rw_speed: string;
    categories: string;
    notes: string | null;
    product_page: string;
    product_page_2?: string | null;
    affiliate_link?: string | null;
};

export default function SSDBrowser() {
    // State for filters
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCapacities, setSelectedCapacities] = useState<string[]>([]);
    const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>([]);
    const [selectedNandTypes, setSelectedNandTypes] = useState<string[]>([]);

    // State for display options
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<string>('brand');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // State for selected SSD details
    const [selectedSSD, setSelectedSSD] = useState<SSD | null>(null);

    // Extract unique values for filters
    const brands = useMemo(() => {
        return [...new Set(ssdData.map((ssd) => ssd.brand))].sort();
    }, []);

    const categories: string[] = useMemo(() => {
        return [
            ...new Set(
                ssdData
                    .map((ssd) => ssd.categories)
                    .filter(
                        (cat): cat is string => typeof cat === 'string' && !!cat
                    )
            ),
        ].sort();
    }, []);

    const interfaces = useMemo(() => {
        return [...new Set(ssdData.map((ssd) => ssd.interface))].sort();
    }, []);

    const nandTypes = useMemo(() => {
        return [
            ...new Set(
                ssdData
                    .filter((ssd) => ssd.nand_type)
                    .map((ssd) => ssd.nand_type)
            ),
        ].sort();
    }, []);

    const capacityRanges = [
        'Below 500GB',
        '500GB-1TB',
        '1TB-2TB',
        '2TB-4TB',
        'Above 4TB',
    ];

    // Helper function to check if an SSD fits a capacity range
    const matchesCapacityRange = (capacities: string, range: string) => {
        if (!capacities) return false;

        const extractNumbers = (str: string) => {
            const matches = str.match(/\d+(?:\.\d+)?/g);
            return matches
                ? matches.map((match) => Number.parseFloat(match))
                : [];
        };

        const extractUnit = (str: string) => {
            const unit = str.match(/[A-Za-z]+/g);
            return unit ? unit[0] : 'GB';
        };

        // Extract numbers and normalize to GB
        const nums = extractNumbers(capacities);
        const unit = extractUnit(capacities);

        const convertToGB = (value: number, unit: string) => {
            if (unit.toUpperCase() === 'TB') return value * 1024;
            return value;
        };

        const capacityInGB = Math.max(
            ...nums.map((num) => convertToGB(num, unit))
        );

        switch (range) {
            case 'Below 500GB':
                return capacityInGB < 500;
            case '500GB-1TB':
                return capacityInGB >= 500 && capacityInGB <= 1024;
            case '1TB-2TB':
                return capacityInGB > 1024 && capacityInGB <= 2048;
            case '2TB-4TB':
                return capacityInGB > 2048 && capacityInGB <= 4096;
            case 'Above 4TB':
                return capacityInGB > 4096;
            default:
                return false;
        }
    };

    // Filter the SSDs based on selected filters
    const filteredSSDs = useMemo(() => {
        return ssdData.filter((ssd) => {
            // Search term filtering
            const searchMatch =
                searchTerm === '' ||
                (ssd.brand + ' ' + ssd.model)
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                (ssd.controller || '')
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            // Brand filtering
            const brandMatch =
                selectedBrands.length === 0 ||
                selectedBrands.includes(ssd.brand);

            // Category filtering
            const categoryMatch =
                selectedCategories.length === 0 ||
                (ssd.categories && selectedCategories.includes(ssd.categories));

            // Capacity filtering
            const capacityMatch =
                selectedCapacities.length === 0 ||
                selectedCapacities.some((range) =>
                    matchesCapacityRange(ssd?.capacities ?? '', range)
                );

            // Interface filtering
            const interfaceMatch =
                selectedInterfaces.length === 0 ||
                selectedInterfaces.includes(ssd.interface);

            // NAND type filtering
            const nandMatch =
                selectedNandTypes.length === 0 ||
                (ssd.nand_type && selectedNandTypes.includes(ssd.nand_type));

            return (
                searchMatch &&
                brandMatch &&
                categoryMatch &&
                capacityMatch &&
                interfaceMatch &&
                nandMatch
            );
        });
    }, [
        searchTerm,
        selectedBrands,
        selectedCategories,
        selectedCapacities,
        selectedInterfaces,
        selectedNandTypes,
    ]);

    // Sort the filtered SSDs
    const sortedSSDs = useMemo(() => {
        return [...filteredSSDs].sort((a, b) => {
            let valueA: any = a[sortBy as keyof SSD] || '';
            let valueB: any = b[sortBy as keyof SSD] || '';

            // Special handling for rw_speed
            if (
                sortBy === 'rw_speed' &&
                typeof valueA === 'string' &&
                typeof valueB === 'string'
            ) {
                const extractReadSpeed = (value: string) => {
                    const match = value.match(/^(\d+)/);
                    return match ? Number.parseInt(match[1], 10) : 0;
                };

                valueA = extractReadSpeed(valueA);
                valueB = extractReadSpeed(valueB);
            }

            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredSSDs, sortBy, sortDirection]);

    // Toggle filter selection
    const toggleFilter = (filter: string, value: string) => {
        switch (filter) {
            case 'brand':
                setSelectedBrands((prev) =>
                    prev.includes(value)
                        ? prev.filter((brand) => brand !== value)
                        : [...prev, value]
                );
                break;
            case 'category':
                setSelectedCategories((prev) =>
                    prev.includes(value)
                        ? prev.filter((cat) => cat !== value)
                        : [...prev, value]
                );
                break;
            case 'capacity':
                setSelectedCapacities((prev) =>
                    prev.includes(value)
                        ? prev.filter((cap) => cap !== value)
                        : [...prev, value]
                );
                break;
            case 'interface':
                setSelectedInterfaces((prev) =>
                    prev.includes(value)
                        ? prev.filter((intf) => intf !== value)
                        : [...prev, value]
                );
                break;
            case 'nand_type':
                setSelectedNandTypes((prev) =>
                    prev.includes(value)
                        ? prev.filter((nand) => nand !== value)
                        : [...prev, value]
                );
                break;
        }
    };

    // Toggle sort direction or change sort field
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortDirection('asc');
        }
    };

    // Format read/write speeds for display
    const formatRWSpeed = (rwSpeed: string | null) => {
        if (!rwSpeed) return 'N/A';

        const parts = rwSpeed.split('/');
        if (parts.length !== 2) return rwSpeed;

        return (
            <div className='flex flex-col'>
                <span>
                    <span className='font-semibold'>Read:</span> {parts[0]} MB/s
                </span>
                <span>
                    <span className='font-semibold'>Write:</span> {parts[1]}{' '}
                    MB/s
                </span>
            </div>
        );
    };

    // Format capacities for display
    const formatCapacities = (capacities: string | null) => {
        if (!capacities) return 'N/A';
        return capacities;
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedBrands([]);
        setSelectedCategories([]);
        setSelectedCapacities([]);
        setSelectedInterfaces([]);
        setSelectedNandTypes([]);
    };

    return (
        <div className='container mx-auto py-8 px-2 md:px-0'>
            <h1 className='text-3xl font-bold mb-2'>SSD Explorer</h1>
            <p className='text-muted-foreground mb-6'>
                Find the perfect SSD for your needs.
            </p>

            <div className='flex flex-col lg:flex-row gap-6'>
                {/* Sidebar Filters - Desktop */}
                <div className='hidden lg:block w-80 space-y-6'>
                    <div className='bg-card rounded-lg border p-4 sticky top-4'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-lg font-semibold'>Filters</h2>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={resetFilters}>
                                Reset
                            </Button>
                        </div>

                        <Accordion
                            type='multiple'
                            defaultValue={['brands', 'categories']}>
                            <AccordionItem value='brands'>
                                <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                    Brands ({selectedBrands.length || 'All'})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='space-y-2 max-h-64 overflow-y-auto pr-2'>
                                        {brands.map((brand, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center space-x-2'>
                                                <Checkbox
                                                    id={`brand-${brand}`}
                                                    checked={selectedBrands.includes(
                                                        brand
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            'brand',
                                                            brand
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`brand-${brand}`}
                                                    className='text-sm cursor-pointer w-full'>
                                                    {brand}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value='categories'>
                                <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                    Categories (
                                    {selectedCategories.length || 'All'})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='space-y-2 max-h-64 overflow-y-auto pr-2'>
                                        {categories.map((category, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center space-x-2'>
                                                <Checkbox
                                                    id={`category-${category}`}
                                                    checked={selectedCategories.includes(
                                                        category
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            'category',
                                                            category
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`category-${category}`}
                                                    className='text-sm cursor-pointer w-full'>
                                                    {category}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value='capacities'>
                                <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                    Capacities (
                                    {selectedCapacities.length || 'All'})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='space-y-2'>
                                        {capacityRanges.map((range, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center space-x-2'>
                                                <Checkbox
                                                    id={`capacity-${range}`}
                                                    checked={selectedCapacities.includes(
                                                        range
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            'capacity',
                                                            range
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`capacity-${range}`}
                                                    className='text-sm cursor-pointer w-full'>
                                                    {range}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value='interfaces'>
                                <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                    Interfaces (
                                    {selectedInterfaces.length || 'All'})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='space-y-2 max-h-64 overflow-y-auto pr-2'>
                                        {interfaces.map((intf, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center space-x-2'>
                                                <Checkbox
                                                    id={`interface-${intf}`}
                                                    checked={selectedInterfaces.includes(
                                                        intf
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            'interface',
                                                            intf
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`interface-${intf}`}
                                                    className='text-sm cursor-pointer w-full'>
                                                    {intf}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value='nand_types'>
                                <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                    NAND Types (
                                    {selectedNandTypes.length || 'All'})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className='space-y-2'>
                                        {nandTypes.map((type, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center space-x-2'>
                                                <Checkbox
                                                    id={`nand-${type}`}
                                                    checked={selectedNandTypes.includes(
                                                        type ?? ''
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            'nand_type',
                                                            type ?? ''
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={`nand-${type}`}
                                                    className='text-sm cursor-pointer w-full'>
                                                    {type}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                {/* Mobile Filters */}
                <div className='lg:hidden mb-4'>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant='outline' className='w-full'>
                                <SlidersHorizontal className='mr-2 h-4 w-4' />
                                Filters{' '}
                                {selectedBrands.length +
                                    selectedCategories.length +
                                    selectedCapacities.length +
                                    selectedInterfaces.length +
                                    selectedNandTypes.length >
                                    0 &&
                                    `(${
                                        selectedBrands.length +
                                        selectedCategories.length +
                                        selectedCapacities.length +
                                        selectedInterfaces.length +
                                        selectedNandTypes.length
                                    })`}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className='w-[90%]' side='left'>
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={resetFilters}
                                        className='mt-2'>
                                        Reset All
                                    </Button>
                                </SheetDescription>
                            </SheetHeader>
                            <div className='mt-4'>
                                <Accordion
                                    type='multiple'
                                    defaultValue={['brands', 'categories']}>
                                    <AccordionItem value='brands'>
                                        <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                            Brands (
                                            {selectedBrands.length || 'All'})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                                                {brands.map((brand, i) => (
                                                    <div
                                                        key={i}
                                                        className='flex items-center space-x-2'>
                                                        <Checkbox
                                                            id={`mobile-brand-${brand}`}
                                                            checked={selectedBrands.includes(
                                                                brand
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleFilter(
                                                                    'brand',
                                                                    brand
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`mobile-brand-${brand}`}
                                                            className='text-sm cursor-pointer w-full'>
                                                            {brand}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value='categories'>
                                        <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                            Categories (
                                            {selectedCategories.length || 'All'}
                                            )
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                                                {categories.map(
                                                    (category, i) => (
                                                        <div
                                                            key={i}
                                                            className='flex items-center space-x-2'>
                                                            <Checkbox
                                                                id={`mobile-category-${category}`}
                                                                checked={selectedCategories.includes(
                                                                    category
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleFilter(
                                                                        'category',
                                                                        category
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`mobile-category-${category}`}
                                                                className='text-sm cursor-pointer w-full'>
                                                                {category}
                                                            </label>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value='capacities'>
                                        <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                            Capacities (
                                            {selectedCapacities.length || 'All'}
                                            )
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-2'>
                                                {capacityRanges.map(
                                                    (range, i) => (
                                                        <div
                                                            key={i}
                                                            className='flex items-center space-x-2'>
                                                            <Checkbox
                                                                id={`mobile-capacity-${range}`}
                                                                checked={selectedCapacities.includes(
                                                                    range
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleFilter(
                                                                        'capacity',
                                                                        range
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`mobile-capacity-${range}`}
                                                                className='text-sm cursor-pointer w-full'>
                                                                {range}
                                                            </label>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value='interfaces'>
                                        <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                            Interfaces (
                                            {selectedInterfaces.length || 'All'}
                                            )
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                                                {interfaces.map((intf, i) => (
                                                    <div
                                                        key={i}
                                                        className='flex items-center space-x-2'>
                                                        <Checkbox
                                                            id={`mobile-interface-${intf}`}
                                                            checked={selectedInterfaces.includes(
                                                                intf
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleFilter(
                                                                    'interface',
                                                                    intf
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`mobile-interface-${intf}`}
                                                            className='text-sm cursor-pointer w-full'>
                                                            {intf}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value='nand_types'>
                                        <AccordionTrigger className='cursor-pointer hover:bg-accent/10'>
                                            NAND Types (
                                            {selectedNandTypes.length || 'All'})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-2'>
                                                {nandTypes.map((type, i) => (
                                                    <div
                                                        key={i}
                                                        className='flex items-center space-x-2'>
                                                        <Checkbox
                                                            id={`mobile-nand-${type}`}
                                                            checked={selectedNandTypes.includes(
                                                                type ?? ''
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleFilter(
                                                                    'nand_type',
                                                                    type ?? ''
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`mobile-nand-${type}`}
                                                            className='text-sm cursor-pointer w-full'>
                                                            {type}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content */}
                <div className='flex-1'>
                    {/* Search and View Controls */}
                    <div className='flex flex-col sm:flex-row gap-3 mb-6'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                            <Input
                                type='search'
                                placeholder='Search by brand, model, or controller...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-10'
                            />
                        </div>
                        <div className='flex gap-2'>
                            <Select
                                value={sortBy}
                                onValueChange={(value) => handleSort(value)}>
                                <SelectTrigger className='w-[180px]'>
                                    <div className='flex items-center gap-2'>
                                        <ArrowUpDown className='h-4 w-4' />
                                        <span>Sort by</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Sort Options</SelectLabel>
                                        <SelectItem value='brand'>
                                            Brand
                                        </SelectItem>
                                        <SelectItem value='model'>
                                            Model
                                        </SelectItem>
                                        <SelectItem value='rw_speed'>
                                            Read Speed
                                        </SelectItem>
                                        <SelectItem value='categories'>
                                            Category
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Button
                                variant='outline'
                                onClick={() =>
                                    setSortDirection((prev) =>
                                        prev === 'asc' ? 'desc' : 'asc'
                                    )
                                }
                                className='w-10 p-0'>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            </Button>

                            <div className='hidden sm:flex border rounded-md overflow-hidden'>
                                <Button
                                    variant={
                                        viewMode === 'grid'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    onClick={() => setViewMode('grid')}
                                    className='rounded-none'
                                    size='icon'>
                                    <LayoutGrid className='h-4 w-4' />
                                </Button>
                                <Button
                                    variant={
                                        viewMode === 'list'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    onClick={() => setViewMode('list')}
                                    className='rounded-none'
                                    size='icon'>
                                    <List className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <p className='text-muted-foreground'>
                            Showing {sortedSSDs.length} of {ssdData.length} SSDs
                        </p>

                        {/* Active filters */}
                        {selectedBrands.length +
                            selectedCategories.length +
                            selectedCapacities.length +
                            selectedInterfaces.length +
                            selectedNandTypes.length >
                            0 && (
                            <div className='flex flex-wrap gap-2 mt-2'>
                                {selectedBrands.map((brand, i) => (
                                    <Badge
                                        key={i}
                                        variant='secondary'
                                        className='gap-1 px-4 rounded-full'>
                                        {brand}
                                        <button
                                            className='ml-1 text-lg'
                                            onClick={() =>
                                                toggleFilter('brand', brand)
                                            }>
                                            ✕
                                        </button>
                                    </Badge>
                                ))}

                                {selectedCategories.map((category, i) => (
                                    <Badge
                                        key={i}
                                        variant='secondary'
                                        className='gap-1 px-4 rounded-full'>
                                        {category}
                                        <button
                                            className='ml-1 text-lg'
                                            onClick={() =>
                                                toggleFilter(
                                                    'category',
                                                    category
                                                )
                                            }>
                                            ✕
                                        </button>
                                    </Badge>
                                ))}

                                {selectedCapacities.map((capacity, i) => (
                                    <Badge
                                        key={i}
                                        variant='secondary'
                                        className='gap-1 px-4 rounded-full'>
                                        {capacity}
                                        <button
                                            className='ml-1 text-lg'
                                            onClick={() =>
                                                toggleFilter(
                                                    'capacity',
                                                    capacity
                                                )
                                            }>
                                            ✕
                                        </button>
                                    </Badge>
                                ))}

                                {selectedInterfaces.map((intf, i) => (
                                    <Badge
                                        key={i}
                                        variant='secondary'
                                        className='gap-1 px-4 rounded-full'>
                                        {intf}
                                        <button
                                            className='ml-1 text-lg'
                                            onClick={() =>
                                                toggleFilter('interface', intf)
                                            }>
                                            ✕
                                        </button>
                                    </Badge>
                                ))}

                                {selectedNandTypes.map((type, i) => (
                                    <Badge
                                        key={i}
                                        variant='secondary'
                                        className='gap-1 px-4 rounded-full'>
                                        {type} NAND
                                        <button
                                            className='ml-1 text-lg'
                                            onClick={() =>
                                                toggleFilter('nand_type', type)
                                            }>
                                            ✕
                                        </button>
                                    </Badge>
                                ))}

                                {selectedBrands.length +
                                    selectedCategories.length +
                                    selectedCapacities.length +
                                    selectedInterfaces.length +
                                    selectedNandTypes.length >
                                    1 && (
                                    <Button
                                        variant='ghost_destructive'
                                        onClick={resetFilters}
                                        className='cursor-pointer'>
                                        Clear all
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile View Tabs */}
                    <div className='sm:hidden mb-4'>
                        <Tabs
                            defaultValue='grid'
                            className='w-full'
                            onValueChange={(value) =>
                                setViewMode(value as 'grid' | 'list')
                            }>
                            <TabsList className='grid w-full grid-cols-2'>
                                <TabsTrigger
                                    value='grid'
                                    className='flex items-center gap-2'>
                                    <LayoutGrid className='h-4 w-4' /> Grid
                                </TabsTrigger>
                                <TabsTrigger
                                    value='list'
                                    className='flex items-center gap-2'>
                                    <List className='h-4 w-4' /> List
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* SSDs Grid View */}
                    {viewMode === 'grid' ? (
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 relative'>
                            {loading && (
                                <div className='h-full w-full absolute top-0 bg-foreground/10 animate-pulse py-4 flex items-center justify-center'></div>
                            )}
                            {sortedSSDs.length > 0 ? (
                                sortedSSDs.map((ssd, i) => (
                                    <Card key={i} className='overflow-hidden '>
                                        <CardHeader className='pb-3'>
                                            <CardTitle className='flex items-center justify-between'>
                                                <span className='truncate'>
                                                    {ssd.model}
                                                </span>
                                                <Badge
                                                    className={`border text-white font-semibold ${
                                                        ssd.categories
                                                            ?.toLowerCase()
                                                            ?.includes(
                                                                'high-end'
                                                            )
                                                            ? 'bg-purple-700'
                                                            : ssd.categories
                                                                  ?.toLowerCase()
                                                                  ?.includes(
                                                                      'mid-range'
                                                                  )
                                                            ? 'bg-amber-700'
                                                            : 'bg-emerald-700'
                                                    }`}>
                                                    {ssd.brand}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className='text-xs'>
                                                {ssd.interface} •{' '}
                                                {ssd.form_factor}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className='pb-3'>
                                            <div className='grid grid-cols-2 gap-2 text-sm'>
                                                <div>
                                                    <p className='text-muted-foreground text-sm font-medium tracking-wide '>
                                                        Capacities
                                                    </p>
                                                    <p className='font-medium'>
                                                        {formatCapacities(
                                                            ssd.capacities
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className='text-muted-foreground text-sm font-medium tracking-wide '>
                                                        Speed (MB/s)
                                                    </p>
                                                    <p className='font-medium'>
                                                        {ssd.rw_speed
                                                            ? ssd.rw_speed.split(
                                                                  '/'
                                                              )[0] +
                                                              ' / ' +
                                                              ssd.rw_speed.split(
                                                                  '/'
                                                              )[1]
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className='text-muted-foreground text-sm font-medium tracking-wide '>
                                                        NAND
                                                    </p>
                                                    <p className='font-medium'>
                                                        {ssd.nand_type || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className='text-muted-foreground text-sm font-medium tracking-wide '>
                                                        DRAM
                                                    </p>
                                                    <p className='font-medium'>
                                                        {ssd.dram || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className='pt-0'>
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button
                                                        variant='secondary'
                                                        // size='sm'
                                                        className='w-full cursor-pointer'
                                                        onClick={() => {
                                                            ssd &&
                                                                setSelectedSSD(
                                                                    ssd as unknown as SSD
                                                                );
                                                        }}>
                                                        View Details
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className='sm:max-w-xl p-2'>
                                                    <SheetHeader>
                                                        <SheetTitle>
                                                            {selectedSSD?.brand}{' '}
                                                            {selectedSSD?.model}
                                                        </SheetTitle>
                                                        <SheetDescription>
                                                            {selectedSSD?.categories && (
                                                                <Badge className='mt-2 font-semibold'>
                                                                    {
                                                                        selectedSSD.categories
                                                                    }
                                                                </Badge>
                                                            )}
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <div className='p-4 space-y-6'>
                                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Interface
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.interface ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Form Factor
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.form_factor ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Capacities
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.capacities ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Read/Write
                                                                    Speed
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.rw_speed ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Controller
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.controller ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Configuration
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.configuration ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    DRAM
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.dram ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    HMB
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.hmb ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    NAND Brand
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.nand_brand ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    NAND Type
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.nand_type ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                    Layers
                                                                </h4>
                                                                <p>
                                                                    {selectedSSD?.layers ||
                                                                        'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {selectedSSD?.notes && (
                                                            <div>
                                                                <h4 className='font-medium mb-1'>
                                                                    Notes
                                                                </h4>
                                                                <p>
                                                                    {
                                                                        selectedSSD.notes
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className='pt-4 grid md:grid-cols-2 gap-4'>
                                                            {selectedSSD?.product_page && (
                                                                <Button
                                                                    variant='outline'
                                                                    className='w-full'
                                                                    size={'lg'}
                                                                    asChild>
                                                                    <a
                                                                        href={
                                                                            selectedSSD.product_page ??
                                                                            ssd?.product_page_2
                                                                        }
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='flex items-center justify-center gap-2'>
                                                                        <Info />
                                                                        Product
                                                                        Page
                                                                    </a>
                                                                </Button>
                                                            )}

                                                            {selectedSSD?.affiliate_link && (
                                                                <Button
                                                                    className='w-full'
                                                                    size={'lg'}
                                                                    asChild>
                                                                    <a
                                                                        href={
                                                                            selectedSSD.affiliate_link
                                                                        }
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='flex items-center justify-center gap-2'>
                                                                        <ExternalLink
                                                                            className=''
                                                                            strokeWidth={
                                                                                2.5
                                                                            }
                                                                        />
                                                                        Buy Now
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className='col-span-full text-center py-12'>
                                    <p className='text-muted-foreground'>
                                        No SSDs match your filters.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // List View
                        <div className='overflow-hidden rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className='cursor-pointer hover:bg-muted/50'
                                            onClick={() => handleSort('brand')}>
                                            Brand{' '}
                                            {sortBy === 'brand' &&
                                                (sortDirection === 'asc'
                                                    ? '↑'
                                                    : '↓')}
                                        </TableHead>
                                        <TableHead
                                            className='cursor-pointer hover:bg-muted/50'
                                            onClick={() => handleSort('model')}>
                                            Model{' '}
                                            {sortBy === 'model' &&
                                                (sortDirection === 'asc'
                                                    ? '↑'
                                                    : '↓')}
                                        </TableHead>
                                        <TableHead>Interface</TableHead>
                                        <TableHead
                                            className='cursor-pointer hover:bg-muted/50'
                                            onClick={() =>
                                                handleSort('categories')
                                            }>
                                            Category{' '}
                                            {sortBy === 'categories' &&
                                                (sortDirection === 'asc'
                                                    ? '↑'
                                                    : '↓')}
                                        </TableHead>
                                        <TableHead>Capacities</TableHead>
                                        <TableHead
                                            className='cursor-pointer hover:bg-muted/50'
                                            onClick={() =>
                                                handleSort('rw_speed')
                                            }>
                                            Speed{' '}
                                            {sortBy === 'rw_speed' &&
                                                (sortDirection === 'asc'
                                                    ? '↑'
                                                    : '↓')}
                                        </TableHead>
                                        <TableHead className='text-right'>
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedSSDs.length > 0 ? (
                                        sortedSSDs.map((ssd, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    {ssd.brand}
                                                </TableCell>
                                                <TableCell>
                                                    {ssd.model}
                                                </TableCell>
                                                <TableCell className='hidden md:table-cell'>
                                                    {ssd.interface}
                                                </TableCell>
                                                <TableCell className='hidden md:table-cell'>
                                                    {ssd.categories ? (
                                                        <Badge variant='outline'>
                                                            {ssd.categories}
                                                        </Badge>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                                <TableCell className='hidden md:table-cell'>
                                                    {formatCapacities(
                                                        ssd.capacities
                                                    )}
                                                </TableCell>
                                                <TableCell className='hidden md:table-cell'>
                                                    {ssd.rw_speed || 'N/A'}
                                                </TableCell>
                                                <TableCell className='text-right'>
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button
                                                                variant='ghost'
                                                                size='sm'
                                                                onClick={() => {
                                                                    ssd &&
                                                                        setSelectedSSD(
                                                                            ssd as unknown as SSD
                                                                        );
                                                                }}>
                                                                <span className='sr-only md:not-sr-only md:inline-block'>
                                                                    Details
                                                                </span>
                                                                <ChevronRight className='h-4 w-4 md:ml-2' />
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent className='sm:max-w-xl p-2'>
                                                            <SheetHeader>
                                                                <SheetTitle>
                                                                    {
                                                                        selectedSSD?.brand
                                                                    }{' '}
                                                                    {
                                                                        selectedSSD?.model
                                                                    }
                                                                </SheetTitle>
                                                                <SheetDescription>
                                                                    {selectedSSD?.categories && (
                                                                        <Badge className='mt-2'>
                                                                            {
                                                                                selectedSSD.categories
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                </SheetDescription>
                                                            </SheetHeader>
                                                            <div className='space-y-6 p-4'>
                                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
                                                                    <div>
                                                                        <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                            Interface
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.interface ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                            Form
                                                                            Factor
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.form_factor ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-semibold text-xs text-muted-foreground mb-1 tracking-wide'>
                                                                            Capacities
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.capacities ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            Read/Write
                                                                            Speed
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.rw_speed ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            Controller
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.controller ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            Configuration
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.configuration ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            DRAM
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.dram ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            HMB
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.hmb ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            NAND
                                                                            Brand
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.nand_brand ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            NAND
                                                                            Type
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.nand_type ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className='font-medium text-sm text-muted-foreground mb-1'>
                                                                            Layers
                                                                        </h4>
                                                                        <p>
                                                                            {selectedSSD?.layers ||
                                                                                'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {selectedSSD?.notes && (
                                                                    <div>
                                                                        <h4 className='font-medium mb-1'>
                                                                            Notes
                                                                        </h4>
                                                                        <p>
                                                                            {
                                                                                selectedSSD.notes
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className='pt-4 space-y-2'>
                                                                    {selectedSSD?.product_page && (
                                                                        <Button
                                                                            variant='outline'
                                                                            className='w-full'
                                                                            asChild>
                                                                            <a
                                                                                href='#'
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className='flex items-center justify-center gap-2'>
                                                                                <Info className='h-4 w-4' />
                                                                                Product
                                                                                Page
                                                                            </a>
                                                                        </Button>
                                                                    )}

                                                                    {selectedSSD?.affiliate_link && (
                                                                        <Button
                                                                            className='w-full'
                                                                            asChild>
                                                                            <a
                                                                                href='#'
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className='flex items-center justify-center gap-2'>
                                                                                <ArrowUpRightFromCircle className='h-4 w-4' />
                                                                                Buy
                                                                                Now
                                                                            </a>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className='h-24 text-center'>
                                                No SSDs match your filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
