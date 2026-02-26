// lib/fetcher.ts
export async function fetchSheetFromApi() {
    const res = await fetch('/api/sheets');
    if (!res.ok) return { rows: [] };
    const json = await res.json();
    if (json?.rows) return { rows: json.rows };
    return json;
}
