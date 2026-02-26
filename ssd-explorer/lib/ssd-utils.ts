// lib/ssd-utils.ts
export type SSDEntry = {
    brand: string;
    model: string;
    interface?: string;
    form_factor?: string;
    capacities?: string;
    controller?: string;
    configuration?: string;
    dram?: string;
    hmb?: string;
    nand_brand?: string;
    nand_type?: string;
    layers?: string;
    rw_speed?: string;
    categories?: string;
    notes?: string;
    note?: string;
    product_page?: string;
    product_page_2?: string;
    affiliate_link?: string;
};

export function transformRowsToData(rows: any[]): {
    arr: SSDEntry[];
    excluded: any[];
} {
    if (!rows || !rows.length) return { arr: [], excluded: [] };
    const body = rows.slice(1);
    const arr: SSDEntry[] = [];
    const excluded: any[] = [];
    for (const row of body) {
        const r = Array.from(row ?? []).map((c) =>
            c === null || c === undefined ? '' : c,
        );
        if (!r[0]) {
            excluded.push(r);
        } else {
            arr.push({
                brand: String(r[0] ?? '').trim(),
                model: String(r[1] ?? '').trim(),
                interface: String(r[2] ?? '').trim(),
                form_factor: String(r[3] ?? '').trim(),
                capacities: String(r[4] ?? '').trim(),
                controller: String(r[5] ?? '').trim(),
                configuration: String(r[6] ?? '').trim(),
                dram: String(r[7] ?? '').trim(),
                hmb: String(r[8] ?? '').trim(),
                nand_brand: String(r[9] ?? '').trim(),
                nand_type: String(r[10] ?? '').trim(),
                layers: String(r[11] ?? '').trim(),
                rw_speed: String(r[12] ?? '').trim(),
                categories: String(r[13] ?? '').trim(),
                notes: String(r[14] ?? '').trim(),
                product_page: String(r[15] ?? '').trim(),
                product_page_2: String(r[16] ?? '').trim(),
                affiliate_link: String(r[17] ?? '').trim(),
            });
        }
    }
    return { arr, excluded };
}

export function parseCapacityRangeString(s: string) {
    const [a, b] = s.split('-').map((x) => Number(x));
    return {
        min: Number.isFinite(a) ? a : 0,
        max: Number.isFinite(b) ? b : Infinity,
    };
}

export function matchesCapacityRange(
    capacityField: string | undefined,
    range: { min: number; max: number },
) {
    if (!capacityField) return false;
    const tokens = capacityField
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
    for (const t of tokens) {
        const matched = t.match(/([\d.]+)\s*(tb|gb|g|t)?/i);
        if (!matched) continue;
        let val = Number(matched[1]);
        const unit = (matched[2] || 'gb').toLowerCase();
        if (unit.startsWith('t')) val = val * 1024;
        if (val >= range.min && val <= range.max) return true;
    }
    return false;
}

export function getUniqueValues(list: SSDEntry[], key: keyof SSDEntry) {
    const s = new Set<string>();
    for (const it of list) {
        const v = String(it[key] ?? '').trim();
        if (v) s.add(v);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
}
