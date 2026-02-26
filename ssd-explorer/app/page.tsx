// app/page.tsx  (server component)
import SheetExplorerClient from '@/components/SSDExplorerClient';
import { parseGvizJson } from '@/lib/sheet';

export const revalidate = 3600; // 1 hour

export default async function Page() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
        return (
            <main className='p-8'>
                <h1 className='text-xl font-semibold'>SSD Explorer</h1>
                <p className='text-sm text-red-500'>No GOOGLE_SHEET_ID set.</p>
            </main>
        );
    }

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const text = await res.text();
    const rows = parseGvizJson(text);

    return (
        <main className='p-2 lg:p-4'>
            <SheetExplorerClient initialRows={rows} />
        </main>
    );
}
