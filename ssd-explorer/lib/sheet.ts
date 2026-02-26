// lib/sheet.ts
export function parseGvizJson(text: string) {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) return [];
        const jsonStr = text.slice(start, end + 1);
        const obj = JSON.parse(jsonStr);

        if (!obj.table || !obj.table.rows) return [];

        // Convert each row.c[] into an array of cell values (like your old rows)
        const rows = obj.table.rows.map(
            (r: any) => r.c?.map((cell: any) => (cell ? cell.v : '')) ?? [],
        );
        return rows;
    } catch (err) {
        console.error('parseGvizJson error', err);
        return [];
    }
}
