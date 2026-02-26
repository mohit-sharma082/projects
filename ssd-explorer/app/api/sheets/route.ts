// app/api/sheets/route.ts
import { NextResponse } from 'next/server';
import { parseGvizJson } from '@/lib/sheet';

export async function GET() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) return NextResponse.json({ rows: [] }, { status: 400 });
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ rows: [] }, { status: 502 });
    const text = await res.text();
    const rows = parseGvizJson(text);
    const headers = {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    };
    return NextResponse.json({ rows }, { headers });
}
